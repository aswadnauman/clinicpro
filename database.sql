-- Database for Trading Business Application
CREATE DATABASE IF NOT EXISTS trading_business;
USE trading_business;

-- Chart of Accounts (2-level: Control & Ledger)
CREATE TABLE IF NOT EXISTS account_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('Asset', 'Liability', 'Income', 'Expense', 'Equity') NOT NULL,
    deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('Customer', 'Supplier', 'Cash', 'Bank', 'General') DEFAULT 'General',
    balance DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES account_groups(id) ON DELETE CASCADE
);

-- Inventory Module
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    stock_quantity DECIMAL(10,2) DEFAULT 0.00,
    sales_tax_rate DECIMAL(5,2) DEFAULT 0.00, -- Sales tax rate for the item
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Parties (Customers & Suppliers) with FBR compliance data
CREATE TABLE IF NOT EXISTS parties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    party_type ENUM('Customer', 'Supplier') NOT NULL,
    address TEXT,
    city VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    ntn VARCHAR(20), -- National Tax Number
    strn VARCHAR(20), -- Sales Tax Registration Number
    balance DECIMAL(15,2) DEFAULT 0.00,
    deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Tables
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_no VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL,
    type ENUM('Sales', 'Purchase', 'Payment', 'Receipt', 'Journal') NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0.00, -- Total tax amount for the transaction
    total_amount DECIMAL(15,2) DEFAULT 0.00, -- Total amount including tax
    party_id INT, -- Reference to parties table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transaction_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    account_id INT NOT NULL,
    item_id INT NULL,
    quantity DECIMAL(10,2) DEFAULT NULL,
    rate DECIMAL(10,2) DEFAULT NULL,
    amount DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0.00, -- Tax rate for this line item
    tax_amount DECIMAL(15,2) DEFAULT 0.00, -- Tax amount for this line item
    total_amount DECIMAL(15,2) DEFAULT 0.00, -- Total amount including tax for this line
    type ENUM('Debit', 'Credit') NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
);

-- Sales Tax Register for FBR compliance
CREATE TABLE IF NOT EXISTS sales_tax_register (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    invoice_date DATE NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    party_id INT NOT NULL,
    party_ntn VARCHAR(20),
    party_strn VARCHAR(20),
    taxable_amount DECIMAL(15,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) DEFAULT 0.00,
    invoice_type ENUM('Sales', 'Purchase') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE
);

-- Insert default account groups
INSERT IGNORE INTO account_groups (name, type) VALUES
('Current Assets', 'Asset'),
('Fixed Assets', 'Asset'),
('Current Liabilities', 'Liability'),
('Capital', 'Equity'),
('Sales', 'Income'),
('Purchase', 'Expense'),
('Expenses', 'Expense'),
('Cash & Bank', 'Asset'),
('Sales Tax', 'Liability');

-- Insert default accounts
INSERT IGNORE INTO accounts (group_id, code, name, type, balance) VALUES
(8, 'CASH-001', 'Cash Account', 'Cash', 0.00),
(5, 'SALES-001', 'Sales Account', 'General', 0.00),
(6, 'PURCHASE-001', 'Purchase Account', 'General', 0.00),
(9, 'TAX-001', 'Sales Tax Payable', 'General', 0.00);