<?php
include_once 'config.php';

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Function to test API endpoints
function testAPI($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'httpCode' => $httpCode,
        'response' => $response
    ];
}

echo "<h1>Accounts and Transactions Test</h1>";

// Test database connection
echo "<h2>Database Connection Test</h2>";
try {
    if ($conn->connect_error) {
        echo "<p style='color: red;'>Connection failed: " . $conn->connect_error . "</p>";
    } else {
        echo "<p style='color: green;'>Connected successfully</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

// Check if accounts table exists and has data
echo "<h2>Accounts Table Check</h2>";
try {
    $result = $conn->query("SELECT COUNT(*) as count FROM accounts");
    if ($result) {
        $row = $result->fetch_assoc();
        echo "<p>Total accounts: " . $row['count'] . "</p>";
        
        if ($row['count'] > 0) {
            echo "<h3>Sample Accounts</h3>";
            $result = $conn->query("SELECT a.*, ag.name as group_name FROM accounts a JOIN account_groups ag ON a.group_id = ag.id LIMIT 5");
            echo "<table border='1'>";
            echo "<tr><th>ID</th><th>Code</th><th>Name</th><th>Group</th><th>Type</th><th>Balance</th></tr>";
            while ($row = $result->fetch_assoc()) {
                echo "<tr>";
                echo "<td>" . $row['id'] . "</td>";
                echo "<td>" . $row['code'] . "</td>";
                echo "<td>" . $row['name'] . "</td>";
                echo "<td>" . $row['group_name'] . "</td>";
                echo "<td>" . $row['type'] . "</td>";
                echo "<td>" . $row['balance'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    } else {
        echo "<p style='color: red;'>Error querying accounts table: " . $conn->error . "</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

// Check if transactions table exists and has data
echo "<h2>Transactions Table Check</h2>";
try {
    $result = $conn->query("SELECT COUNT(*) as count FROM transactions");
    if ($result) {
        $row = $result->fetch_assoc();
        echo "<p>Total transactions: " . $row['count'] . "</p>";
        
        if ($row['count'] > 0) {
            echo "<h3>Sample Transactions</h3>";
            $result = $conn->query("SELECT * FROM transactions LIMIT 5");
            echo "<table border='1'>";
            echo "<tr><th>ID</th><th>Voucher No</th><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr>";
            while ($row = $result->fetch_assoc()) {
                echo "<tr>";
                echo "<td>" . $row['id'] . "</td>";
                echo "<td>" . $row['voucher_no'] . "</td>";
                echo "<td>" . $row['date'] . "</td>";
                echo "<td>" . $row['type'] . "</td>";
                echo "<td>" . $row['description'] . "</td>";
                echo "<td>" . $row['amount'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    } else {
        echo "<p style='color: red;'>Error querying transactions table: " . $conn->error . "</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

// Check transaction details
echo "<h2>Transaction Details Check</h2>";
try {
    $result = $conn->query("SELECT COUNT(*) as count FROM transaction_details");
    if ($result) {
        $row = $result->fetch_assoc();
        echo "<p>Total transaction details: " . $row['count'] . "</p>";
        
        if ($row['count'] > 0) {
            echo "<h3>Sample Transaction Details</h3>";
            $result = $conn->query("
                SELECT td.*, a.name as account_name, t.voucher_no 
                FROM transaction_details td 
                JOIN accounts a ON td.account_id = a.id 
                JOIN transactions t ON td.transaction_id = t.id 
                LIMIT 5
            ");
            echo "<table border='1'>";
            echo "<tr><th>ID</th><th>Transaction ID</th><th>Voucher No</th><th>Account</th><th>Amount</th><th>Type</th></tr>";
            while ($row = $result->fetch_assoc()) {
                echo "<tr>";
                echo "<td>" . $row['id'] . "</td>";
                echo "<td>" . $row['transaction_id'] . "</td>";
                echo "<td>" . $row['voucher_no'] . "</td>";
                echo "<td>" . $row['account_name'] . "</td>";
                echo "<td>" . $row['amount'] . "</td>";
                echo "<td>" . $row['type'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    } else {
        echo "<p style='color: red;'>Error querying transaction_details table: " . $conn->error . "</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

// Test API endpoints
echo "<h2>API Endpoint Tests</h2>";

// Test accounts API
echo "<h3>Accounts API Test</h3>";
$result = testAPI('http://localhost/New%20folder/ns/api/accounts.php');
echo "<p>HTTP Code: " . $result['httpCode'] . "</p>";
echo "<p>Response: " . htmlspecialchars(substr($result['response'], 0, 500)) . (strlen($result['response']) > 500 ? '...' : '') . "</p>";

// Test account groups API
echo "<h3>Account Groups API Test</h3>";
$result = testAPI('http://localhost/New%20folder/ns/api/account_groups.php');
echo "<p>HTTP Code: " . $result['httpCode'] . "</p>";
echo "<p>Response: " . htmlspecialchars(substr($result['response'], 0, 500)) . (strlen($result['response']) > 500 ? '...' : '') . "</p>";

// Test transactions API
echo "<h3>Transactions API Test</h3>";
$result = testAPI('http://localhost/New%20folder/ns/api/transactions.php');
echo "<p>HTTP Code: " . $result['httpCode'] . "</p>";
echo "<p>Response: " . htmlspecialchars(substr($result['response'], 0, 500)) . (strlen($result['response']) > 500 ? '...' : '') . "</p>";

echo "<p><a href='index.html'>Back to Dashboard</a></p>";
?>