// Accounting module routes (expenses, receivables, assets)
const express = require('express');
const router = express.Router();

// ===================== EXPENSES =====================

// Get all expenses
router.get('/expenses', (req, res) => {
    const { category, date_from, date_to, approval_status } = req.query;
    
    let query = `
        SELECT e.*, u.full_name as recorded_by_name, u2.full_name as approved_by_name
        FROM expenses e
        JOIN users u ON e.recorded_by = u.id
        LEFT JOIN users u2 ON e.approved_by = u2.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (category) {
        query += ' AND e.category = ?';
        params.push(category);
    }
    
    if (date_from) {
        query += ' AND e.expense_date >= ?';
        params.push(date_from);
    }
    
    if (date_to) {
        query += ' AND e.expense_date <= ?';
        params.push(date_to);
    }
    
    if (approval_status) {
        query += ' AND e.approval_status = ?';
        params.push(approval_status);
    }
    
    query += ' ORDER BY e.expense_date DESC, e.created_at DESC';
    
    req.db.all(query, params, (err, expenses) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(expenses);
    });
});

// Create new expense
router.post('/expenses', (req, res) => {
    const {
        expense_date, category, description, amount, payment_method,
        receipt_number, vendor
    } = req.body;

    req.db.run(`
        INSERT INTO expenses (
            expense_date, category, description, amount, payment_method,
            receipt_number, vendor, recorded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        expense_date, category, description, amount, payment_method,
        receipt_number, vendor, req.user.id
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({ 
            id: this.lastID, 
            message: 'Expense recorded successfully' 
        });
    });
});

// Approve/reject expense
router.put('/expenses/:id/approve', (req, res) => {
    const expenseId = req.params.id;
    const { approval_status } = req.body; // 'approved' or 'rejected'

    req.db.run(`
        UPDATE expenses 
        SET approval_status = ?, approved_by = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `, [approval_status, req.user.id, expenseId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        
        res.json({ message: `Expense ${approval_status} successfully` });
    });
});

// Update expense
router.put('/expenses/:id', (req, res) => {
    const expenseId = req.params.id;
    const {
        expense_date, category, description, amount, payment_method,
        receipt_number, vendor
    } = req.body;

    req.db.run(`
        UPDATE expenses SET 
            expense_date = ?, category = ?, description = ?, amount = ?,
            payment_method = ?, receipt_number = ?, vendor = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND approval_status = 'pending'
    `, [
        expense_date, category, description, amount, payment_method,
        receipt_number, vendor, expenseId
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Expense not found or already approved' });
        }
        
        res.json({ message: 'Expense updated successfully' });
    });
});

// Delete expense (only pending ones)
router.delete('/expenses/:id', (req, res) => {
    const expenseId = req.params.id;
    
    req.db.run('DELETE FROM expenses WHERE id = ? AND approval_status = "pending"', 
        [expenseId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Expense not found or cannot be deleted' });
        }
        
        res.json({ message: 'Expense deleted successfully' });
    });
});

// Expense categories and totals
router.get('/expenses/categories', (req, res) => {
    const { date_from, date_to } = req.query;
    
    let query = `
        SELECT category, 
               COUNT(*) as count,
               SUM(amount) as total_amount,
               AVG(amount) as avg_amount
        FROM expenses 
        WHERE approval_status = 'approved'
    `;
    
    const params = [];
    
    if (date_from) {
        query += ' AND expense_date >= ?';
        params.push(date_from);
    }
    
    if (date_to) {
        query += ' AND expense_date <= ?';
        params.push(date_to);
    }
    
    query += ' GROUP BY category ORDER BY total_amount DESC';
    
    req.db.all(query, params, (err, categories) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(categories);
    });
});

// ===================== RECEIVABLES =====================

