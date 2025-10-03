// Inventory management routes
const express = require('express');
const router = express.Router();

// Get all inventory items with stock levels
router.get('/', (req, res) => {
    const { category, low_stock_only, search } = req.query;
    
    let query = `
        SELECT ii.*, 
               CASE 
                   WHEN ii.current_stock <= ii.minimum_stock THEN 'low'
                   WHEN ii.current_stock <= (ii.minimum_stock * 1.5) THEN 'medium'
                   ELSE 'good'
               END as stock_status,
               u.full_name as created_by_name
        FROM inventory_items ii
        JOIN users u ON ii.created_by = u.id
        WHERE ii.is_active = 1
    `;
    
    const params = [];
    
    if (category) {
        query += ' AND ii.category = ?';
        params.push(category);
    }
    
    if (low_stock_only === 'true') {
        query += ' AND ii.current_stock <= ii.minimum_stock';
    }
    
    if (search) {
        query += ' AND (ii.item_name LIKE ? OR ii.item_code LIKE ? OR ii.brand LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY ii.item_name';
    
    req.db.all(query, params, (err, items) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(items);
    });
});

// Get single inventory item
router.get('/:id', (req, res) => {
    const itemId = req.params.id;
    
    req.db.get(`
        SELECT ii.*, u.full_name as created_by_name
        FROM inventory_items ii
        JOIN users u ON ii.created_by = u.id
        WHERE ii.id = ?
    `, [itemId], (err, item) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    });
});

