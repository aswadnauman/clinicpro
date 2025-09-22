-- Demo data for Chemical Market
-- This file contains sample data relevant to the chemical industry

CREATE DATABASE IF NOT EXISTS trading_business;
USE trading_business;

-- Insert Account Groups for Chemical Business
INSERT IGNORE INTO account_groups (name, type) VALUES
('Raw Materials', 'Asset'),
('Work in Process', 'Asset'),
('Finished Goods', 'Asset'),
('Chemical Equipment', 'Asset'),
('Accounts Receivable', 'Asset'),
('Accounts Payable', 'Liability'),
('Long Term Liabilities', 'Liability'),
('Owner Equity', 'Equity'),
('Sales Revenue', 'Income'),
('Cost of Goods Sold', 'Expense'),
('Operating Expenses', 'Expense'),
('Chemical Supplies', 'Asset'),
('Sales Tax', 'Liability');

-- Insert Accounts for Chemical Business
INSERT IGNORE INTO accounts (group_id, code, name, type, balance) VALUES
-- Raw Materials
(1, 'RM-001', 'Sodium Hydroxide (NaOH)', 'General', 5000.00),
(1, 'RM-002', 'Sulfuric Acid (H2SO4)', 'General', 3500.00),
(1, 'RM-003', 'Hydrochloric Acid (HCl)', 'General', 2800.00),
-- Finished Goods
(3, 'FG-001', 'Industrial Bleach', 'General', 12000.00),
(3, 'FG-002', 'Fertilizer Grade Ammonia', 'General', 8500.00),
-- Equipment
(4, 'EQUIP-001', 'Chemical Processing Equipment', 'General', 50000.00),
-- Sales Tax
(13, 'TAX-001', 'Sales Tax Payable', 'General', 0.00),
-- Cash and Bank
(8, 'CASH-002', 'Petty Cash Account', 'Cash', 2500.00),
(8, 'BANK-001', 'Business Checking Account', 'Bank', 25000.00),
-- Equity
(7, 'EQUITY-001', 'Owner Capital', 'General', 0.00),
-- Income
(9, 'SALES-001', 'Product Sales', 'General', 0.00),
(9, 'SALES-002', 'Custom Processing', 'General', 0.00),
-- Expenses
(10, 'COGS-001', 'Cost of Goods Sold', 'General', 0.00),
(11, 'EXP-001', 'Utilities (Chemical Plant)', 'General', 0.00),
(11, 'EXP-002', 'Labor Costs', 'General', 0.00),
(11, 'EXP-003', 'Transportation', 'General', 0.00),
(11, 'EXP-004', 'Regulatory Compliance', 'General', 0.00);

-- Insert Parties (Customers & Suppliers) with FBR data
INSERT IGNORE INTO parties (code, name, party_type, address, city, phone, email, ntn, strn) VALUES
('CUST-001', 'AgroChem Solutions Ltd.', 'Customer', '123 Chemical Street', 'Karachi', '+92-21-1234567', 'info@agrochem.com', '1234567-8', '9876543-2'),
('CUST-002', 'Water Treatment Inc.', 'Customer', '456 Industrial Area', 'Lahore', '+92-42-2345678', 'sales@watertreat.com', '2345678-9', '8765432-1'),
('CUST-003', 'PharmaChem Industries', 'Customer', '789 Pharma Road', 'Islamabad', '+92-51-3456789', 'orders@pharmachem.com', '3456789-0', '7654321-0'),
('SUPP-001', 'Chemical Suppliers Co.', 'Supplier', '321 Supply Avenue', 'Karachi', '+92-21-9876543', 'sales@chemsupp.com', '4567890-1', '6543210-9'),
('SUPP-002', 'Basic Chemicals Ltd.', 'Supplier', '654 Basic Road', 'Lahore', '+92-42-8765432', 'orders@basicchem.com', '5678901-2', '5432109-8');

-- Insert Categories for Chemical Products
INSERT IGNORE INTO categories (name) VALUES
('Acids'),
('Bases'),
('Solvents'),
('Fertilizers'),
('Industrial Chemicals'),
('Specialty Chemicals'),
('Water Treatment Chemicals'),
('Laboratory Chemicals');

-- Insert Items for Chemical Business with Sales Tax Rates
INSERT IGNORE INTO items (code, name, category_id, unit, price, stock_quantity, sales_tax_rate) VALUES
-- Acids
('ACID-001', 'Sulfuric Acid 98%', 1, 'Liter', 2.50, 500, 17.00),
('ACID-002', 'Hydrochloric Acid 37%', 1, 'Liter', 1.75, 300, 17.00),
('ACID-003', 'Nitric Acid 70%', 1, 'Liter', 3.20, 200, 17.00),

-- Bases
('BASE-001', 'Sodium Hydroxide Flakes', 2, 'Kilogram', 1.20, 1000, 17.00),
('BASE-002', 'Potassium Hydroxide', 2, 'Kilogram', 2.10, 400, 17.00),
('BASE-003', 'Ammonia Solution 25%', 2, 'Liter', 1.80, 250, 17.00),

