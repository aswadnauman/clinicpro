<?php
echo "<h1>API Endpoints Test</h1>";

// Function to test an API endpoint
function testEndpoint($url, $name) {
    $context = stream_context_create([
        "http" => [
            "method" => "GET",
            "header" => "Accept: application/json",
            "timeout" => 5
        ]
    ]);
    
    echo "<h3>Testing $name</h3>";
    
    $result = @file_get_contents($url, false, $context);
    
    if ($result === FALSE) {
        echo "<p style='color: red;'>✗ Failed to access endpoint: $url</p>";
        return false;
    } else {
        $data = json_decode($result, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            echo "<p style='color: green;'>✓ Endpoint working correctly</p>";
            if (is_array($data)) {
                echo "<p>Returned " . count($data) . " records</p>";
            }
            return true;
        } else {
            echo "<p style='color: orange;'>⚠ Endpoint accessible but returned invalid JSON</p>";
            echo "<pre>" . htmlspecialchars(substr($result, 0, 200)) . "...</pre>";
            return false;
        }
    }
}

// Test all API endpoints
$baseUrl = "http://localhost:8080/New%20folder/ns/api";

testEndpoint("$baseUrl/account_groups.php", "Account Groups");
testEndpoint("$baseUrl/accounts.php", "Accounts");
testEndpoint("$baseUrl/categories.php", "Categories");
testEndpoint("$baseUrl/items.php", "Items");
testEndpoint("$baseUrl/parties.php", "Parties");
testEndpoint("$baseUrl/transactions.php", "Transactions");
testEndpoint("$baseUrl/reports.php?type=trial_balance", "Reports - Trial Balance");

echo "<h2>Test Complete</h2>";
echo "<p>If all endpoints show '✓ Endpoint working correctly', the API is functioning properly.</p>";
?>