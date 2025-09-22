<!DOCTYPE html>
<html>
<head>
    <title>Simple API Test</title>
</head>
<body>
    <h1>Simple API Test</h1>
    
    <h2>Accounts API Test</h2>
    <button onclick="testAccountsAPI()">Test Accounts API</button>
    <div id="accounts-result"></div>
    
    <h2>Account Groups API Test</h2>
    <button onclick="testAccountGroupsAPI()">Test Account Groups API</button>
    <div id="groups-result"></div>
    
    <h2>Transactions API Test</h2>
    <button onclick="testTransactionsAPI()">Test Transactions API</button>
    <div id="transactions-result"></div>

    <script>
        function testAccountsAPI() {
            fetch('./api/accounts.php')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('accounts-result').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                })
                .catch(error => {
                    document.getElementById('accounts-result').innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
                });
        }
        
        function testAccountGroupsAPI() {
            fetch('./api/account_groups.php')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('groups-result').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                })
                .catch(error => {
                    document.getElementById('groups-result').innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
                });
        }
        
        function testTransactionsAPI() {
            fetch('./api/transactions.php')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('transactions-result').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                })
                .catch(error => {
                    document.getElementById('transactions-result').innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
                });
        }
    </script>
</body>
</html>