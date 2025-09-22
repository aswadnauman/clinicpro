<?php
include_once 'header.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

if($method !== 'GET') {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed"));
    exit;
}

if(!isset($_GET['type'])) {
    http_response_code(400);
    echo json_encode(array("message" => "Report type is required"));
    exit;
}

$type = $_GET['type'];

switch($type) {
    case 'ledger':
        getLedgerReport();
        break;
    case 'trial_balance':
        getTrialBalance();
        break;
    case 'cashbook':
        getCashBook();
        break;
    case 'bankbook':
        getBankBook();
        break;
    case 'sales':
        getSalesReport();
        break;
    case 'purchase':
        getPurchaseReport();
        break;
    case 'stock':
        getStockReport();
        break;
    // New FBR-compliant reports
    case 'daily_sales':
        getDailySalesReport();
        break;
    case 'customer_ledger':
        getCustomerLedger();
        break;
    case 'sales_summary':
        getSalesSummary();
        break;
    case 'customer_summary':
        getCustomerSummary();
        break;
    case 'payment_collection':
        getPaymentCollectionReport();
        break;
    case 'top_customers':
        getTopCustomers();
        break;
    case 'item_summary':
        getItemWiseSummary();
        break;
    case 'party_supplier':
        getPartyWiseSupplier();
        break;
    case 'party_customer':
        getPartyWiseCustomer();
        break;
    case 'brand_sales':
        getBrandWiseSales();
        break;
    case 'stock_summary':
        getStockSummary();
        break;
    case 'fast_moving':
        getFastMovingItems();
        break;
    case 'slow_moving':
        getSlowMovingItems();
        break;
    case 'inventory_valuation':
        getInventoryValuation();
        break;
    case 'monthly_summary':
        getMonthlySummary();
        break;
    case 'profit_loss':
        getProfitLossStatement();
        break;
    case 'balance_sheet':
        getBalanceSheet();
        break;
    case 'client_ageing':
        getClientAgeingReport();
        break;
    case 'sales_tax_register':
        getSalesTaxRegister();
        break;
    default:
        http_response_code(400);
        echo json_encode(array("message" => "Invalid report type"));
        break;
}

// Existing reports
function getLedgerReport() {
    global $conn;
    
    if(!isset($_GET['account_id'])) {
        http_response_code(400);
        echo json_encode(array("message" => "Account ID is required for ledger report"));
        return;
    }
    
    $account_id = $_GET['account_id'];
    
    // Get account info
    $query = "SELECT * FROM accounts WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $account_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if(!$account = $result->fetch_assoc()) {
        http_response_code(404);
        echo json_encode(array("message" => "Account not found"));
        return;
    }
    
    // Get ledger transactions
    $query = "SELECT t.*, td.amount, td.type 
              FROM transactions t 
              JOIN transaction_details td ON t.id = td.transaction_id 
              WHERE td.account_id = ? 
              ORDER BY t.date";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $account_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $transactions = array();
    while($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
    
    echo json_encode(array(
        "account" => $account,
        "transactions" => $transactions
    ));
}

function getTrialBalance() {
    global $conn;
    
    $query = "SELECT a.id, a.name, a.code, a.balance as opening_balance,
              COALESCE(SUM(CASE WHEN td.type = 'Debit' THEN td.amount ELSE 0 END), 0) as debit,
              COALESCE(SUM(CASE WHEN td.type = 'Credit' THEN td.amount ELSE 0 END), 0) as credit,
              (a.balance + 
               COALESCE(SUM(CASE WHEN td.type = 'Debit' THEN td.amount ELSE 0 END), 0) - 
               COALESCE(SUM(CASE WHEN td.type = 'Credit' THEN td.amount ELSE 0 END), 0)) as balance
              FROM accounts a 
              LEFT JOIN transaction_details td ON a.id = td.account_id
              WHERE a.deleted = 0
              GROUP BY a.id, a.name, a.code, a.balance
              HAVING debit > 0 OR credit > 0 OR a.balance != 0
              ORDER BY a.code";
    $result = $conn->query($query);
    
    $accounts = array();
    $total_debit = 0;
    $total_credit = 0;
    $total_opening = 0;
    
    while($row = $result->fetch_assoc()) {
        $accounts[] = $row;
        $total_debit += $row['debit'];
        $total_credit += $row['credit'];
        $total_opening += $row['opening_balance'];
    }
    
    echo json_encode([
        'accounts' => $accounts,
        'totals' => [
            'opening_balance' => $total_opening,
            'debit' => $total_debit,
            'credit' => $total_credit,
            'balance' => $total_opening + $total_debit - $total_credit
        ]
    ]);
}

