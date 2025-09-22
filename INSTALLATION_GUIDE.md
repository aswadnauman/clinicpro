# Installation Guide for Trading Business Application

This guide will help you install and set up the Trading Business Application with FBR Sales Tax compliance features.

## Prerequisites

1. XAMPP or similar web server environment with:
   - Apache web server
   - PHP 7.0 or higher
   - MySQL database server
2. Web browser (Chrome, Firefox, Edge, etc.)

## Installation Steps

### 1. Start XAMPP Services

1. Open XAMPP Control Panel
2. Start Apache and MySQL services
3. Make sure both services show a green "Running" status
4. If you're using port 8080, make sure to configure Apache to use that port in the XAMPP configuration

### 2. Database Setup

There are two ways to set up the database:

#### Option A: Using the Installation Script (Recommended)

1. Open your web browser
2. Navigate to: `http://localhost:8080/New%20folder/ns/install.php` (adjust port as needed)
3. Click the "Install Database" button
4. Wait for the installation to complete
5. The system will automatically load demo data for the chemical market

#### Option B: Manual Database Setup

1. Create the database:
   ```sql
   CREATE DATABASE trading_business;
   ```

2. Import the database schema:
   ```bash
   mysql -u root -p trading_business < database.sql
   ```

3. (Optional) Import demo data:
   ```bash
   mysql -u root -p trading_business < demo_chemical_data.sql
   ```

### 3. Verify Installation

1. Open your web browser
2. Navigate to: `http://localhost:8080/New%20folder/ns/index.html` (adjust port as needed)
3. You should see the application dashboard

### 4. Test API Endpoints

To verify that the API endpoints are working correctly:

1. Navigate to: `http://localhost:8080/New%20folder/ns/api/accounts.php`
2. You should see a JSON response with account data

## Troubleshooting

### Common Issues

1. **"Unknown database 'trading_business'" error**
   - Make sure you've run the installation script or manually created the database
   - Check that MySQL service is running in XAMPP

2. **Permission denied errors**
   - Make sure the web server has read/write permissions on the application folder
   - On Windows, you may need to run XAMPP as Administrator

3. **API endpoints not working**
   - Check that Apache service is running
   - Verify that PHP is properly configured in XAMPP
   - Make sure you're using the correct port (80 or 8080)

4. **Port conflicts**
   - If port 80 is already in use, configure Apache to use port 8080 in XAMPP configuration
   - Update all URLs in the application to use the correct port

### Database Connection Issues

If you're having database connection issues:

1. Check your database credentials in `config.php`
2. Make sure MySQL is running
3. Verify that the database `trading_business` exists

### Port Configuration

If you're using port 8080 instead of the default port 80:

1. Make sure Apache is configured to use port 8080 in XAMPP
2. Update all URLs in the application to use port 8080
3. The JavaScript file (`app.js`) has been updated to use the full URL with port 8080

## Application Features

Once installed, the application provides:

### Core Modules
- Dashboard with financial overview
- Accounts management (Chart of Accounts, Customers, Suppliers)
- Inventory management (Items, Categories)
- Transaction recording (Sales, Purchases, Payments, Receipts, Journal Vouchers)

### FBR Compliance Features
- Sales Tax Register for IRIS/WeBOC filing
- NTN/STRN management for all parties
- Automatic tax calculations
- CSV export for all reports
- FBR-compliant reporting

### Reports
- Financial reports (Trial Balance, Profit & Loss, Balance Sheet)
- Sales and Purchase reports
- Inventory reports
- Customer and Supplier analysis
- Tax reports

## Security Considerations

Before deploying to a production environment:

1. Change the default database credentials in `config.php`
2. Remove or protect the installation script (`install.php`)
3. Set appropriate file permissions
4. Consider adding user authentication

## Support

If you encounter any issues during installation or use:

1. Check that all prerequisites are met
2. Review the error messages carefully
3. Ensure all XAMPP services are running
4. Verify file permissions
5. Make sure you're using the correct port in your URLs

For additional support, please refer to the documentation in `README.md` and `FBR_COMPLIANCE.md`.