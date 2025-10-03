const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images and documents are allowed'));
        }
    }
});

// Database setup
const dbPath = path.join(__dirname, '../database/clinic.db');
const db = new sqlite3.Database(dbPath);

// Database initialization
const { initializeDatabase } = require('./database');

// Initialize the database on startup
initializeDatabase().catch(console.error);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Role-based authorization middleware
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

// Routes

// Authentication routes
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                fullName: user.full_name
            }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.full_name,
                phone: user.phone
            }
        });
    });
});

// Get current user info
app.get('/api/auth/me', authenticateToken, (req, res) => {
    db.get('SELECT id, username, email, role, full_name, phone FROM users WHERE id = ?', 
        [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    });
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's revenue, pending payments, low stock items, and recent activity
    const queries = {
        todayRevenue: `
            SELECT SUM(paid_amount) as total 
            FROM fees 
            WHERE DATE(payment_date) = ? AND payment_status = 'paid'
        `,
        pendingPayments: `
            SELECT COUNT(*) as count 
            FROM fees 
            WHERE payment_status = 'pending'
        `,
        lowStockItems: `
            SELECT COUNT(*) as count 
            FROM inventory_items 
            WHERE current_stock <= minimum_stock AND is_active = 1
        `,
        todayAppointments: `
            SELECT COUNT(*) as count 
            FROM patient_visits 
            WHERE DATE(visit_date) = ? AND status IN ('scheduled', 'completed')
        `,
        totalPatients: `
            SELECT COUNT(*) as count 
            FROM patients
        `,
        charityApprovals: `
            SELECT COUNT(*) as count 
            FROM fees 
            WHERE is_charity_case = 1 AND charity_approved_by IS NULL
        `
    };

    const stats = {};
    let completed = 0;
    const total = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, query]) => {
        const params = key === 'todayRevenue' || key === 'todayAppointments' ? [today] : [];
        
        db.get(query, params, (err, result) => {
            if (err) {
                console.error(`Error executing ${key} query:`, err);
                stats[key] = 0;
            } else {
                stats[key] = result.total || result.count || 0;
            }
            
            completed++;
            if (completed === total) {
                res.json(stats);
            }
        });
    });
});

// Patients routes
app.get('/api/patients', authenticateToken, (req, res) => {
    const { search, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM patients ORDER BY created_at DESC';
    let params = [];
    
    if (search) {
        query = `SELECT * FROM patients 
                 WHERE name LIKE ? OR patient_id LIKE ? OR phone LIKE ? 
                 ORDER BY created_at DESC`;
        const searchTerm = `%${search}%`;
        params = [searchTerm, searchTerm, searchTerm];
    }
    
    query += ` LIMIT ?`;
    params.push(parseInt(limit));
    
    db.all(query, params, (err, patients) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(patients);
    });
});

app.get('/api/patients/:id', authenticateToken, (req, res) => {
    const patientId = req.params.id;
    
    db.get('SELECT * FROM patients WHERE id = ?', [patientId], (err, patient) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.json(patient);
    });
});

app.post('/api/patients', authenticateToken, authorizeRole(['receptionist', 'admin']), (req, res) => {
    const {
        patient_id, name, age, gender, phone, email, address,
        emergency_contact, medical_history, allergies, blood_group
    } = req.body;

    db.run(`
        INSERT INTO patients (
            patient_id, name, age, gender, phone, email, address,
            emergency_contact, medical_history, allergies, blood_group, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        patient_id, name, age, gender, phone, email, address,
        emergency_contact, medical_history, allergies, blood_group, req.user.id
    ], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Patient ID already exists' });
            }
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({ 
            id: this.lastID, 
            message: 'Patient created successfully' 
        });
    });
});

app.put('/api/patients/:id', authenticateToken, authorizeRole(['receptionist', 'admin']), (req, res) => {
    const patientId = req.params.id;
    const {
        name, age, gender, phone, email, address,
        emergency_contact, medical_history, allergies, blood_group
    } = req.body;

    db.run(`
        UPDATE patients SET 
            name = ?, age = ?, gender = ?, phone = ?, email = ?, address = ?,
            emergency_contact = ?, medical_history = ?, allergies = ?, blood_group = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [
        name, age, gender, phone, email, address,
        emergency_contact, medical_history, allergies, blood_group, patientId
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        res.json({ message: 'Patient updated successfully' });
    });
});

// Patient visits routes
app.get('/api/patients/:id/visits', authenticateToken, (req, res) => {
    const patientId = req.params.id;
    
    db.all(`
        SELECT pv.*, u.full_name as doctor_name
        FROM patient_visits pv
        JOIN users u ON pv.doctor_id = u.id
        WHERE pv.patient_id = ?
        ORDER BY pv.visit_date DESC, pv.visit_time DESC
    `, [patientId], (err, visits) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(visits);
    });
});

app.post('/api/patients/:id/visits', authenticateToken, (req, res) => {
    const patientId = req.params.id;
    const {
        doctor_id, visit_date, visit_time, reason_for_visit,
        symptoms, diagnosis, treatment_notes, follow_up_date, status
    } = req.body;

    db.run(`
        INSERT INTO patient_visits (
            patient_id, doctor_id, visit_date, visit_time, reason_for_visit,
            symptoms, diagnosis, treatment_notes, follow_up_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        patientId, doctor_id, visit_date, visit_time, reason_for_visit,
        symptoms, diagnosis, treatment_notes, follow_up_date, status || 'scheduled'
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({ 
            id: this.lastID, 
            message: 'Visit scheduled successfully' 
        });
    });
});

// Medical records routes
app.get('/api/patients/:id/records', authenticateToken, (req, res) => {
    const patientId = req.params.id;
    
    db.all(`
        SELECT mr.*, u.full_name as doctor_name, u2.full_name as uploaded_by_name
        FROM medical_records mr
        JOIN users u ON mr.doctor_id = u.id
        JOIN users u2 ON mr.uploaded_by = u2.id
        WHERE mr.patient_id = ?
        ORDER BY mr.upload_date DESC, mr.created_at DESC
    `, [patientId], (err, records) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(records);
    });
});

app.post('/api/patients/:id/records', authenticateToken, upload.single('file'), (req, res) => {
    const patientId = req.params.id;
    const {
        visit_id, doctor_id, record_type, title, description, upload_date, tags
    } = req.body;

    const file = req.file;
    const file_path = file ? `/uploads/${file.filename}` : null;
    const file_name = file ? file.originalname : null;
    const file_size = file ? file.size : null;

    db.run(`
        INSERT INTO medical_records (
            patient_id, visit_id, doctor_id, record_type, title, description,
            file_path, file_name, file_size, upload_date, uploaded_by, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        patientId, visit_id || null, doctor_id, record_type, title, description,
        file_path, file_name, file_size, upload_date, req.user.id, tags
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({ 
            id: this.lastID, 
            message: 'Medical record uploaded successfully' 
        });
    });
});

// Import route handlers
const feesRouter = require('./routes/fees');
const inventoryRouter = require('./routes/inventory');
const accountingRouter = require('./routes/accounting');

// Middleware to pass database to routes
const dbMiddleware = (req, res, next) => {
    req.db = db;
    next();
};

// Apply routes with authentication and database middleware
app.use('/api/fees', authenticateToken, dbMiddleware, feesRouter);
app.use('/api/inventory', authenticateToken, dbMiddleware, inventoryRouter);
app.use('/api/accounting', authenticateToken, dbMiddleware, accountingRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;