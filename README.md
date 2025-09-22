# Trading Business Application

A comprehensive voucher-based accounting and inventory management system for trading businesses with full FBR Sales Tax compliance for Pakistan.

## Features

### Master Management
- **Chart of Accounts**: 2-level or 3-level account structure
- **Parties Management**: Customers and Suppliers with NTN/STRN for tax compliance
- **Items/Inventory**: Code, Name, Category, Unit, Brand, Price with tax rates

### Transaction Vouchers
- **Sales Voucher**: With tax calculation and invoice printing
- **Purchase Voucher**: With tax calculation and GRN reference
- **Sales Return Voucher**
- **Purchase Return Voucher**
- **Payment Voucher**: Cash/Bank Out
- **Receipt Voucher**: Cash/Bank In
- **Journal Voucher**: Adjustments, opening balances

All vouchers:
- Generate unique voucher numbers
- Are editable/searchable
- Have Print options with voucher print format

### Reports
All reports support filtering (date range, party, item, brand) and have:
- Export to PDF
- Export to CSV/Excel
- Print option

#### Sales & Customer Reports
- Daily Sales Report
- Customer Ledger
- Sales Summary
- Customer Summary
- Payment Collection
- Top Customers

#### Inventory Reports
- Item-wise Summary
- Party-wise (Supplier)
- Party-wise (Customer)
- Brand-wise Sales
- Stock Summary
- Fast Moving Items
- Slow Moving Items
- Inventory Valuation

#### Accounting Reports
- Cash Book
- Monthly Summary
- Trial Balance
- Profit & Loss
- Balance Sheet
- Client Ageing

#### FBR Compliance
- FBR Sales Tax Register with CSV export for IRIS/WeBOC filing
- All vouchers & reports are tax compliant (Sales Tax invoices, STRN, NTN)

## FBR Sales Tax Compliance

This application is fully compliant with Pakistan FBR Sales Tax requirements:

1. **Parties Database**: All customers and suppliers store NTN and STRN
2. **Tax Calculation**: Automatic tax calculation on all transactions
3. **Sales Tax Register**: Dedicated register for IRIS/WeBOC filing
4. **Tax Invoices**: Printable tax-compliant invoices with NTN/STRN
5. **CSV Export**: All reports support CSV export for tax filing
6. **Proper Accounting**: Correct accounting entries for tax transactions

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: PHP
- **Database**: MySQL
- **Exporting**: jsPDF for PDF, CSV generation for Excel
- **Printing**: Native browser print functionality

## Installation

1. Clone or download this repository
2. Place it in your web server directory (e.g., XAMPP's htdocs)
3. Create a MySQL database named `trading_business`
4. Import `database.sql` to create the schema
5. Import `demo_chemical_data.sql` for sample chemical trading data
6. Update `config.php` with your database credentials
7. Access the application through your web browser

For detailed installation instructions, see [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)

## API Endpoints

All data is accessible through RESTful API endpoints:

- `api/account_groups.php` - Account groups
- `api/accounts.php` - Chart of accounts
- `api/categories.php` - Item categories
- `api/items.php` - Inventory items
- `api/parties.php` - Customers and suppliers
- `api/transactions.php` - All transaction vouchers
- `api/reports.php` - All reports with various filters

## Forms Access

Navigate to the "Forms" section from the main menu to access:

- Master forms for Accounts, Parties, and Items
- Transaction vouchers for Sales, Purchases, Payments, Receipts, and Journal entries
- All reports with filtering and export capabilities

Or use the main application interface which is now integrated with the APIs:
- Click "Add" buttons in each section to go directly to the relevant form
- View real-time data from the database
- Edit and delete records directly from the main interface

## CRUD Operations

The application now has full Create, Read, Update, and Delete (CRUD) functionality for all modules:

### Chart of Accounts
- Create new accounts with proper validation
- View all accounts in real-time
- Edit existing accounts
- Delete accounts with confirmation

### Items/Inventory
- Create new items with tax rates and stock quantities
- View all items in real-time
- Edit existing items
- Delete items with confirmation

### Parties (Customers & Suppliers)
- Create new parties with NTN/STRN for FBR compliance
- View all parties in real-time
- Edit existing parties
- Delete parties with confirmation

### Transactions
- Create new transactions (Sales, Purchases, Payments, Receipts, Journal Entries)
- View all transactions in real-time
- Edit existing transactions
- Delete transactions with confirmation

All CRUD operations include:
- Proper error handling
- User-friendly success/error messages
- Real-time data updates
- Confirmation dialogs for delete operations
- Data validation on both frontend and backend

## Testing CRUD Operations

To test the CRUD functionality:

1. Open the CRUD test page at `http://localhost:8080/New%20folder/ns/crud_test.html`
2. Test each module (Accounts, Items, Parties) using the forms
3. Verify that created records appear in the tables
4. Test editing existing records
5. Test deleting records with confirmation
6. Check that error messages appear for invalid operations
7. Verify that success messages appear for valid operations

## Testing Voucher Functionality

To test all voucher types:

1. Open the voucher test page at `http://localhost:8080/New%20folder/ns/voucher_test.html`
2. Test each voucher type (Sales, Purchase, Payment, Receipt, Journal)
3. Verify that transactions are created successfully
4. Check that error messages appear for invalid operations
5. Verify that success messages appear for valid operations

## Database Structure

The application uses a normalized database structure with the following main tables:

- `account_groups` - Account classification
- `accounts` - Chart of accounts
- `categories` - Item categories
- `items` - Inventory items with tax rates
- `parties` - Customers and suppliers with NTN/STRN
- `transactions` - All transaction headers
- `transaction_details` - Transaction line items
- `sales_tax_register` - FBR-compliant sales tax register

## FBR Compliance Features

See [FBR_COMPLIANCE.md](FBR_COMPLIANCE.md) for detailed information on:

- Sales Tax Register structure
- IRIS/WeBOC filing format
- NTN/STRN management
- Tax calculation methods
- Report formats for FBR submission

## Demo Data

The application includes chemical industry demo data:
- Sample accounts for a chemical trading business
- Common chemical products with proper tax rates
- Sample customers and suppliers with NTN/STRN
- Example transactions to demonstrate functionality

## Testing API Endpoints

To verify that the API endpoints are working correctly, open `api_test.html` in your browser. This page will test all the main API endpoints and display the results.

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.