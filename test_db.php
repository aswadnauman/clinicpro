<?php
// Test database connection and create database if needed
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "trading_business";

try {
    // Create connection without specifying database
    $conn = new mysqli($servername, $username, $password);
    
    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    
    echo "Connected successfully to MySQL server<br>";
    
    // Check if database exists
    $stmt = $conn->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
    $stmt->bind_param("s", $dbname);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows == 0) {
        // Database doesn't exist, create it. Using backticks for safety.
        $sql = "CREATE DATABASE `$dbname`";
        if ($conn->query($sql) === TRUE) {
            echo "Database '$dbname' created successfully<br>";
        } else {
            echo "Error creating database: " . $conn->error . "<br>";
        }
    } else {
        echo "Database '$dbname' already exists<br>";
    }
    $stmt->close();
    
    // Select the database
    $conn->select_db($dbname);
    
    // Check if tables exist
    $result = $conn->query("SHOW TABLES");
    
    if ($result->num_rows == 0) {
        echo "No tables found in database<br>";
    } else {
        echo "Tables in database:<br>";
        while($row = $result->fetch_row()) {
            echo "- " . $row[0] . "<br>";
        }
    }
    
    $conn->close();
    
} catch(Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>