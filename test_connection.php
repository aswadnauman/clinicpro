<?php
// Test database connection with current setup
include_once 'config.php';

echo "<h1>Database Connection Test</h1>";

// Test if we can connect to the database
try {
    global $conn;
    
    if ($conn) {
        echo "<p style='color: green;'>Successfully connected to the database!</p>";
        
        // Check if tables exist
        $tables = ['account_groups', 'accounts', 'categories', 'items', 'parties', 'transactions', 'transaction_details', 'sales_tax_register'];
        
        echo "<h2>Checking Tables:</h2>";
        foreach ($tables as $table) {
            $result = $conn->query("SHOW TABLES LIKE '$table'");
            if ($result && $result->num_rows > 0) {
                echo "<p style='color: green;'>✓ Table '$table' exists</p>";
            } else {
                echo "<p style='color: red;'>✗ Table '$table' does not exist</p>";
            }
        }
        
        // Check some sample data
        echo "<h2>Checking Sample Data:</h2>";
        $result = $conn->query("SELECT COUNT(*) as count FROM accounts");
        if ($result) {
            $row = $result->fetch_assoc();
            echo "<p>Accounts table has " . $row['count'] . " records</p>";
        }
        
        $result = $conn->query("SELECT COUNT(*) as count FROM parties");
        if ($result) {
            $row = $result->fetch_assoc();
            echo "<p>Parties table has " . $row['count'] . " records</p>";
        }
        
        $result = $conn->query("SELECT COUNT(*) as count FROM items");
        if ($result) {
            $row = $result->fetch_assoc();
            echo "<p>Items table has " . $row['count'] . " records</p>";
        }
        
    } else {
        echo "<p style='color: red;'>Failed to connect to the database</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

echo "<h2>Configuration Check</h2>";
echo "<p>DB_HOST: " . DB_HOST . "</p>";
echo "<p>DB_USER: " . DB_USER . "</p>";
echo "<p>DB_NAME: " . DB_NAME . "</p>";
?>