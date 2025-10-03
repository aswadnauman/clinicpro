-- Clinic Management System Database Schema

-- Users table for authentication and role management
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('receptionist', 'doctor', 'admin')),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Patients table for patient management
CREATE TABLE patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id VARCHAR(20) UNIQUE NOT NULL, -- Custom patient ID like P-001
    name VARCHAR(100) NOT NULL,
    age INTEGER,
    gender VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    emergency_contact VARCHAR(20),
    medical_history TEXT,
    allergies TEXT,
    blood_group VARCHAR(5),
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Patient visits table to track consultation visits
CREATE TABLE patient_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    reason_for_visit TEXT,
    symptoms TEXT,
    diagnosis TEXT,
    treatment_notes TEXT,
    follow_up_date DATE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id)
);

-- Medical records and prescription uploads
CREATE TABLE medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    visit_id INTEGER,
    doctor_id INTEGER NOT NULL,
    record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('prescription', 'lab_report', 'scan', 'document')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    upload_date DATE NOT NULL,
    uploaded_by INTEGER NOT NULL,
    tags TEXT, -- JSON array of tags
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (visit_id) REFERENCES patient_visits(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Fee management and charity cases
CREATE TABLE fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    charity_discount_percent DECIMAL(5,2) DEFAULT 0,
    charity_discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    is_charity_case BOOLEAN DEFAULT 0,
    charity_reason TEXT,
    charity_approved_by INTEGER,
    charity_approved_at DATETIME,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'waived')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'online', 'waived')),
    paid_amount DECIMAL(10,2) DEFAULT 0,
    payment_date DATETIME,
    collected_by INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id) REFERENCES patient_visits(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (charity_approved_by) REFERENCES users(id),
    FOREIGN KEY (collected_by) REFERENCES users(id)
);

-- Daily expenses tracking
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'utilities', 'supplies', 'salaries', 'rent', 'maintenance', etc.
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'cheque')),
    receipt_number VARCHAR(50),
    vendor VARCHAR(100),
    recorded_by INTEGER NOT NULL,
    approved_by INTEGER,
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recorded_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Staff advances and receivables
CREATE TABLE receivables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('staff_advance', 'vendor_refund', 'other')),
    staff_id INTEGER, -- If type is staff_advance
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    repayment_status VARCHAR(20) DEFAULT 'pending' CHECK (repayment_status IN ('pending', 'partial', 'completed', 'written_off')),
    repaid_amount DECIMAL(10,2) DEFAULT 0,
    last_payment_date DATE,
    notes TEXT,
    recorded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES users(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Clinic assets tracking
CREATE TABLE assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'medical_equipment', 'furniture', 'electronics', 'vehicles'
    description TEXT,
    purchase_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2),
    purchase_date DATE NOT NULL,
    vendor VARCHAR(100),
    warranty_expiry DATE,
    condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'retired')),
    location VARCHAR(100), -- Room/area where asset is located
    serial_number VARCHAR(100),
    model VARCHAR(100),
    recorded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Inventory management
CREATE TABLE inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'medicines', 'consumables', 'equipment'
    brand VARCHAR(100),
    unit VARCHAR(20) NOT NULL, -- 'pieces', 'boxes', 'ml', 'grams'
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 10,
    maximum_stock INTEGER,
    unit_cost DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    supplier VARCHAR(100),
    expiry_date DATE,
    batch_number VARCHAR(50),
    location VARCHAR(100), -- Storage location
    is_active BOOLEAN DEFAULT 1,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Inventory transactions (stock in/out)
CREATE TABLE inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('stock_in', 'stock_out', 'adjustment')),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_type VARCHAR(20), -- 'purchase', 'patient_visit', 'adjustment', 'expired'
    reference_id INTEGER, -- ID from related table
    transaction_date DATE NOT NULL,
    notes TEXT,
    recorded_by INTEGER NOT NULL,
    approved_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Patient visit inventory usage (optional tracking)