function getCashBook() {
    global $conn;
    
    $query = "SELECT t.*, td.amount, td.type, a.name as account_name
              FROM transactions t 
              JOIN transaction_details td ON t.id = td.transaction_id 
              JOIN accounts a ON td.account_id = a.id
              WHERE a.type = 'Cash'
              ORDER BY t.date";
    $result = $conn->query($query);
    
    $transactions = array();
    while($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
    
    echo json_encode($transactions);
}

function getBankBook() {
    global $conn;
    
    $query = "SELECT t.*, td.amount, td.type, a.name as account_name
              FROM transactions t 
              JOIN transaction_details td ON t.id = td.transaction_id 
              JOIN accounts a ON td.account_id = a.id
              WHERE a.type = 'Bank'
              ORDER BY t.date";
    $result = $conn->query($query);
    
    $transactions = array();
    while($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
    
    echo json_encode($transactions);
}

function getSalesReport() {
    global $conn;
    
    $query = "SELECT t.*, td.quantity, td.rate, td.amount, i.name as item_name, a.name as account_name
              FROM transactions t 
              JOIN transaction_details td ON t.id = td.transaction_id 
              LEFT JOIN items i ON td.item_id = i.id
              LEFT JOIN accounts a ON td.account_id = a.id
              WHERE t.type = 'Sales'
              ORDER BY t.date";
    $result = $conn->query($query);
    
    $transactions = array();
    while($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
    
    echo json_encode($transactions);
}

function getPurchaseReport() {
    global $conn;
    
    $query = "SELECT t.*, td.quantity, td.rate, td.amount, i.name as item_name, a.name as account_name
              FROM transactions t 
              JOIN transaction_details td ON t.id = td.transaction_id 
              LEFT JOIN items i ON td.item_id = i.id
              LEFT JOIN accounts a ON td.account_id = a.id
              WHERE t.type = 'Purchase'
              ORDER BY t.date";
    $result = $conn->query($query);
    
    $transactions = array();
    while($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
    
    echo json_encode($transactions);
}

function getStockReport() {
    global $conn;
    
    $query = "SELECT i.code, i.name, c.name as category_name, i.unit, i.price, i.stock_quantity,
              (i.stock_quantity * i.price) as stock_value
              FROM items i
              JOIN categories c ON i.category_id = c.id
              WHERE i.stock_quantity > 0
              ORDER BY i.name";
    $result = $conn->query($query);
    
    $items = array();
    while($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    
    echo json_encode($items);
}

// New FBR-compliant reports
function getDailySalesReport() {
    global $conn;
    
    $date = $_GET['date'] ?? date('Y-m-d');
    
    $query = "SELECT t.*, p.name as party_name, p.ntn, p.strn, t.tax_amount, t.total_amount
              FROM transactions t
              LEFT JOIN parties p ON t.party_id = p.id
              WHERE t.type = 'Sales' AND t.date = ?
              ORDER BY t.voucher_no";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $transactions = array();
    while($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
    
    echo json_encode($transactions);
}

function getCustomerLedger() {
    global $conn;
    
    if(!isset($_GET['party_id'])) {
        http_response_code(400);
        echo json_encode(array("message" => "Party ID is required for customer ledger"));
        return;
    }
    
    $party_id = $_GET['party_id'];
    
    // Get party info
    $query = "SELECT * FROM parties WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $party_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if(!$party = $result->fetch_assoc()) {
        http_response_code(404);
        echo json_encode(array("message" => "Party not found"));
        return;
    }
    
    // Get ledger transactions
    $query = "SELECT t.*, td.amount, td.type 
              FROM transactions t 
              JOIN transaction_details td ON t.id = td.transaction_id 
              WHERE t.party_id = ? 
              ORDER BY t.date";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $party_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $transactions = array();
    while($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
    
    echo json_encode(array(
        "party" => $party,
        "transactions" => $transactions
    ));
}

function getSalesSummary() {
    global $conn;
    
    $from_date = $_GET['from_date'] ?? date('Y-m-01');
    $to_date = $_GET['to_date'] ?? date('Y-m-t');
    
    $query = "SELECT p.name as party_name, COUNT(t.id) as total_invoices, 
              SUM(t.amount) as total_amount, SUM(t.tax_amount) as total_tax, 
              SUM(t.total_amount) as grand_total
              FROM transactions t
              LEFT JOIN parties p ON t.party_id = p.id
              WHERE t.type = 'Sales' AND t.date BETWEEN ? AND ?
              GROUP BY t.party_id, p.name
              ORDER BY total_amount DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $summary = array();
    while($row = $result->fetch_assoc()) {
        $summary[] = $row;
    }
    
    echo json_encode($summary);
}

function getCustomerSummary() {
    global $conn;
    
    $query = "SELECT p.name, p.ntn, p.strn, p.balance,
              COUNT(t.id) as total_transactions,
              SUM(CASE WHEN t.type = 'Sales' THEN t.total_amount ELSE 0 END) as total_sales,
              SUM(CASE WHEN t.type = 'Receipt' THEN t.amount ELSE 0 END) as total_payments
              FROM parties p
              LEFT JOIN transactions t ON p.id = t.party_id
              WHERE p.party_type = 'Customer'
              GROUP BY p.id, p.name, p.ntn, p.strn, p.balance
              ORDER BY p.name";
    $result = $conn->query($query);
    
    $customers = array();
    while($row = $result->fetch_assoc()) {
        $customers[] = $row;
    }
    
    echo json_encode($customers);
}

function getPaymentCollectionReport() {
    global $conn;
    
    $from_date = $_GET['from_date'] ?? date('Y-m-01');
    $to_date = $_GET['to_date'] ?? date('Y-m-t');
    
    $query = "SELECT t.date, t.voucher_no, p.name as party_name, t.amount, t.description
              FROM transactions t
              LEFT JOIN parties p ON t.party_id = p.id
              WHERE t.type = 'Receipt' AND t.date BETWEEN ? AND ?
              ORDER BY t.date";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $payments = array();
    while($row = $result->fetch_assoc()) {
        $payments[] = $row;
    }
    
    echo json_encode($payments);
}

function getTopCustomers() {
    global $conn;
    
    $limit = $_GET['limit'] ?? 10;
    $from_date = $_GET['from_date'] ?? date('Y-01-01');
    $to_date = $_GET['to_date'] ?? date('Y-12-31');
    
    $query = "SELECT p.name, p.ntn, p.strn, SUM(t.total_amount) as total_purchases
              FROM parties p
              JOIN transactions t ON p.id = t.party_id
              WHERE p.party_type = 'Customer' AND t.type = 'Sales' 
              AND t.date BETWEEN ? AND ?
              GROUP BY p.id, p.name, p.ntn, p.strn
              ORDER BY total_purchases DESC
              LIMIT ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ssi", $from_date, $to_date, $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $customers = array();
    while($row = $result->fetch_assoc()) {
        $customers[] = $row;
    }
    
    echo json_encode($customers);
}

function getItemWiseSummary() {
    global $conn;
    
    $from_date = $_GET['from_date'] ?? date('Y-m-01');
    $to_date = $_GET['to_date'] ?? date('Y-m-t');
    
    $query = "SELECT i.name as item_name, c.name as category_name, 
              SUM(td.quantity) as total_quantity, 
              AVG(td.rate) as avg_rate,
              SUM(td.amount) as total_amount,
              SUM(td.tax_amount) as total_tax
              FROM transaction_details td
              JOIN transactions t ON td.transaction_id = t.id
              JOIN items i ON td.item_id = i.id
              JOIN categories c ON i.category_id = c.id
              WHERE t.type = 'Sales' AND t.date BETWEEN ? AND ?
              GROUP BY i.id, i.name, c.name
              ORDER BY total_amount DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $items = array();
    while($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    
    echo json_encode($items);
}

function getPartyWiseSupplier() {
    global $conn;
    
    $from_date = $_GET['from_date'] ?? date('Y-m-01');
    $to_date = $_GET['to_date'] ?? date('Y-m-t');
    
    $query = "SELECT p.name as party_name, p.ntn, p.strn,
              COUNT(t.id) as total_transactions,
              SUM(t.amount) as total_amount,
              SUM(t.tax_amount) as total_tax,
              SUM(t.total_amount) as grand_total
              FROM parties p
              JOIN transactions t ON p.id = t.party_id
              WHERE p.party_type = 'Supplier' AND t.type = 'Purchase'
              AND t.date BETWEEN ? AND ?
              GROUP BY p.id, p.name, p.ntn, p.strn
              ORDER BY total_amount DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $suppliers = array();
    while($row = $result->fetch_assoc()) {
        $suppliers[] = $row;
    }
    
    echo json_encode($suppliers);
}

function getPartyWiseCustomer() {
    global $conn;
    
    $from_date = $_GET['from_date'] ?? date('Y-m-01');
    $to_date = $_GET['to_date'] ?? date('Y-m-t');
    
    $query = "SELECT p.name as party_name, p.ntn, p.strn,
              COUNT(t.id) as total_transactions,
              SUM(t.amount) as total_amount,
              SUM(t.tax_amount) as total_tax,
              SUM(t.total_amount) as grand_total
              FROM parties p
              JOIN transactions t ON p.id = t.party_id
              WHERE p.party_type = 'Customer' AND t.type = 'Sales'
              AND t.date BETWEEN ? AND ?
              GROUP BY p.id, p.name, p.ntn, p.strn
              ORDER BY total_amount DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $customers = array();
    while($row = $result->fetch_assoc()) {
        $customers[] = $row;
    }
    
    echo json_encode($customers);
}

function getBrandWiseSales() {
    global $conn;
    
    // Using categories as brands for this example
    $from_date = $_GET['from_date'] ?? date('Y-m-01');
    $to_date = $_GET['to_date'] ?? date('Y-m-t');
    
    $query = "SELECT c.name as brand_name,
              SUM(td.quantity) as total_quantity,
              SUM(td.amount) as total_amount,
              SUM(td.tax_amount) as total_tax,
              SUM(td.total_amount) as grand_total
              FROM categories c
              JOIN items i ON c.id = i.category_id
              JOIN transaction_details td ON i.id = td.item_id
              JOIN transactions t ON td.transaction_id = t.id
              WHERE t.type = 'Sales' AND t.date BETWEEN ? AND ?
              GROUP BY c.id, c.name
              ORDER BY total_amount DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $brands = array();
    while($row = $result->fetch_assoc()) {
        $brands[] = $row;
    }
    
    echo json_encode($brands);
}

function getStockSummary() {
    global $conn;
    
    $query = "SELECT c.name as category_name, 
              COUNT(i.id) as total_items,
              SUM(i.stock_quantity) as total_quantity,
              SUM(i.stock_quantity * i.price) as stock_value
              FROM categories c
              JOIN items i ON c.id = i.category_id
              GROUP BY c.id, c.name
              ORDER BY stock_value DESC";
    $result = $conn->query($query);
    
    $summary = array();
    while($row = $result->fetch_assoc()) {
        $summary[] = $row;
    }
    
    echo json_encode($summary);
}

function getFastMovingItems() {
    global $conn;
    
    $from_date = $_GET['from_date'] ?? date('Y-m-01');
    $to_date = $_GET['to_date'] ?? date('Y-m-t');
    
    $query = "SELECT i.name as item_name, c.name as category_name,
              SUM(td.quantity) as total_quantity,
              SUM(td.amount) as total_amount
              FROM items i
              JOIN categories c ON i.category_id = c.id
              JOIN transaction_details td ON i.id = td.item_id
              JOIN transactions t ON td.transaction_id = t.id
              WHERE t.type = 'Sales' AND t.date BETWEEN ? AND ?
              GROUP BY i.id, i.name, c.name
              ORDER BY total_quantity DESC
              LIMIT 10";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $items = array();
    while($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    
    echo json_encode($items);
}

function getSlowMovingItems() {
    global $conn;
    
    $from_date = $_GET['from_date'] ?? date('Y-m-01');
    $to_date = $_GET['to_date'] ?? date('Y-m-t');
    
    $query = "SELECT i.name as item_name, c.name as category_name,
              SUM(td.quantity) as total_quantity,
              SUM(i.stock_quantity) as current_stock,
              SUM(td.amount) as total_amount
              FROM items i
              JOIN categories c ON i.category_id = c.id
              LEFT JOIN transaction_details td ON i.id = td.item_id
              LEFT JOIN transactions t ON td.transaction_id = t.id AND t.date BETWEEN ? AND ?
              WHERE (t.type = 'Sales' OR t.type IS NULL)
              GROUP BY i.id, i.name, c.name
              HAVING total_quantity <= 0 OR total_quantity IS NULL
              ORDER BY current_stock DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $items = array();
    while($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    
    echo json_encode($items);
}

function getInventoryValuation() {
    global $conn;
    
    $query = "SELECT i.code, i.name, c.name as category_name, i.unit, 
              i.price as unit_cost, i.stock_quantity,
              (i.stock_quantity * i.price) as total_value
              FROM items i
              JOIN categories c ON i.category_id = c.id
              ORDER BY total_value DESC";
    $result = $conn->query($query);
    
    $items = array();
    while($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    
    echo json_encode($items);
}

function getMonthlySummary() {
    global $conn;
    
    $year = $_GET['year'] ?? date('Y');
    
    $query = "SELECT MONTH(t.date) as month, 
              MONTHNAME(t.date) as month_name,
              COUNT(CASE WHEN t.type = 'Sales' THEN 1 END) as total_sales,
              COUNT(CASE WHEN t.type = 'Purchase' THEN 1 END) as total_purchases,
              SUM(CASE WHEN t.type = 'Sales' THEN t.total_amount ELSE 0 END) as sales_amount,
              SUM(CASE WHEN t.type = 'Purchase' THEN t.total_amount ELSE 0 END) as purchase_amount
              FROM transactions t
              WHERE YEAR(t.date) = ?
              GROUP BY MONTH(t.date), MONTHNAME(t.date)
              ORDER BY MONTH(t.date)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $year);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $summary = array();
    while($row = $result->fetch_assoc()) {
        $summary[] = $row;
    }
    
    echo json_encode($summary);
}

function getProfitLossStatement() {
    global $conn;
    
    $from_date = $_GET['from_date'] ?? date('Y-01-01');
    $to_date = $_GET['to_date'] ?? date('Y-12-31');
    
    // Sales
    $sales_query = "SELECT SUM(t.total_amount) as total_sales, SUM(t.tax_amount) as sales_tax
                    FROM transactions t
                    WHERE t.type = 'Sales' AND t.date BETWEEN ? AND ?";
    $stmt = $conn->prepare($sales_query);
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $sales_result = $stmt->get_result();
    $sales_data = $sales_result->fetch_assoc();
    
    // Purchases
    $purchase_query = "SELECT SUM(t.total_amount) as total_purchases, SUM(t.tax_amount) as purchase_tax
                       FROM transactions t
                       WHERE t.type = 'Purchase' AND t.date BETWEEN ? AND ?";
    $stmt = $conn->prepare($purchase_query);
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $purchase_result = $stmt->get_result();
    $purchase_data = $purchase_result->fetch_assoc();
    
    // Expenses
    $expense_query = "SELECT SUM(t.amount) as total_expenses
                      FROM transactions t
                      WHERE t.type = 'Payment' AND t.date BETWEEN ? AND ?";
    $stmt = $conn->prepare($expense_query);
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $expense_result = $stmt->get_result();
    $expense_data = $expense_result->fetch_assoc();
    
    $report = array(
        "period" => array("from" => $from_date, "to" => $to_date),
        "sales" => $sales_data,
        "purchases" => $purchase_data,
        "expenses" => $expense_data,
        "gross_profit" => $sales_data['total_sales'] - $purchase_data['total_purchases'],
        "net_profit" => $sales_data['total_sales'] - $purchase_data['total_purchases'] - $expense_data['total_expenses']
    );
    
    echo json_encode($report);
}

function getBalanceSheet() {
    global $conn;
    
    $as_on_date = $_GET['as_on_date'] ?? date('Y-m-d');
    
    // Assets
    $assets_query = "SELECT a.name, a.code, a.balance
                     FROM accounts a
                     JOIN account_groups ag ON a.group_id = ag.id
                     WHERE ag.type = 'Asset' AND a.balance != 0
                     ORDER BY a.code";
    $assets_result = $conn->query($assets_query);
    
    $assets = array();
    while($row = $assets_result->fetch_assoc()) {
        $assets[] = $row;
    }
    
    // Liabilities
    $liabilities_query = "SELECT a.name, a.code, a.balance
                          FROM accounts a
                          JOIN account_groups ag ON a.group_id = ag.id
                          WHERE ag.type = 'Liability' AND a.balance != 0
                          ORDER BY a.code";
    $liabilities_result = $conn->query($liabilities_query);
    
    $liabilities = array();
    while($row = $liabilities_result->fetch_assoc()) {
        $liabilities[] = $row;
    }
    
    // Equity
    $equity_query = "SELECT a.name, a.code, a.balance
                     FROM accounts a
                     JOIN account_groups ag ON a.group_id = ag.id
                     WHERE ag.type = 'Equity' AND a.balance != 0
                     ORDER BY a.code";
    $equity_result = $conn->query($equity_query);
    
    $equity = array();
    while($row = $equity_result->fetch_assoc()) {
        $equity[] = $row;
    }
    
    $report = array(
        "as_on_date" => $as_on_date,
        "assets" => $assets,
        "liabilities" => $liabilities,
        "equity" => $equity
    );
    
    echo json_encode($report);
}

function getClientAgeingReport() {
    global $conn;
    
    $query = "SELECT p.name, p.ntn, p.strn, p.balance,
              CASE 
                WHEN DATEDIFF(CURDATE(), MAX(t.date)) <= 30 THEN '0-30 days'
                WHEN DATEDIFF(CURDATE(), MAX(t.date)) <= 60 THEN '31-60 days'
                WHEN DATEDIFF(CURDATE(), MAX(t.date)) <= 90 THEN '61-90 days'
                ELSE '90+ days'
              END as ageing_bucket
              FROM parties p
              LEFT JOIN transactions t ON p.id = t.party_id
              WHERE p.party_type = 'Customer' AND p.balance > 0
              GROUP BY p.id, p.name, p.ntn, p.strn, p.balance
              ORDER BY p.balance DESC";
    $result = $conn->query($query);
    
    $clients = array();
    while($row = $result->fetch_assoc()) {
        $clients[] = $row;
    }
    
    echo json_encode($clients);
}

function getSalesTaxRegister() {
    global $conn;
    
    $from_date = $_GET['from_date'] ?? date('Y-m-01');
    $to_date = $_GET['to_date'] ?? date('Y-m-t');
    
    $query = "SELECT str.*, p.name as party_name
              FROM sales_tax_register str
              JOIN parties p ON str.party_id = p.id
              WHERE str.invoice_date BETWEEN ? AND ?
              ORDER BY str.invoice_date, str.invoice_number";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $register = array();
    while($row = $result->fetch_assoc()) {
        $register[] = $row;
    }
    
    echo json_encode($register);
}
?>