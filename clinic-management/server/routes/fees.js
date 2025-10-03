// Fee and charity management routes
const express = require('express');
const router = express.Router();

// Middleware (should be imported from main app)
const authenticateToken = (req, res, next) => {
    // This will be handled by main app middleware
    next();
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

// Get all fees with filtering
router.get('/', authenticateToken, (req, res) => {
    const { status, patient_id, doctor_id, date_from, date_to, charity_only } = req.query;
    
    let query = `
        SELECT f.*, p.name as patient_name, p.patient_id, 
               u.full_name as doctor_name, u2.full_name as collected_by_name,
               u3.full_name as approved_by_name
        FROM fees f
        JOIN patients p ON f.patient_id = p.id
        JOIN users u ON f.doctor_id = u.id
        LEFT JOIN users u2 ON f.collected_by = u2.id
        LEFT JOIN users u3 ON f.charity_approved_by = u3.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
        query += ' AND f.payment_status = ?';
        params.push(status);
    }
    
    if (patient_id) {
        query += ' AND f.patient_id = ?';
        params.push(patient_id);
    }
    
    if (doctor_id) {
        query += ' AND f.doctor_id = ?';
        params.push(doctor_id);
    }
    
    if (date_from) {
        query += ' AND DATE(f.created_at) >= ?';
        params.push(date_from);
    }
    
    if (date_to) {
        query += ' AND DATE(f.created_at) <= ?';
        params.push(date_to);
    }
    
    if (charity_only === 'true') {
        query += ' AND f.is_charity_case = 1';
    }
    
    query += ' ORDER BY f.created_at DESC';
    
    req.db.all(query, params, (err, fees) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(fees);
    });
});

// Create new fee entry
router.post('/', authenticateToken, authorizeRole(['doctor', 'receptionist', 'admin']), (req, res) => {
    const {
        visit_id, patient_id, doctor_id, base_amount, charity_discount_percent,
        charity_discount_amount, final_amount, is_charity_case, charity_reason, notes
    } = req.body;

    req.db.run(`
        INSERT INTO fees (
            visit_id, patient_id, doctor_id, base_amount, charity_discount_percent,
            charity_discount_amount, final_amount, is_charity_case, charity_reason, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        visit_id, patient_id, doctor_id, base_amount, charity_discount_percent || 0,
        charity_discount_amount || 0, final_amount, is_charity_case ? 1 : 0, charity_reason, notes
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({ 
            id: this.lastID, 
            message: 'Fee entry created successfully' 
        });
    });
});

// Approve charity case
router.put('/:id/approve-charity', authenticateToken, authorizeRole(['doctor', 'admin']), (req, res) => {
    const feeId = req.params.id;
    const { approved } = req.body;

    const updateQuery = approved 
        ? 'UPDATE fees SET charity_approved_by = ?, charity_approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        : 'UPDATE fees SET charity_approved_by = NULL, charity_approved_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

    const params = approved ? [req.user.id, feeId] : [feeId];

    req.db.run(updateQuery, params, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Fee entry not found' });
        }
        
        res.json({ message: approved ? 'Charity case approved' : 'Charity approval removed' });
    });
});

// Collect payment
router.put('/:id/collect-payment', authenticateToken, authorizeRole(['receptionist', 'admin']), (req, res) => {
    const feeId = req.params.id;
    const { paid_amount, payment_method, notes } = req.body;

    // First, get the current fee details
    req.db.get('SELECT * FROM fees WHERE id = ?', [feeId], (err, fee) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!fee) {
            return res.status(404).json({ error: 'Fee entry not found' });
        }

        // Check if charity case needs approval
        if (fee.is_charity_case && !fee.charity_approved_by) {
            return res.status(400).json({ error: 'Charity case must be approved before payment collection' });
        }

        // Calculate new payment status
        const newPaidAmount = (fee.paid_amount || 0) + paid_amount;
        let paymentStatus = 'pending';
        
        if (newPaidAmount >= fee.final_amount) {
            paymentStatus = 'paid';
        } else if (newPaidAmount > 0) {
            paymentStatus = 'partial';
        }

        // Update payment details
        req.db.run(`
            UPDATE fees SET 
                paid_amount = ?,
                payment_status = ?,
                payment_method = ?,
                payment_date = CURRENT_TIMESTAMP,
                collected_by = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [newPaidAmount, paymentStatus, payment_method, req.user.id, notes, feeId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({ 
                message: 'Payment collected successfully',
                paid_amount: newPaidAmount,
                payment_status: paymentStatus
            });
        });
    });
});

// Get pending charity approvals
router.get('/charity/pending', authenticateToken, authorizeRole(['doctor', 'admin']), (req, res) => {
    req.db.all(`
        SELECT f.*, p.name as patient_name, p.patient_id, 
               u.full_name as doctor_name, pv.visit_date
        FROM fees f
        JOIN patients p ON f.patient_id = p.id
        JOIN users u ON f.doctor_id = u.id
        LEFT JOIN patient_visits pv ON f.visit_id = pv.id
        WHERE f.is_charity_case = 1 AND f.charity_approved_by IS NULL
        ORDER BY f.created_at DESC
    `, [], (err, fees) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(fees);
    });
});

// Revenue analytics
router.get('/analytics/revenue', authenticateToken, (req, res) => {
    const { date_from, date_to, group_by = 'day' } = req.query;
    
    let dateFormat;
    switch (group_by) {
        case 'month':
            dateFormat = "strftime('%Y-%m', payment_date)";
            break;
        case 'year':
            dateFormat = "strftime('%Y', payment_date)";
            break;
        default:
            dateFormat = "DATE(payment_date)";
    }
    
    let query = `
        SELECT ${dateFormat} as period,
               SUM(paid_amount) as total_revenue,
               SUM(CASE WHEN is_charity_case = 1 THEN paid_amount ELSE 0 END) as charity_revenue,
               SUM(CASE WHEN is_charity_case = 0 THEN paid_amount ELSE 0 END) as regular_revenue,
               COUNT(*) as total_transactions,
               COUNT(CASE WHEN is_charity_case = 1 THEN 1 END) as charity_transactions
        FROM fees 
        WHERE payment_status = 'paid'
    `;
    
    const params = [];
    
    if (date_from) {
        query += ' AND DATE(payment_date) >= ?';
        params.push(date_from);
    }
    
    if (date_to) {
        query += ' AND DATE(payment_date) <= ?';
        params.push(date_to);
    }
    
    query += ` GROUP BY ${dateFormat} ORDER BY period DESC`;
    
    req.db.all(query, params, (err, analytics) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(analytics);
    });
});

module.exports = router;