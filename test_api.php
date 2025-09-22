<?php
// Test API endpoints
echo "<h1>API Endpoint Tests</h1>";

// Test account groups endpoint
echo "<h2>Testing Account Groups Endpoint</h2>";
$context = stream_context_create([
    "http" => [
        "method" => "GET",
        "header" => "Accept: application/json"
    ]
]);

$result = file_get_contents('http://localhost/New%20folder/ns/api/account_groups.php', false, $context);
if ($result === FALSE) {
    echo "<p>Error accessing account_groups endpoint</p>";
} else {
    echo "<p>Account Groups endpoint: OK</p>";
    $data = json_decode($result, true);
    echo "<p>Number of account groups: " . count($data) . "</p>";
}

// Test accounts endpoint
echo "<h2>Testing Accounts Endpoint</h2>";
$result = file_get_contents('http://localhost/New%20folder/ns/api/accounts.php', false, $context);
if ($result === FALSE) {
    echo "<p>Error accessing accounts endpoint</p>";
} else {
    echo "<p>Accounts endpoint: OK</p>";
    $data = json_decode($result, true);
    echo "<p>Number of accounts: " . count($data) . "</p>";
}

// Test categories endpoint
echo "<h2>Testing Categories Endpoint</h2>";
$result = file_get_contents('http://localhost/New%20folder/ns/api/categories.php', false, $context);
if ($result === FALSE) {
    echo "<p>Error accessing categories endpoint</p>";
} else {
    echo "<p>Categories endpoint: OK</p>";
    $data = json_decode($result, true);
    echo "<p>Number of categories: " . count($data) . "</p>";
}

// Test items endpoint
echo "<h2>Testing Items Endpoint</h2>";
$result = file_get_contents('http://localhost/New%20folder/ns/api/items.php', false, $context);
if ($result === FALSE) {
    echo "<p>Error accessing items endpoint</p>";
} else {
    echo "<p>Items endpoint: OK</p>";
    $data = json_decode($result, true);
    echo "<p>Number of items: " . count($data) . "</p>";
}

// Test parties endpoint
echo "<h2>Testing Parties Endpoint</h2>";
$result = file_get_contents('http://localhost/New%20folder/ns/api/parties.php', false, $context);
if ($result === FALSE) {
    echo "<p>Error accessing parties endpoint</p>";
} else {
    echo "<p>Parties endpoint: OK</p>";
    $data = json_decode($result, true);
    echo "<p>Number of parties: " . count($data) . "</p>";
}

echo "<h2>Test Complete</h2>";
echo "<p>If all endpoints show 'OK', the API is working correctly.</p>";
?>