// Get all receivables
router.get('/receivables', (req, res) => {
    const { type, status, staff_id } = req.query;
    
    let query = `
        SELECT r.*, u.full_name as recorded_by_name, u2.full_name as staff_name
        FROM receivables r
        JOIN users u ON r.recorded_by = u.id
        LEFT JOIN users u2 ON r.staff_id = u2.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (type) {
        query += ' AND r.type = ?';
        params.push(type);
    }
    
    if (status) {
        query += ' AND r.repayment_status = ?';
        params.push(status);
    }
    
    if (staff_id) {
        query += ' AND r.staff_id = ?';
        params.push(staff_id);
    }
    
    query += ' ORDER BY r.issue_date DESC';
    
    req.db.all(query, params, (err, receivables) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(receivables);
    });
});

// Create new receivable
router.post('/receivables', (req, res) => {
    const {
        type, staff_id, description, amount, issue_date, due_date, notes
    } = req.body;

    req.db.run(`
        INSERT INTO receivables (
            type, staff_id, description, amount, issue_date, due_date, notes, recorded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        type, staff_id, description, amount, issue_date, due_date, notes, req.user.id
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({ 
            id: this.lastID, 
            message: 'Receivable recorded successfully' 
        });
    });
});

// Record receivable payment
router.post('/receivables/:id/payment', (req, res) => {
    const receivableId = req.params.id;
    const { payment_amount, notes } = req.body;
    
    // Get current receivable details
    req.db.get('SELECT * FROM receivables WHERE id = ?', [receivableId], (err, receivable) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!receivable) {
            return res.status(404).json({ error: 'Receivable not found' });
        }
        
        const newRepaidAmount = (receivable.repaid_amount || 0) + payment_amount;
        let repaymentStatus = 'pending';
        
        if (newRepaidAmount >= receivable.amount) {
            repaymentStatus = 'completed';
        } else if (newRepaidAmount > 0) {
            repaymentStatus = 'partial';
        }
        
        req.db.run(`
            UPDATE receivables SET 
                repaid_amount = ?, 
                repayment_status = ?, 
                last_payment_date = DATE('now'),
                notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [newRepaidAmount, repaymentStatus, notes, receivableId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({ 
                message: 'Payment recorded successfully',
                repaid_amount: newRepaidAmount,
                repayment_status: repaymentStatus
            });
        });
    });
});

// Update receivable
router.put('/receivables/:id', (req, res) => {
    const receivableId = req.params.id;
    const { description, due_date, notes } = req.body;

    req.db.run(`
        UPDATE receivables SET 
            description = ?, due_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [description, due_date, notes, receivableId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Receivable not found' });
        }
        
        res.json({ message: 'Receivable updated successfully' });
    });
});

// ===================== ASSETS =====================

// Get all assets
router.get('/assets', (req, res) => {
    const { category, condition, search } = req.query;
    
    let query = `
        SELECT a.*, u.full_name as recorded_by_name
        FROM assets a
        JOIN users u ON a.recorded_by = u.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (category) {
        query += ' AND a.category = ?';
        params.push(category);
    }
    
    if (condition) {
        query += ' AND a.condition = ?';
        params.push(condition);
    }
    
    if (search) {
        query += ' AND (a.asset_name LIKE ? OR a.description LIKE ? OR a.serial_number LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY a.purchase_date DESC';
    
    req.db.all(query, params, (err, assets) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(assets);
    });
});

// Create new asset
router.post('/assets', (req, res) => {
    const {
        asset_name, category, description, purchase_value, current_value,
        purchase_date, vendor, warranty_expiry, condition, location,
        serial_number, model
    } = req.body;

    req.db.run(`
        INSERT INTO assets (
            asset_name, category, description, purchase_value, current_value,
            purchase_date, vendor, warranty_expiry, condition, location,
            serial_number, model, recorded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        asset_name, category, description, purchase_value, current_value || purchase_value,
        purchase_date, vendor, warranty_expiry, condition || 'good', location,
        serial_number, model, req.user.id
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({ 
            id: this.lastID, 
            message: 'Asset recorded successfully' 
        });
    });
});

