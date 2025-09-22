<?php
// Simple test page for Chart of Accounts API
include_once 'api/header.php';

function testAPI($url, $method = 'GET', $data = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data && ($method === 'POST' || $method === 'PUT')) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Content-Length: ' . strlen(json_encode($data))
        ]);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'httpCode' => $httpCode,
        'response' => json_decode($response, true)
    ];
}

// Test account groups
echo "<h2>Testing Account Groups API</h2>";

// Test GET all account groups
$result = testAPI('http://localhost:8000/api/account_groups.php');
echo "<h3>GET /api/account_groups.php</h3>";
echo "<p>HTTP Code: " . $result['httpCode'] . "</p>";
echo "<pre>" . print_r($result['response'], true) . "</pre>";

// Test accounts
echo "<h2>Testing Accounts API</h2>";

// Test GET all accounts
$result = testAPI('http://localhost:8000/api/accounts.php');
echo "<h3>GET /api/accounts.php</h3>";
echo "<p>HTTP Code: " . $result['httpCode'] . "</p>";
echo "<pre>" . print_r($result['response'], true) . "</pre>";

// Test creating a new account group
$newGroup = [
    'name' => 'Test Group ' . time(),
    'type' => 'Asset'
];

echo "<h3>POST /api/account_groups.php (Creating test group)</h3>";
$result = testAPI('http://localhost:8000/api/account_groups.php', 'POST', $newGroup);
echo "<p>HTTP Code: " . $result['httpCode'] . "</p>";
echo "<pre>" . print_r($result['response'], true) . "</pre>";

if ($result['response']['success'] && isset($result['response']['data']['id'])) {
    $groupId = $result['response']['data']['id'];
    
    // Test creating a new account
    $newAccount = [
        'code' => 'TEST-' . time(),
        'name' => 'Test Account ' . time(),
        'group_id' => $groupId,
        'type' => 'General',
        'balance' => 0
    ];
    
    echo "<h3>POST /api/accounts.php (Creating test account)</h3>";
    $result = testAPI('http://localhost:8000/api/accounts.php', 'POST', $newAccount);
    echo "<p>HTTP Code: " . $result['httpCode'] . "</p>";
    echo "<pre>" . print_r($result['response'], true) . "</pre>";
    
    if ($result['response']['success'] && isset($result['response']['data']['id'])) {
        $accountId = $result['response']['data']['id'];
        
        // Test getting the account
        echo "<h3>GET /api/accounts.php?id=$accountId (Getting test account)</h3>";
        $result = testAPI("http://localhost:8000/api/accounts.php?id=$accountId");
        echo "<p>HTTP Code: " . $result['httpCode'] . "</p>";
        echo "<pre>" . print_r($result['response'], true) . "</pre>";
        
        // Test updating the account
        $updatedAccount = $newAccount;
        $updatedAccount['name'] = 'Updated Test Account ' . time();
        $updatedAccount['balance'] = 100;
        
        echo "<h3>PUT /api/accounts.php?id=$accountId (Updating test account)</h3>";
        $result = testAPI("http://localhost:8000/api/accounts.php?id=$accountId", 'PUT', $updatedAccount);
        echo "<p>HTTP Code: " . $result['httpCode'] . "</p>";
        echo "<pre>" . print_r($result['response'], true) . "</pre>";
        
        // Clean up - delete the test account
        echo "<h3>DELETE /api/accounts.php?id=$accountId (Deleting test account)</h3>";
        $result = testAPI("http://localhost:8000/api/accounts.php?id=$accountId", 'DELETE');
        echo "<p>HTTP Code: " . $result['httpCode'] . "</p>";
        echo "<pre>" . print_r($result['response'], true) . "</pre>";
    }
    
    // Clean up - delete the test group
    echo "<h3>DELETE /api/account_groups.php?id=$groupId (Deleting test group)</h3>";
    $result = testAPI("http://localhost:8000/api/account_groups.php?id=$groupId", 'DELETE');
    echo "<p>HTTP Code: " . $result['httpCode'] . "</p>";
    echo "<pre>" . print_r($result['response'], true) . "</pre>";
}
?>