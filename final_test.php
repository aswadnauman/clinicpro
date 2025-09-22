<?php
echo "<h1>Final Application Test</h1>";
echo "<p>Testing the Trading Business Application setup on port 8080</p>";

// Test 1: Database Connection
echo "<h2>1. Database Connection Test</h2>";
include_once 'config.php';

try {
    global $conn;
    
    if ($conn) {
        echo "<p style='color: green;'>✓ Database connection successful</p>";
        
        // Check if essential tables exist
        $tables = ['account_groups', 'accounts', 'parties', 'items', 'transactions'];
        $allTablesExist = true;
        
        foreach ($tables as $table) {
            $result = $conn->query("SHOW TABLES LIKE '$table'");
            if (!$result || $result->num_rows == 0) {
                echo "<p style='color: red;'>✗ Table '$table' missing</p>";
                $allTablesExist = false;
            }
        }
        
        if ($allTablesExist) {
            echo "<p style='color: green;'>✓ All essential tables exist</p>";
        }
    } else {
        echo "<p style='color: red;'>✗ Database connection failed</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Database connection error: " . $e->getMessage() . "</p>";
}

// Test 2: API Endpoints
echo "<h2>2. API Endpoints Test</h2>";

$endpoints = [
    "/api/account_groups.php" => "Account Groups",
    "/api/accounts.php" => "Accounts",
    "/api/categories.php" => "Categories",
    "/api/items.php" => "Items",
    "/api/parties.php" => "Parties"
];

foreach ($endpoints as $endpoint => $name) {
    $url = "http://localhost:8080/New%20folder/ns" . $endpoint;
    $context = stream_context_create([
        "http" => [
            "method" => "GET",
            "header" => "Accept: application/json",
            "timeout" => 5
        ]
    ]);
    
    $result = @file_get_contents($url, false, $context);
    
    if ($result !== FALSE) {
        $data = json_decode($result, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            echo "<p style='color: green;'>✓ $name endpoint working (" . count($data) . " records)</p>";
        } else {
            echo "<p style='color: orange;'>⚠ $name endpoint accessible but returned invalid JSON</p>";
        }
    } else {
        echo "<p style='color: red;'>✗ $name endpoint failed</p>";
    }
}

// Test 3: FBR Compliance Features
echo "<h2>3. FBR Compliance Features</h2>";

// Check if sales_tax_register table exists
$result = $conn->query("SHOW TABLES LIKE 'sales_tax_register'");
if ($result && $result->num_rows > 0) {
    echo "<p style='color: green;'>✓ Sales Tax Register table exists (FBR compliance)</p>";
} else {
    echo "<p style='color: red;'>✗ Sales Tax Register table missing</p>";
}

// Check if parties table has NTN and STRN fields
$result = $conn->query("DESCRIBE parties");
if ($result) {
    $hasNTN = false;
    $hasSTRN = false;
    
    while ($row = $result->fetch_assoc()) {
        if ($row['Field'] == 'ntn') {
            $hasNTN = true;
        }
        if ($row['Field'] == 'strn') {
            $hasSTRN = true;
        }
    }
    
    if ($hasNTN && $hasSTRN) {
        echo "<p style='color: green;'>✓ Parties table has NTN and STRN fields (FBR compliance)</p>";
    } else {
        echo "<p style='color: red;'>✗ Parties table missing NTN or STRN fields</p>";
    }
}

// Test 4: Demo Data
echo "<h2>4. Demo Data Check</h2>";

$demoChecks = [
    "accounts" => "SELECT COUNT(*) as count FROM accounts WHERE code IN ('CASH-002', 'BANK-001')",
    "parties" => "SELECT COUNT(*) as count FROM parties WHERE code IN ('CUST-001', 'SUPP-001')",
    "items" => "SELECT COUNT(*) as count FROM items WHERE code IN ('ACID-001', 'BASE-001')"
];

foreach ($demoChecks as $table => $query) {
    $result = $conn->query($query);
    if ($result) {
        $row = $result->fetch_assoc();
        if ($row['count'] > 0) {
            echo "<p style='color: green;'>✓ $table demo data loaded</p>";
        } else {
            echo "<p style='color: orange;'>⚠ $table demo data may be missing</p>";
        }
    }
}

echo "<h2>Test Complete</h2>";
echo "<p>If most tests show green checkmarks, your application is properly configured for port 8080.</p>";
echo "<p>You can now access your application at: <a href='http://localhost:8080/New%20folder/ns/index.html'>http://localhost:8080/New%20folder/ns/index.html</a></p>";
?>