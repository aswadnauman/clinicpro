<?php
// Installation script for Trading Business Application
// WARNING: This script should be deleted after successful installation.

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "trading_business";

echo "<h1>Trading Business Application Installation</h1>";

// --- Security Check: Prevent re-running the installer if already installed ---
// A simple way is to check for a key table, like 'transactions'.
try {
    $checkConn = new mysqli($servername, $username, $password, $dbname);
    if (!$checkConn->connect_error) {
        $result = $checkConn->query("SHOW TABLES LIKE 'transactions'");
        if ($result && $result->num_rows > 0) {
            echo "<p style='color: orange; font-weight: bold;'>Installation has already been completed. To prevent data loss, the installer has been disabled. Please delete this `install.php` file.</p>";
            exit;
        }
    }
    $checkConn->close();
} catch (Exception $e) {
    // Database or table doesn't exist, so we can proceed.
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Create connection without specifying database
        $conn = new mysqli($servername, $username, $password);
        
        // Check connection
        if ($conn->connect_error) {
            die("Connection failed: " . $conn->connect_error);
        }
        
        // Create database
        $sql = "CREATE DATABASE IF NOT EXISTS `$dbname`";
        if ($conn->query($sql) === TRUE) {
            echo "<p style='color: green;'>Database '$dbname' created or already exists.</p>";
        } else {
            echo "<p style='color: red;'>Error creating database: " . $conn->error . "</p>";
            $conn->close();
            exit;
        }
        
        // Select the database
        $conn->select_db($dbname);
        
        // Read the database.sql file
        $sql = file_get_contents('database.sql');
        
        // Use multi_query for better handling of SQL script files
        if ($conn->multi_query($sql)) {
            do {
                // Store first result set
                if ($result = $conn->store_result()) {
                    $result->free();
                }
            } while ($conn->next_result());
            echo "<p style='color: green;'>Database schema imported successfully.</p>";
        } else {
            echo "<p style='color: red;'>Error importing database schema: " . $conn->error . "</p>";
            $conn->close();
            exit;
        }
        
        // Check if demo data should be loaded
        if (isset($_POST['load_demo_data']) && $_POST['load_demo_data'] == 'yes') {
            echo "<h2>Loading Chemical Market Demo Data</h2>";
            $demoSql = file_get_contents('demo_chemical_data.sql');
            if ($conn->multi_query($demoSql)) {
                 do {
                    if ($result = $conn->store_result()) {
                        $result->free();
                    }
                } while ($conn->next_result());
                echo "<h3 style='color: green;'>Chemical market demo data loaded successfully!</h3>";
            } else {
                echo "<p style='color: red;'>Error loading demo data: " . $conn->error . "</p>";
                $conn->close();
                exit;
            }
        }
        
        $conn->close();
        
        echo "<h2 style='color: green;'>Installation completed successfully!</h2>";
        echo "<p>You can now access the application by navigating to your web directory.</p>";
        echo "<p><strong>Important:</strong> Delete this install.php file for security reasons.</p>";
        echo "<p><a href='index.html'>Go to Application</a></p>";
        
    } catch (Exception $e) {
        echo "<p style='color: red;'>Error during installation: " . $e->getMessage() . "</p>";
    }
    
    exit;
}
?>

<form method="POST">
    <h2>Database Installation</h2>
    <p>Click the button below to install the database schema for the Trading Business Application.</p>
    
    <div>
        <input type="checkbox" id="load_demo_data" name="load_demo_data" value="yes" checked>
        <label for="load_demo_data">Load chemical market demo data (recommended for testing)</label>
    </div>
    
    <br>
    <input type="submit" value="Install Database" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
</form>

<p><strong>Note:</strong> Make sure your MySQL service is running before running this installation.</p>
<p><strong>FBR Compliance:</strong> This application includes Sales Tax Register functionality for Pakistan FBR compliance, with support for NTN, STRN and CSV export for IRIS/WeBOC filing.</p>