// Create new inventory item
router.post('/', (req, res) => {
    const {
        item_code, item_name, category, brand, unit, current_stock,
        minimum_stock, maximum_stock, unit_cost, selling_price,
        supplier, expiry_date, batch_number, location
    } = req.body;

    req.db.run(`
        INSERT INTO inventory_items (
            item_code, item_name, category, brand, unit, current_stock,
            minimum_stock, maximum_stock, unit_cost, selling_price,
            supplier, expiry_date, batch_number, location, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        item_code, item_name, category, brand, unit, current_stock || 0,
        minimum_stock || 10, maximum_stock, unit_cost, selling_price,
        supplier, expiry_date, batch_number, location, req.user.id
    ], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Item code already exists' });
            }
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({ 
            id: this.lastID, 
            message: 'Inventory item created successfully' 
        });
    });
});

// Update inventory item
router.put('/:id', (req, res) => {
    const itemId = req.params.id;
    const {
        item_name, category, brand, unit, minimum_stock, maximum_stock,
        unit_cost, selling_price, supplier, expiry_date, batch_number, location
    } = req.body;

    req.db.run(`
        UPDATE inventory_items SET 
            item_name = ?, category = ?, brand = ?, unit = ?, minimum_stock = ?,
            maximum_stock = ?, unit_cost = ?, selling_price = ?, supplier = ?,
            expiry_date = ?, batch_number = ?, location = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
    `, [
        item_name, category, brand, unit, minimum_stock, maximum_stock,
        unit_cost, selling_price, supplier, expiry_date, batch_number, location, itemId
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({ message: 'Item updated successfully' });
    });
});

// Deactivate inventory item (soft delete)
router.delete('/:id', (req, res) => {
    const itemId = req.params.id;
    
    req.db.run(`
        UPDATE inventory_items SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `, [itemId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({ message: 'Item deactivated successfully' });
    });
});

// Stock adjustment
router.post('/:id/adjust-stock', (req, res) => {
    const itemId = req.params.id;
    const { adjustment_type, quantity, notes, unit_cost } = req.body;
    
    // First get current stock
    req.db.get('SELECT current_stock FROM inventory_items WHERE id = ? AND is_active = 1', 
        [itemId], (err, item) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        let newStock = item.current_stock;
        let transactionType = 'adjustment';
        let transactionQuantity = quantity;
        
        switch (adjustment_type) {
            case 'increase':
                newStock += quantity;
                transactionType = 'stock_in';
                break;
            case 'decrease':
                newStock -= quantity;
                transactionType = 'stock_out';
                transactionQuantity = -quantity;
                break;
            case 'set':
                transactionQuantity = quantity - item.current_stock;
                newStock = quantity;
                break;
        }
        
        if (newStock < 0) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }
        
        // Update stock and create transaction record
        req.db.serialize(() => {
            req.db.run('BEGIN TRANSACTION');
            
            // Update inventory
            req.db.run(`
                UPDATE inventory_items 
                SET current_stock = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `, [newStock, itemId], function(err) {
                if (err) {
                    req.db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Database error' });
                }
                
                // Create transaction record
                req.db.run(`
                    INSERT INTO inventory_transactions (
                        item_id, transaction_type, quantity, unit_cost, 
                        total_cost, reference_type, transaction_date, 
                        notes, recorded_by, approved_by
                    ) VALUES (?, ?, ?, ?, ?, ?, DATE('now'), ?, ?, ?)
                `, [
                    itemId, transactionType, transactionQuantity, unit_cost,
                    (unit_cost || 0) * Math.abs(transactionQuantity), 'adjustment',
                    notes, req.user.id, req.user.id
                ], function(err) {
                    if (err) {
                        req.db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Database error' });
                    }
                    
                    req.db.run('COMMIT');
                    res.json({
                        message: 'Stock adjusted successfully',
                        old_stock: item.current_stock,
                        new_stock: newStock,
                        adjustment: transactionQuantity
                    });
                });
            });
        });
    });
});

// Get inventory transactions for an item
router.get('/:id/transactions', (req, res) => {
    const itemId = req.params.id;
    const { limit = 50 } = req.query;
    
    req.db.all(`
        SELECT it.*, u.full_name as recorded_by_name, u2.full_name as approved_by_name
        FROM inventory_transactions it
        JOIN users u ON it.recorded_by = u.id
        LEFT JOIN users u2 ON it.approved_by = u2.id
        WHERE it.item_id = ?
        ORDER BY it.transaction_date DESC, it.created_at DESC
        LIMIT ?
    `, [itemId, parseInt(limit)], (err, transactions) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(transactions);
    });
});

// Get low stock alerts
router.get('/alerts/low-stock', (req, res) => {
    req.db.all(`
        SELECT ii.*, 
               (ii.minimum_stock - ii.current_stock) as shortage,
               u.full_name as created_by_name
        FROM inventory_items ii
        JOIN users u ON ii.created_by = u.id
        WHERE ii.current_stock <= ii.minimum_stock AND ii.is_active = 1
        ORDER BY (ii.minimum_stock - ii.current_stock) DESC
    `, [], (err, items) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(items);
    });
});

// Get expiring items
router.get('/alerts/expiring', (req, res) => {
    const { days = 30 } = req.query;
    
    req.db.all(`
        SELECT ii.*, 
               (julianday(ii.expiry_date) - julianday('now')) as days_to_expiry,
               u.full_name as created_by_name
        FROM inventory_items ii
        JOIN users u ON ii.created_by = u.id
        WHERE ii.expiry_date IS NOT NULL 
          AND ii.expiry_date <= date('now', '+' || ? || ' days')
          AND ii.is_active = 1
        ORDER BY ii.expiry_date ASC
    `, [days], (err, items) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(items);
    });
});

// Inventory analytics
router.get('/analytics/summary', (req, res) => {
    const queries = {
        totalItems: 'SELECT COUNT(*) as count FROM inventory_items WHERE is_active = 1',
        totalValue: `SELECT SUM(current_stock * unit_cost) as value FROM inventory_items 
                    WHERE is_active = 1 AND unit_cost IS NOT NULL`,
        lowStockCount: `SELECT COUNT(*) as count FROM inventory_items 
                       WHERE current_stock <= minimum_stock AND is_active = 1`,
        expiringCount: `SELECT COUNT(*) as count FROM inventory_items 
                       WHERE expiry_date <= date('now', '+30 days') AND is_active = 1`,
        categoryBreakdown: `SELECT category, COUNT(*) as count, 
                           SUM(current_stock * COALESCE(unit_cost, 0)) as value
                           FROM inventory_items WHERE is_active = 1 
                           GROUP BY category ORDER BY count DESC`
    };
    
    const results = {};
    let completed = 0;
    const total = Object.keys(queries).length;
    
    Object.entries(queries).forEach(([key, query]) => {
        req.db.all(query, [], (err, result) => {
            if (err) {
                console.error(`Error executing ${key} query:`, err);
                results[key] = key === 'categoryBreakdown' ? [] : { count: 0, value: 0 };
            } else {
                results[key] = key === 'categoryBreakdown' ? result : result[0];
            }
            
            completed++;
            if (completed === total) {
                res.json(results);
            }
        });
    });
});

// Get inventory categories
router.get('/categories', (req, res) => {
    req.db.all(`
        SELECT category, COUNT(*) as item_count 
        FROM inventory_items 
        WHERE is_active = 1 
        GROUP BY category 
        ORDER BY category
    `, [], (err, categories) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(categories);
    });
});

module.exports = router;