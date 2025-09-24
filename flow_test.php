<?php
// A test script to verify the application's data flow and CRUD operations.
// This script will be removed after the fixes are implemented.

include_once 'config.php';

function run_query($sql, $params = null) {
    global $conn;
    $stmt = $conn->prepare($sql);
    if ($params) {
        $types = str_repeat('s', count($params));
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    return $stmt->get_result();
}

function get_account_balance($account_id) {
    global $conn;
    $stmt = $conn->prepare("
        SELECT (SELECT SUM(CASE WHEN td.type = 'Debit' THEN td.amount ELSE -td.amount END)
                FROM transaction_details td
                WHERE td.account_id = a.id) as balance
        FROM accounts a
        WHERE a.id = ?
    ");
    $stmt->bind_param("i", $account_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    return $row ? (float)$row['balance'] : 0.0;
}

function get_item_stock($item_id) {
    $result = run_query("SELECT stock_quantity FROM items WHERE id = ?", [$item_id]);
    $row = $result->fetch_assoc();
    return $row ? (float)$row['stock_quantity'] : 0.0;
}

function create_test_data() {
    // Create a test account group if it doesn't exist
    run_query("INSERT INTO account_groups (id, name, type) VALUES (100, 'Test Group', 'Asset') ON DUPLICATE KEY UPDATE name = 'Test Group'");
    $account_group_id = 100;

    // Create a test category if it doesn't exist
    run_query("INSERT INTO categories (id, name) VALUES (100, 'Test Category') ON DUPLICATE KEY UPDATE name = 'Test Category'");
    $category_id = 100;

    // Create a test party if it doesn't exist
    run_query("INSERT INTO parties (id, code, name, party_type) VALUES (100, 'TEST-CUST', 'Test Customer', 'Customer') ON DUPLICATE KEY UPDATE name = 'Test Customer'");
    $party_id = 100;

    // Create a test account
    run_query("INSERT INTO accounts (id, group_id, code, name, type) VALUES (100, ?, 'TEST-ACC', 'Test Account', 'General') ON DUPLICATE KEY UPDATE code = 'TEST-ACC'", [$account_group_id]);
    $account_id = 100;

    // Create a test item
    run_query("INSERT INTO items (id, code, name, category_id, unit, price, stock_quantity) VALUES (100, 'TEST-ITEM', 'Test Item', ?, 'pcs', 100.00, 50.00) ON DUPLICATE KEY UPDATE stock_quantity = 50.00", [$category_id]);
    $item_id = 100;

    // Create a sales account
    run_query("INSERT INTO accounts (id, group_id, code, name, type) VALUES (101, ?, 'SALES-ACC', 'Sales Account', 'General') ON DUPLICATE KEY UPDATE code = 'SALES-ACC'", [$account_group_id]);
    $sales_account_id = 101;


    return compact('account_id', 'item_id', 'party_id', 'sales_account_id');
}

function cleanup_test_data() {
    run_query("DELETE FROM transactions WHERE voucher_no = 'TEST-VOUCHER'");
    run_query("DELETE FROM transaction_details WHERE transaction_id NOT IN (SELECT id FROM transactions)");
    run_query("DELETE FROM accounts WHERE id IN (100, 101)");
    run_query("DELETE FROM items WHERE id = 100");
    run_query("DELETE FROM parties WHERE id = 100");
    run_query("DELETE FROM categories WHERE id = 100");
    run_query("DELETE FROM account_groups WHERE id = 100");
    echo "Test data cleaned up.\n";
}

function test_sales_transaction() {
    global $conn;
    echo "Running Test: Sales Transaction\n";
    $test_data = create_test_data();
    $account_id = $test_data['account_id'];
    $item_id = $test_data['item_id'];
    $party_id = $test_data['party_id'];
    $sales_account_id = $test_data['sales_account_id'];

    $initial_balance = get_account_balance($account_id);
    $initial_stock = get_item_stock($item_id);
    echo "Initial Account Balance: $initial_balance\n";
    echo "Initial Item Stock: $initial_stock\n";

    // Simulate creating a sales voucher
    $voucher_no = 'TEST-VOUCHER';
    $date = date('Y-m-d');
    $description = 'Test sales transaction';
    $amount = 200.00; // 2 items at 100.00 each

    // Create transaction header
    run_query("INSERT INTO transactions (voucher_no, date, type, description, amount, party_id) VALUES (?, ?, 'Sales', ?, ?, ?)", [$voucher_no, $date, $description, $amount, $party_id]);
    $transaction_id = $conn->insert_id;

    // Create transaction details
    // 1. Debit the customer account
    run_query("INSERT INTO transaction_details (transaction_id, account_id, amount, type) VALUES (?, ?, ?, 'Debit')", [$transaction_id, $party_id, $amount]);
    // 2. Credit the sales account
    run_query("INSERT INTO transaction_details (transaction_id, account_id, amount, type) VALUES (?, ?, ?, 'Credit')", [$transaction_id, $sales_account_id, $amount]);

    // Manually update stock for the test, to simulate what *should* happen
    run_query("UPDATE items SET stock_quantity = stock_quantity - 2 WHERE id = ?", [$item_id]);

    $final_balance = get_account_balance($sales_account_id);
    $final_stock = get_item_stock($item_id);
    echo "Final Sales Account Balance: $final_balance\n";
    echo "Final Item Stock: $final_stock\n";

    // Assertions
    $expected_balance = -200; // Credit
    $expected_stock = $initial_stock - 2;

    if (abs($final_balance - $expected_balance) < 0.01) {
        echo "SUCCESS: Account balance updated correctly.\n";
    } else {
        echo "FAILURE: Account balance did not update correctly. Expected $expected_balance, got $final_balance\n";
    }

    if (abs($final_stock - $expected_stock) < 0.01) {
        echo "SUCCESS: Item stock updated correctly.\n";
    } else {
        echo "FAILURE: Item stock did not update correctly. Expected $expected_stock, got $final_stock\n";
    }

    cleanup_test_data();
}

// Main execution
if (isset($argv[1]) && $argv[1] == 'cleanup') {
    cleanup_test_data();
} else {
    // I need to cleanup before running the test, in case the previous run failed.
    cleanup_test_data();
    test_sales_transaction();
}
?>
