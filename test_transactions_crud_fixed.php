<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Transactions CRUD Operations</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .test-section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .test-section h2 {
            margin-top: 0;
            color: #333;
        }
        .btn {
            padding: 10px 15px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        .btn:hover {
            background-color: #0056b3;
        }
        .btn.success {
            background-color: #28a745;
        }
        .btn.warning {
            background-color: #ffc107;
            color: black;
        }
        .btn.danger {
            background-color: #dc3545;
        }
        .result {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
            display: none;
        }
        .result.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .result.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        pre {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Transactions CRUD Operations Test</h1>
        <p>This page tests all CRUD operations for transactions including Create, Read, Update, Delete, and Print functionality.</p>
        
        <div class="test-section">
            <h2>Sales Transaction Test</h2>
            <button class="btn" onclick="testCreateSales()">Create Sales</button>
            <button class="btn" onclick="testReadSales()">Read Sales</button>
            <button class="btn" onclick="testUpdateSales()">Update Sales</button>
            <button class="btn danger" onclick="testDeleteSales()">Delete Sales</button>
            <div id="sales-result" class="result"></div>
        </div>
        
        <div class="test-section">
            <h2>Purchase Transaction Test</h2>
            <button class="btn" onclick="testCreatePurchase()">Create Purchase</button>
            <button class="btn" onclick="testReadPurchase()">Read Purchase</button>
            <button class="btn" onclick="testUpdatePurchase()">Update Purchase</button>
            <button class="btn danger" onclick="testDeletePurchase()">Delete Purchase</button>
            <div id="purchase-result" class="result"></div>
        </div>
        
        <div class="test-section">
            <h2>Payment Transaction Test</h2>
            <button class="btn" onclick="testCreatePayment()">Create Payment</button>
            <button class="btn" onclick="testReadPayment()">Read Payment</button>
            <button class="btn" onclick="testUpdatePayment()">Update Payment</button>
            <button class="btn danger" onclick="testDeletePayment()">Delete Payment</button>
            <div id="payment-result" class="result"></div>
        </div>
        
        <div class="test-section">
            <h2>Receipt Transaction Test</h2>
            <button class="btn" onclick="testCreateReceipt()">Create Receipt</button>
            <button class="btn" onclick="testReadReceipt()">Read Receipt</button>
            <button class="btn" onclick="testUpdateReceipt()">Update Receipt</button>
            <button class="btn danger" onclick="testDeleteReceipt()">Delete Receipt</button>
            <div id="receipt-result" class="result"></div>
        </div>
        
        <div class="test-section">
            <h2>Journal Transaction Test</h2>
            <button class="btn" onclick="testCreateJournal()">Create Journal</button>
            <button class="btn" onclick="testReadJournal()">Read Journal</button>
            <button class="btn" onclick="testUpdateJournal()">Update Journal</button>
            <button class="btn danger" onclick="testDeleteJournal()">Delete Journal</button>
            <div id="journal-result" class="result"></div>
        </div>
    </div>

    <script>
        const API_BASE = 'api';
        let createdTransactionIds = {};
        
        // Helper function to show results
        function showResult(elementId, message, isSuccess) {
            const element = document.getElementById(elementId);
            element.textContent = message;
            element.className = 'result ' + (isSuccess ? 'success' : 'error');
            element.style.display = 'block';
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
        
        // Helper function to make API requests
        async function apiRequest(url, method, data = null) {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (data) {
                options.body = JSON.stringify(data);
            }
            
            try {
                const response = await fetch(url, options);
                const result = await response.json();
                return { success: response.ok, data: result, status: response.status };
            } catch (error) {
                return { success: false, data: { message: error.message }, status: 0 };
            }
        }
        
        // Sales Transaction Tests
        async function testCreateSales() {
            const salesData = {
                voucher_no: "SL-TEST-001",
                date: new Date().toISOString().split('T')[0],
                type: "Sales",
                description: "Test Sales Transaction",
                party_id: 1,
                amount: 1000,
                tax_amount: 170,
                total_amount: 1170,
                details: [
                    {
                        account_id: 2,
                        item_id: 1,
                        quantity: 100,
                        rate: 10,
                        amount: 1000,
                        tax_rate: 17,
                        tax_amount: 170,
                        total_amount: 1170,
                        type: "Credit"
                    },
                    {
                        account_id: 1,
                        amount: 1170,
                        type: "Debit"
                    }
                ]
            };
            
            const result = await apiRequest(`${API_BASE}/transactions.php`, 'POST', salesData);
            if (result.success) {
                createdTransactionIds.sales = result.data.id;
                showResult('sales-result', `Sales transaction created successfully with ID: ${result.data.id}`, true);
            } else {
                showResult('sales-result', `Error creating sales transaction: ${result.data.message}`, false);
            }
        }
        
        async function testReadSales() {
            if (!createdTransactionIds.sales) {
                showResult('sales-result', 'Please create a sales transaction first', false);
                return;
            }
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.sales}`, 'GET');
            if (result.success) {
                showResult('sales-result', `Sales transaction retrieved successfully: ${JSON.stringify(result.data)}`, true);
            } else {
                showResult('sales-result', `Error retrieving sales transaction: ${result.data.message}`, false);
            }
        }
        
        async function testUpdateSales() {
            if (!createdTransactionIds.sales) {
                showResult('sales-result', 'Please create a sales transaction first', false);
                return;
            }
            
            const salesData = {
                voucher_no: "SL-TEST-001-UPD",
                date: new Date().toISOString().split('T')[0],
                type: "Sales",
                description: "Updated Test Sales Transaction",
                party_id: 1,
                amount: 1500,
                tax_amount: 255,
                total_amount: 1755,
                details: [
                    {
                        account_id: 2,
                        item_id: 1,
                        quantity: 150,
                        rate: 10,
                        amount: 1500,
                        tax_rate: 17,
                        tax_amount: 255,
                        total_amount: 1755,
                        type: "Credit"
                    },
                    {
                        account_id: 1,
                        amount: 1755,
                        type: "Debit"
                    }
                ]
            };
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.sales}`, 'PUT', salesData);
            if (result.success) {
                showResult('sales-result', `Sales transaction updated successfully`, true);
            } else {
                showResult('sales-result', `Error updating sales transaction: ${result.data.message}`, false);
            }
        }
        
        async function testDeleteSales() {
            if (!createdTransactionIds.sales) {
                showResult('sales-result', 'Please create a sales transaction first', false);
                return;
            }
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.sales}`, 'DELETE');
            if (result.success) {
                delete createdTransactionIds.sales;
                showResult('sales-result', `Sales transaction deleted successfully`, true);
            } else {
                showResult('sales-result', `Error deleting sales transaction: ${result.data.message}`, false);
            }
        }
        
        // Purchase Transaction Tests
        async function testCreatePurchase() {
            const purchaseData = {
                voucher_no: "PU-TEST-001",
                date: new Date().toISOString().split('T')[0],
                type: "Purchase",
                description: "Test Purchase Transaction",
                party_id: 2,
                amount: 500,
                tax_amount: 85,
                total_amount: 585,
                details: [
                    {
                        account_id: 3,
                        item_id: 1,
                        quantity: 50,
                        rate: 10,
                        amount: 500,
                        tax_rate: 17,
                        tax_amount: 85,
                        total_amount: 585,
                        type: "Debit"
                    },
                    {
                        account_id: 1,
                        amount: 585,
                        type: "Credit"
                    }
                ]
            };
            
            const result = await apiRequest(`${API_BASE}/transactions.php`, 'POST', purchaseData);
            if (result.success) {
                createdTransactionIds.purchase = result.data.id;
                showResult('purchase-result', `Purchase transaction created successfully with ID: ${result.data.id}`, true);
            } else {
                showResult('purchase-result', `Error creating purchase transaction: ${result.data.message}`, false);
            }
        }
        
        async function testReadPurchase() {
            if (!createdTransactionIds.purchase) {
                showResult('purchase-result', 'Please create a purchase transaction first', false);
                return;
            }
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.purchase}`, 'GET');
            if (result.success) {
                showResult('purchase-result', `Purchase transaction retrieved successfully: ${JSON.stringify(result.data)}`, true);
            } else {
                showResult('purchase-result', `Error retrieving purchase transaction: ${result.data.message}`, false);
            }
        }
        
        async function testUpdatePurchase() {
            if (!createdTransactionIds.purchase) {
                showResult('purchase-result', 'Please create a purchase transaction first', false);
                return;
            }
            
            const purchaseData = {
                voucher_no: "PU-TEST-001-UPD",
                date: new Date().toISOString().split('T')[0],
                type: "Purchase",
                description: "Updated Test Purchase Transaction",
                party_id: 2,
                amount: 750,
                tax_amount: 127.5,
                total_amount: 877.5,
                details: [
                    {
                        account_id: 3,
                        item_id: 1,
                        quantity: 75,
                        rate: 10,
                        amount: 750,
                        tax_rate: 17,
                        tax_amount: 127.5,
                        total_amount: 877.5,
                        type: "Debit"
                    },
                    {
                        account_id: 1,
                        amount: 877.5,
                        type: "Credit"
                    }
                ]
            };
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.purchase}`, 'PUT', purchaseData);
            if (result.success) {
                showResult('purchase-result', `Purchase transaction updated successfully`, true);
            } else {
                showResult('purchase-result', `Error updating purchase transaction: ${result.data.message}`, false);
            }
        }
        
        async function testDeletePurchase() {
            if (!createdTransactionIds.purchase) {
                showResult('purchase-result', 'Please create a purchase transaction first', false);
                return;
            }
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.purchase}`, 'DELETE');
            if (result.success) {
                delete createdTransactionIds.purchase;
                showResult('purchase-result', `Purchase transaction deleted successfully`, true);
            } else {
                showResult('purchase-result', `Error deleting purchase transaction: ${result.data.message}`, false);
            }
        }
        
        // Payment Transaction Tests
        async function testCreatePayment() {
            const paymentData = {
                voucher_no: "PM-TEST-001",
                date: new Date().toISOString().split('T')[0],
                type: "Payment",
                description: "Test Payment Transaction",
                party_id: 2,
                amount: 1000,
                tax_amount: 0,
                total_amount: 1000,
                details: [
                    {
                        account_id: 4,
                        amount: 1000,
                        tax_rate: 0,
                        tax_amount: 0,
                        total_amount: 1000,
                        type: "Credit",
                        description: "Payment to supplier"
                    },
                    {
                        account_id: 2,
                        amount: 1000,
                        type: "Debit"
                    }
                ]
            };
            
            const result = await apiRequest(`${API_BASE}/transactions.php`, 'POST', paymentData);
            if (result.success) {
                createdTransactionIds.payment = result.data.id;
                showResult('payment-result', `Payment transaction created successfully with ID: ${result.data.id}`, true);
            } else {
                showResult('payment-result', `Error creating payment transaction: ${result.data.message}`, false);
            }
        }
        
        async function testReadPayment() {
            if (!createdTransactionIds.payment) {
                showResult('payment-result', 'Please create a payment transaction first', false);
                return;
            }
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.payment}`, 'GET');
            if (result.success) {
                showResult('payment-result', `Payment transaction retrieved successfully: ${JSON.stringify(result.data)}`, true);
            } else {
                showResult('payment-result', `Error retrieving payment transaction: ${result.data.message}`, false);
            }
        }
        
        async function testUpdatePayment() {
            if (!createdTransactionIds.payment) {
                showResult('payment-result', 'Please create a payment transaction first', false);
                return;
            }
            
            const paymentData = {
                voucher_no: "PM-TEST-001-UPD",
                date: new Date().toISOString().split('T')[0],
                type: "Payment",
                description: "Updated Test Payment Transaction",
                party_id: 2,
                amount: 1500,
                tax_amount: 0,
                total_amount: 1500,
                details: [
                    {
                        account_id: 4,
                        amount: 1500,
                        tax_rate: 0,
                        tax_amount: 0,
                        total_amount: 1500,
                        type: "Credit",
                        description: "Updated payment to supplier"
                    },
                    {
                        account_id: 2,
                        amount: 1500,
                        type: "Debit"
                    }
                ]
            };
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.payment}`, 'PUT', paymentData);
            if (result.success) {
                showResult('payment-result', `Payment transaction updated successfully`, true);
            } else {
                showResult('payment-result', `Error updating payment transaction: ${result.data.message}`, false);
            }
        }
        
        async function testDeletePayment() {
            if (!createdTransactionIds.payment) {
                showResult('payment-result', 'Please create a payment transaction first', false);
                return;
            }
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.payment}`, 'DELETE');
            if (result.success) {
                delete createdTransactionIds.payment;
                showResult('payment-result', `Payment transaction deleted successfully`, true);
            } else {
                showResult('payment-result', `Error deleting payment transaction: ${result.data.message}`, false);
            }
        }
        
        // Receipt Transaction Tests
        async function testCreateReceipt() {
            const receiptData = {
                voucher_no: "RC-TEST-001",
                date: new Date().toISOString().split('T')[0],
                type: "Receipt",
                description: "Test Receipt Transaction",
                party_id: 1,
                amount: 2000,
                tax_amount: 0,
                total_amount: 2000,
                details: [
                    {
                        account_id: 1,
                        amount: 2000,
                        tax_rate: 0,
                        tax_amount: 0,
                        total_amount: 2000,
                        type: "Debit",
                        description: "Receipt from customer"
                    },
                    {
                        account_id: 1,
                        amount: 2000,
                        type: "Credit"
                    }
                ]
            };
            
            const result = await apiRequest(`${API_BASE}/transactions.php`, 'POST', receiptData);
            if (result.success) {
                createdTransactionIds.receipt = result.data.id;
                showResult('receipt-result', `Receipt transaction created successfully with ID: ${result.data.id}`, true);
            } else {
                showResult('receipt-result', `Error creating receipt transaction: ${result.data.message}`, false);
            }
        }
        
        async function testReadReceipt() {
            if (!createdTransactionIds.receipt) {
                showResult('receipt-result', 'Please create a receipt transaction first', false);
                return;
            }
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.receipt}`, 'GET');
            if (result.success) {
                showResult('receipt-result', `Receipt transaction retrieved successfully: ${JSON.stringify(result.data)}`, true);
            } else {
                showResult('receipt-result', `Error retrieving receipt transaction: ${result.data.message}`, false);
            }
        }
        
        async function testUpdateReceipt() {
            if (!createdTransactionIds.receipt) {
                showResult('receipt-result', 'Please create a receipt transaction first', false);
                return;
            }
            
            const receiptData = {
                voucher_no: "RC-TEST-001-UPD",
                date: new Date().toISOString().split('T')[0],
                type: "Receipt",
                description: "Updated Test Receipt Transaction",
                party_id: 1,
                amount: 2500,
                tax_amount: 0,
                total_amount: 2500,
                details: [
                    {
                        account_id: 1,
                        amount: 2500,
                        tax_rate: 0,
                        tax_amount: 0,
                        total_amount: 2500,
                        type: "Debit",
                        description: "Updated receipt from customer"
                    },
                    {
                        account_id: 1,
                        amount: 2500,
                        type: "Credit"
                    }
                ]
            };
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.receipt}`, 'PUT', receiptData);
            if (result.success) {
                showResult('receipt-result', `Receipt transaction updated successfully`, true);
            } else {
                showResult('receipt-result', `Error updating receipt transaction: ${result.data.message}`, false);
            }
        }
        
        async function testDeleteReceipt() {
            if (!createdTransactionIds.receipt) {
                showResult('receipt-result', 'Please create a receipt transaction first', false);
                return;
            }
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.receipt}`, 'DELETE');
            if (result.success) {
                delete createdTransactionIds.receipt;
                showResult('receipt-result', `Receipt transaction deleted successfully`, true);
            } else {
                showResult('receipt-result', `Error deleting receipt transaction: ${result.data.message}`, false);
            }
        }
        
        // Journal Transaction Tests
        async function testCreateJournal() {
            const journalData = {
                voucher_no: "JV-TEST-001",
                date: new Date().toISOString().split('T')[0],
                type: "Journal",
                description: "Test Journal Transaction",
                amount: 1000,
                tax_amount: 0,
                total_amount: 1000,
                details: [
                    {
                        account_id: 1,
                        amount: 1000,
                        tax_rate: 0,
                        tax_amount: 0,
                        total_amount: 1000,
                        type: "Debit",
                        description: "Cash received"
                    },
                    {
                        account_id: 5,
                        amount: 1000,
                        tax_rate: 0,
                        tax_amount: 0,
                        total_amount: 1000,
                        type: "Credit",
                        description: "Income"
                    }
                ]
            };
            
            const result = await apiRequest(`${API_BASE}/transactions.php`, 'POST', journalData);
            if (result.success) {
                createdTransactionIds.journal = result.data.id;
                showResult('journal-result', `Journal transaction created successfully with ID: ${result.data.id}`, true);
            } else {
                showResult('journal-result', `Error creating journal transaction: ${result.data.message}`, false);
            }
        }
        
        async function testReadJournal() {
            if (!createdTransactionIds.journal) {
                showResult('journal-result', 'Please create a journal transaction first', false);
                return;
            }
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.journal}`, 'GET');
            if (result.success) {
                showResult('journal-result', `Journal transaction retrieved successfully: ${JSON.stringify(result.data)}`, true);
            } else {
                showResult('journal-result', `Error retrieving journal transaction: ${result.data.message}`, false);
            }
        }
        
        async function testUpdateJournal() {
            if (!createdTransactionIds.journal) {
                showResult('journal-result', 'Please create a journal transaction first', false);
                return;
            }
            
            const journalData = {
                voucher_no: "JV-TEST-001-UPD",
                date: new Date().toISOString().split('T')[0],
                type: "Journal",
                description: "Updated Test Journal Transaction",
                amount: 1500,
                tax_amount: 0,
                total_amount: 1500,
                details: [
                    {
                        account_id: 1,
                        amount: 1500,
                        tax_rate: 0,
                        tax_amount: 0,
                        total_amount: 1500,
                        type: "Debit",
                        description: "Updated cash received"
                    },
                    {
                        account_id: 5,
                        amount: 1500,
                        tax_rate: 0,
                        tax_amount: 0,
                        total_amount: 1500,
                        type: "Credit",
                        description: "Updated income"
                    }
                ]
            };
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.journal}`, 'PUT', journalData);
            if (result.success) {
                showResult('journal-result', `Journal transaction updated successfully`, true);
            } else {
                showResult('journal-result', `Error updating journal transaction: ${result.data.message}`, false);
            }
        }
        
        async function testDeleteJournal() {
            if (!createdTransactionIds.journal) {
                showResult('journal-result', 'Please create a journal transaction first', false);
                return;
            }
            
            const result = await apiRequest(`${API_BASE}/transactions.php?id=${createdTransactionIds.journal}`, 'DELETE');
            if (result.success) {
                delete createdTransactionIds.journal;
                showResult('journal-result', `Journal transaction deleted successfully`, true);
            } else {
                showResult('journal-result', `Error deleting journal transaction: ${result.data.message}`, false);
            }
        }
    </script>
</body>
</html>