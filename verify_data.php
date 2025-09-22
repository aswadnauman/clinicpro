<?php
// Verify that data was loaded correctly
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "trading_business";

try {
    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    
    echo "<h1>Database Verification</h1>";
    
    // Check tables
    $tables = ['account_groups', 'accounts', 'categories', 'items', 'parties', 'transactions', 'transaction_details', 'sales_tax_register'];
    
    foreach ($tables as $table) {
        $result = $conn->query("SELECT COUNT(*) as count FROM $table");
        if ($result) {
            $row = $result->fetch_assoc();
            echo "<p>Table '$table': " . $row['count'] . " records</p>";
        } else {
            echo "<p>Table '$table': Error - " . $conn->error . "</p>";
        }
    }
    
    // Check some specific data
    echo "<h2>Sample Data Check</h2>";
    
    // Check account groups
    $result = $conn->query("SELECT * FROM account_groups LIMIT 5");
    echo "<h3>Account Groups:</h3>";
    while($row = $result->fetch_assoc()) {
        echo "<p>" . $row['name'] . " (" . $row['type'] . ")</p>";
    }
    
    // Check some accounts
    $result = $conn->query("SELECT * FROM accounts LIMIT 5");
    echo "<h3>Accounts:</h3>";
    while($row = $result->fetch_assoc()) {
        echo "<p>" . $row['code'] . " - " . $row['name'] . " (Balance: " . $row['balance'] . ")</p>";
    }
    
    // Check some items
    $result = $conn->query("SELECT * FROM items LIMIT 5");
    echo "<h3>Items:</h3>";
    while($row = $result->fetch_assoc()) {
        echo "<p>" . $row['code'] . " - " . $row['name'] . " (Price: " . $row['price'] . ", Tax Rate: " . $row['sales_tax_rate'] . "%)</p>";
    }
    
    // Check some parties
    $result = $conn->query("SELECT * FROM parties LIMIT 5");
    echo "<h3>Parties:</h3>";
    while($row = $result->fetch_assoc()) {
        echo "<p>" . $row['code'] . " - " . $row['name'] . " (NTN: " . $row['ntn'] . ", STRN: " . $row['strn'] . ")</p>";
    }
    
    $conn->close();
    
} catch(Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>