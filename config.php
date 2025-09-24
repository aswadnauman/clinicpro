<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'trading_business');

// Create connection
try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    // Check connection
    if ($conn->connect_error) {
        // Only throw error if we're not on the install page
        if (basename($_SERVER['PHP_SELF']) !== 'install.php') {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
    }
} catch (Exception $e) {
    // Only throw error if we're not on the install page
    if (basename($_SERVER['PHP_SELF']) !== 'install.php') {
        die("Connection failed: " . $e->getMessage());
    }
    // For install page, we'll create the connection without specifying database
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
}
?>