-- Solvents
('SOLV-001', 'Ethyl Alcohol 95%', 3, 'Liter', 3.50, 150, 17.00),
('SOLV-002', 'Acetone', 3, 'Liter', 2.20, 120, 17.00),

-- Fertilizers
('FERT-001', 'Ammonium Nitrate', 4, 'Kilogram', 0.75, 2000, 17.00),
('FERT-002', 'Urea Prills', 4, 'Kilogram', 0.55, 3000, 17.00),

-- Industrial Chemicals
('IND-001', 'Industrial Bleach 12%', 5, 'Liter', 1.25, 800, 17.00),
('IND-002', 'Hydrogen Peroxide 35%', 5, 'Liter', 4.80, 100, 17.00),

-- Specialty Chemicals
('SPEC-001', 'Deionized Water', 6, 'Liter', 0.80, 500, 17.00),
('SPEC-002', 'Buffer Solution pH 7', 6, 'Liter', 12.50, 50, 17.00),

-- Water Treatment Chemicals
('WAT-001', 'Coagulant PAC', 7, 'Kilogram', 2.25, 400, 17.00),
('WAT-002', 'Antiscalant', 7, 'Liter', 8.75, 100, 17.00),

-- Laboratory Chemicals
('LAB-001', 'Analytical Grade Acetone', 8, 'Liter', 18.50, 30, 17.00),
('LAB-002', 'Distilled Water', 8, 'Liter', 2.50, 200, 17.00);

-- Insert Sample Transactions for Chemical Business
INSERT INTO
    transactions (
        voucher_no,
        date,
        type,
        description,
        amount
    )
VALUES (
        'S-001',
        '2023-06-15',
        'Sales',
        'Sale of Industrial Bleach to AgroChem Solutions Ltd.',
        2500.00
    ),
    (
        'P-001',
        '2023-06-10',
        'Purchase',
        'Purchase of Sodium Hydroxide from Basic Chemicals Ltd.',
        1200.00
    ),
    (
        'S-002',
        '2023-06-12',
        'Sales',
        'Sale of Sulfuric Acid to PharmaChem Industries',
        875.00
    ),
    (
        'PAY-001',
        '2023-06-05',
        'Payment',
        'Payment to Chemical Suppliers Co.',
        500.00
    ),
    (
        'REC-001',
        '2023-06-18',
        'Receipt',
        'Receipt from Water Treatment Inc.',
        1200.00
    ),
    (
        'J-001',
        '2023-06-20',
        'Journal',
        'Adjustment for chemical inventory',
        150.00
    );

-- Insert Transaction Details
INSERT INTO
    transaction_details (
        transaction_id,
        account_id,
        item_id,
        quantity,
        rate,
        amount,
        type
    )
VALUES
    -- Sales transaction details
    (
        1,
        5,
        9,
        200,
        12.50,
        2500.00,
        'Credit'
    ), -- Sales account credited
    (
        1,
        9,
        NULL,
        NULL,
        NULL,
        2500.00,
        'Debit'
    ), -- Customer account debited
    (
        1,
        17,
        9,
        200,
        8.00,
        1600.00,
        'Debit'
    ), -- COGS debited
    (
        1,
        17,
        NULL,
        NULL,
        NULL,
        1600.00,
        'Credit'
    ), -- Inventory credited
    (
        2,
        10,
        NULL,
        NULL,
        NULL,
        1200.00,
        'Credit'
    ), -- Accounts payable credited
    (
        2,
        2,
        1,
        500,
        2.40,
        1200.00,
        'Debit'
    ), -- Raw material debited
    (
        3,
        5,
        1,
        500,
        1.75,
        875.00,
        'Credit'
    ), -- Sales account credited
    (
        3,
        11,
        NULL,
        NULL,
        NULL,
        875.00,
        'Debit'
    ), -- Customer account debited
    (
        3,
        17,
        1,
        500,
        1.20,
        600.00,
        'Debit'
    ), -- COGS debited
    (
        3,
        17,
        NULL,
        NULL,
        NULL,
        600.00,
        'Credit'
    ), -- Inventory credited
    (
        4,
        12,
        NULL,
        NULL,
        NULL,
        500.00,
        'Debit'
    ), -- Bank account debited
    (
        4,
        10,
        NULL,
        NULL,
        NULL,
        500.00,
        'Credit'
    ), -- Accounts payable credited
    (
        5,
        12,
        NULL,
        NULL,
        NULL,
        1200.00,
        'Credit'
    ), -- Bank account credited
    (
        5,
        7,
        NULL,
        NULL,
        NULL,
        1200.00,
        'Debit'
    ), -- Customer account debited
    (
        6,
        4,
        9,
        100,
        12.50,
        1250.00,
        'Debit'
    ), -- Inventory adjustment debited
    (
        6,
        4,
        1,
        100,
        2.50,
        250.00,
        'Credit'
    );
-- Inventory adjustment credited