// Update asset
router.put('/assets/:id', (req, res) => {
    const assetId = req.params.id;
    const {
        asset_name, category, description, current_value, vendor,
        warranty_expiry, condition, location, model
    } = req.body;

    req.db.run(`
        UPDATE assets SET 
            asset_name = ?, category = ?, description = ?, current_value = ?,
            vendor = ?, warranty_expiry = ?, condition = ?, location = ?,
            model = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [
        asset_name, category, description, current_value, vendor,
        warranty_expiry, condition, location, model, assetId
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        
        res.json({ message: 'Asset updated successfully' });
    });
});

// Delete asset
router.delete('/assets/:id', (req, res) => {
    const assetId = req.params.id;
    
    req.db.run('DELETE FROM assets WHERE id = ?', [assetId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        
        res.json({ message: 'Asset deleted successfully' });
    });
});

// ===================== ANALYTICS =====================

// Accounting summary
router.get('/analytics/summary', (req, res) => {
    const { date_from, date_to } = req.query;
    
    const queries = {
        totalExpenses: `SELECT SUM(amount) as total FROM expenses WHERE approval_status = 'approved'`,
        pendingExpenses: `SELECT SUM(amount) as total FROM expenses WHERE approval_status = 'pending'`,
        totalReceivables: `SELECT SUM(amount - COALESCE(repaid_amount, 0)) as total FROM receivables 
                          WHERE repayment_status IN ('pending', 'partial')`,
        totalAssetValue: `SELECT SUM(COALESCE(current_value, purchase_value)) as total FROM assets`,
        expensesByCategory: `SELECT category, SUM(amount) as total FROM expenses 
                            WHERE approval_status = 'approved' GROUP BY category`,
        receivablesByType: `SELECT type, SUM(amount - COALESCE(repaid_amount, 0)) as total 
                           FROM receivables WHERE repayment_status IN ('pending', 'partial') 
                           GROUP BY type`
    };
    
    // Add date filters if provided
    if (date_from || date_to) {
        if (date_from) {
            queries.totalExpenses += ` AND expense_date >= '${date_from}'`;
            queries.pendingExpenses += ` AND expense_date >= '${date_from}'`;
            queries.expensesByCategory += ` AND expense_date >= '${date_from}'`;
        }
        if (date_to) {
            queries.totalExpenses += ` AND expense_date <= '${date_to}'`;
            queries.pendingExpenses += ` AND expense_date <= '${date_to}'`;
            queries.expensesByCategory += ` AND expense_date <= '${date_to}'`;
        }
    }
    
    const results = {};
    let completed = 0;
    const total = Object.keys(queries).length;
    
    Object.entries(queries).forEach(([key, query]) => {
        req.db.all(query, [], (err, result) => {
            if (err) {
                console.error(`Error executing ${key} query:`, err);
                results[key] = Array.isArray(result) ? [] : { total: 0 };
            } else {
                results[key] = result;
            }
            
            completed++;
            if (completed === total) {
                // Process single value results
                ['totalExpenses', 'pendingExpenses', 'totalReceivables', 'totalAssetValue'].forEach(k => {
                    if (results[k] && results[k][0]) {
                        results[k] = results[k][0].total || 0;
                    } else {
                        results[k] = 0;
                    }
                });
                
                res.json(results);
            }
        });
    });
});

// Monthly expense trends
router.get('/analytics/expense-trends', (req, res) => {
    const { months = 12 } = req.query;
    
    req.db.all(`
        SELECT strftime('%Y-%m', expense_date) as month,
               SUM(amount) as total_amount,
               COUNT(*) as expense_count,
               category
        FROM expenses 
        WHERE approval_status = 'approved' 
          AND expense_date >= date('now', '-${months} months')
        GROUP BY strftime('%Y-%m', expense_date), category
        ORDER BY month DESC, total_amount DESC
    `, [], (err, trends) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(trends);
    });
});

module.exports = router;