CREATE TABLE visit_inventory_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity_used INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    recorded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id) REFERENCES patient_visits(id),
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- System settings and configuration
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Indexes for better performance
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_visits_patient_date ON patient_visits(patient_id, visit_date);
CREATE INDEX idx_visits_doctor_date ON patient_visits(doctor_id, visit_date);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id, upload_date);
CREATE INDEX idx_fees_payment_status ON fees(payment_status, payment_date);
CREATE INDEX idx_expenses_date_category ON expenses(expense_date, category);
CREATE INDEX idx_inventory_stock_level ON inventory_items(current_stock, minimum_stock);
CREATE INDEX idx_inventory_expiry ON inventory_items(expiry_date);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role, full_name, phone) 
VALUES ('admin', 'admin@clinic.com', '$2b$10$rBV2HqqYqmNMb5bVg7pBwO0zB0FKiNrLJpCJ9eflKxZt4Br6KHZK6', 'admin', 'System Administrator', '+1234567890');

-- Insert sample doctor
INSERT INTO users (username, email, password_hash, role, full_name, phone) 
VALUES ('dr_smith', 'doctor@clinic.com', '$2b$10$rBV2HqqYqmNMb5bVg7pBwO0zB0FKiNrLJpCJ9eflKxZt4Br6KHZK6', 'doctor', 'Dr. John Smith', '+1234567891');

-- Insert sample receptionist
INSERT INTO users (username, email, password_hash, role, full_name, phone) 
VALUES ('receptionist', 'reception@clinic.com', '$2b$10$rBV2HqqYqmNMb5bVg7pBwO0zB0FKiNrLJpCJ9eflKxZt4Br6KHZK6', 'receptionist', 'Mary Johnson', '+1234567892');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('clinic_name', 'SmallCare Clinic', 'Name of the clinic'),
('clinic_address', '123 Healthcare Street, Medical City', 'Clinic address'),
('clinic_phone', '+1234567890', 'Main clinic phone number'),
('currency_symbol', 'Rs.', 'Currency symbol for fees'),
('low_stock_threshold', '10', 'Default minimum stock level for inventory alerts'),
('charity_approval_required', 'true', 'Whether charity cases need approval'),
('backup_frequency', 'daily', 'Database backup frequency');

-- Insert sample inventory items
INSERT INTO inventory_items (item_code, item_name, category, brand, unit, current_stock, minimum_stock, unit_cost, selling_price, supplier, created_by) VALUES
('MED001', 'Paracetamol 500mg', 'medicines', 'PharmaCorp', 'strips', 50, 20, 15.00, 25.00, 'Medical Supplies Ltd', 1),
('MED002', 'Amoxicillin 250mg', 'medicines', 'PharmaCorp', 'strips', 30, 15, 45.00, 75.00, 'Medical Supplies Ltd', 1),
('CON001', 'Disposable Syringes 5ml', 'consumables', 'MediTech', 'pieces', 200, 50, 2.50, 5.00, 'MediTech Supplies', 1),
('CON002', 'Surgical Gloves', 'consumables', 'SafeGuard', 'pairs', 100, 25, 3.00, 6.00, 'Safety First Ltd', 1),
('CON003', 'Bandages 4inch', 'consumables', 'WoundCare', 'rolls', 25, 10, 8.00, 15.00, 'Medical Supplies Ltd', 1);

-- Insert sample expense categories (as initial data)
INSERT INTO expenses (expense_date, category, description, amount, payment_method, recorded_by, approval_status) VALUES
(date('now'), 'utilities', 'Electricity Bill - January', 2500.00, 'bank_transfer', 1, 'approved'),
(date('now', '-1 day'), 'supplies', 'Medical Supplies Purchase', 15000.00, 'cash', 1, 'approved'),
(date('now', '-2 days'), 'maintenance', 'AC Repair and Service', 3500.00, 'cash', 1, 'approved');