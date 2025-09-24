<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction Management</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../styles.css">
    <style>
        .form-container {
            max-width: 1200px;
            margin: 20px auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        .form-group input, 
        .form-group select, 
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
        
        .form-row {
            display: flex;
            gap: 15px;
        }
        
        .form-row .form-group {
            flex: 1;
        }
        
        .btn-group {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .btn-primary {
            background: #007bff;
            color: white;
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .btn-success {
            background: #28a745;
            color: white;
        }
        
        .btn-warning {
            background: #ffc107;
            color: black;
        }
        
        .btn-danger {
            background: #dc3545;
            color: white;
        }
        
        .btn-info {
            background: #17a2b8;
            color: white;
        }
        
        .btn:hover {
            opacity: 0.9;
        }
        
        .search-container {
            margin-bottom: 20px;
        }
        
        .search-container input {
            width: 300px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        th {
            background-color: #f8f9fa;
        }
        
        tr:hover {
            background-color: #f8f9fa;
        }
        
        .actions {
            display: flex;
            gap: 5px;
        }
        
        .action-btn {
            padding: 5px 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .edit-btn {
            background: #ffc107;
            color: black;
        }
        
        .delete-btn {
            background: #dc3545;
            color: white;
        }
        
        .print-btn {
            background: #17a2b8;
            color: white;
        }
        
        .filter-container {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .filter-group {
            flex: 1;
            min-width: 200px;
        }
        
        .voucher-details {
            margin-top: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
        }
        
        .detail-row {
            display: flex;
            margin-bottom: 10px;
            padding: 5px 0;
        }
        
        .detail-cell {
            flex: 1;
            padding: 0 5px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .voucher-header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .voucher-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        @media print {
            .no-print {
                display: none !important;
            }
            
            body {
                font-size: 12px;
            }
            
            .form-container {
                box-shadow: none;
                padding: 0;
            }
            
            table {
                font-size: 12px;
            }
            
            th, td {
                padding: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1><i class="fas fa-exchange-alt"></i> Transaction Management</h1>
        
        <div class="form-container">
            <h2 id="form-title">Transaction List</h2>
            
            <div class="filter-container no-print">
                <div class="filter-group">
                    <label for="filter-type">Transaction Type</label>
                    <select id="filter-type">
                        <option value="">All Types</option>
                        <option value="Sales">Sales</option>
                        <option value="Purchase">Purchase</option>
                        <option value="Payment">Payment</option>
                        <option value="Receipt">Receipt</option>
                        <option value="Journal">Journal</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label for="filter-date-from">From Date</label>
                    <input type="date" id="filter-date-from">
                </div>
                
                <div class="filter-group">
                    <label for="filter-date-to">To Date</label>
                    <input type="date" id="filter-date-to">
                </div>
                
                <div class="filter-group">
                    <label for="filter-party">Party</label>
                    <select id="filter-party">
                        <option value="">All Parties</option>
                    </select>
                </div>
                
                <div class="filter-group" style="display: flex; align-items: flex-end;">
                    <button id="apply-filter" class="btn btn-primary">
                        <i class="fas fa-filter"></i> Apply Filter
                    </button>
                    <button id="reset-filter" class="btn btn-secondary" style="margin-left: 10px;">
                        <i class="fas fa-times"></i> Reset
                    </button>
                </div>
            </div>
            
            <div class="search-container no-print">
                <input type="text" id="search-transaction" placeholder="Search transactions...">
            </div>
            
            <table id="transactions-table">
                <thead>
                    <tr>
                        <th>Voucher No</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Party</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th class="no-print">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Transaction rows will be populated dynamically -->
                </tbody>
            </table>
            
            <div class="btn-group no-print">
                <button id="refresh-btn" class="btn btn-info">
                    <i class="fas fa-sync"></i> Refresh
                </button>
            </div>
        </div>
    </div>

    <!-- Print Voucher Modal -->
    <div id="print-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
        <div style="background: white; padding: 20px; border-radius: 8px; max-width: 800px; width: 90%; max-height: 90%; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <h2>Transaction Voucher</h2>
                <button id="close-modal" class="btn btn-secondary">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
            <div id="voucher-content">
                <!-- Voucher content will be loaded here -->
            </div>
            <div style="margin-top: 20px; text-align: center;" class="no-print">
                <button id="print-voucher" class="btn btn-primary">
                    <i class="fas fa-print"></i> Print Voucher
                </button>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = '../api';
        let editingTransactionId = null;
        
        // Load parties for the filter dropdown
        function loadParties() {
            fetch(`${API_BASE}/parties.php`)
                .then(response => response.json())
                .then(parties => {
                    const partySelect = document.getElementById('filter-party');
                    parties.forEach(party => {
                        const option = document.createElement('option');
                        option.value = party.id;
                        option.textContent = party.name;
                        partySelect.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error('Error loading parties:', error);
                });
        }
        
        // Load transactions into the table
        function loadTransactions(filter = {}) {
            let url = `${API_BASE}/transactions.php`;
            const params = new URLSearchParams();
            
            if (filter.type) params.append('type', filter.type);
            
            if (Object.keys(params).length > 0) {
                url += '?' + params.toString();
            }
            
            fetch(url)
                .then(response => response.json())
                .then(transactions => {
                    const tbody = document.querySelector('#transactions-table tbody');
                    tbody.innerHTML = '';
                    
                    // Apply date filter if set
                    let filteredTransactions = transactions;
                    if (filter.dateFrom || filter.dateTo) {
                        filteredTransactions = transactions.filter(transaction => {
                            const transactionDate = new Date(transaction.date);
                            if (filter.dateFrom && transactionDate < new Date(filter.dateFrom)) {
                                return false;
                            }
                            if (filter.dateTo && transactionDate > new Date(filter.dateTo)) {
                                return false;
                            }
                            return true;
                        });
                    }
                    
                    // Apply party filter if set
                    if (filter.partyId) {
                        filteredTransactions = filteredTransactions.filter(transaction => 
                            transaction.party_id == filter.partyId);
                    }
                    
                    // Apply search filter
                    const searchTerm = (document.getElementById('search-transaction')?.value || '').toLowerCase();
                    if (searchTerm) {
                        filteredTransactions = filteredTransactions.filter(transaction => 
                            transaction.voucher_no.toLowerCase().includes(searchTerm) ||
                            (transaction.party_name && transaction.party_name.toLowerCase().includes(searchTerm)) ||
                            transaction.description.toLowerCase().includes(searchTerm)
                        );
                    }
                    
                    filteredTransactions.forEach(transaction => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${transaction.voucher_no}</td>
                            <td>${formatDate(transaction.date)}</td>
                            <td>${transaction.type}</td>
                            <td>${transaction.party_name || 'N/A'}</td>
                            <td>${transaction.description || ''}</td>
                            <td>₨${parseFloat(transaction.total_amount || transaction.amount || 0).toFixed(2)}</td>
                            <td class="actions no-print">
                                <button class="action-btn edit-btn" data-id="${transaction.id}" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete-btn" data-id="${transaction.id}" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="action-btn print-btn" data-id="${transaction.id}" title="Print">
                                    <i class="fas fa-print"></i>
                                </button>
                            </td>
                        `;
                        tbody.appendChild(row);
                    });
                    
                    // Add event listeners to action buttons
                    document.querySelectorAll('.edit-btn').forEach(btn => {
                        btn.addEventListener('click', () => editTransaction(btn.dataset.id));
                    });
                    
                    document.querySelectorAll('.delete-btn').forEach(btn => {
                        btn.addEventListener('click', () => deleteTransaction(btn.dataset.id));
                    });
                    
                    document.querySelectorAll('.print-btn').forEach(btn => {
                        btn.addEventListener('click', () => printTransaction(btn.dataset.id));
                    });
                })
                .catch(error => {
                    console.error('Error loading transactions:', error);
                    showNotification('Error loading transactions: ' + error.message, 'error');
                });
        }
        
        // Edit transaction
        function editTransaction(id) {
            // Redirect to appropriate voucher form based on transaction type
            fetch(`${API_BASE}/transactions.php?id=${id}`)
                .then(response => response.json())
                .then(transaction => {
                    let formUrl = '';
                    switch(transaction.type) {
                        case 'Sales':
                            formUrl = 'sales_voucher.html';
                            break;
                        case 'Purchase':
                            formUrl = 'purchase_voucher.html';
                            break;
                        case 'Payment':
                            formUrl = 'payment_voucher.html';
                            break;
                        case 'Receipt':
                            formUrl = 'receipt_voucher.html';
                            break;
                        case 'Journal':
                            formUrl = 'journal_voucher.html';
                            break;
                        default:
                            showNotification('Unsupported transaction type', 'error');
                            return;
                    }
                    
                    // Redirect to the appropriate form with transaction ID
                    window.location.href = `${formUrl}?id=${id}`;
                })
                .catch(error => {
                    console.error('Error loading transaction:', error);
                    showNotification('Error loading transaction: ' + error.message, 'error');
                });
        }
        
        // Delete transaction
        function deleteTransaction(id) {
            if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
                fetch(`${API_BASE}/transactions.php?id=${id}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        return response.json().then(data => {
                            throw new Error(data.message || 'Failed to delete transaction');
                        });
                    }
                })
                .then(data => {
                    showNotification('Transaction deleted successfully!', 'success');
                    loadTransactions(getCurrentFilters());
                })
                .catch(error => {
                    showNotification('Error deleting transaction: ' + error.message, 'error');
                });
            }
        }
        
        // Print transaction
        function printTransaction(id) {
            fetch(`${API_BASE}/transactions.php?id=${id}`)
                .then(response => response.json())
                .then(transaction => {
                    const voucherContent = document.getElementById('voucher-content');
                    voucherContent.innerHTML = generateVoucherHTML(transaction);
                    document.getElementById('print-modal').style.display = 'flex';
                })
                .catch(error => {
                    console.error('Error loading transaction for print:', error);
                    showNotification('Error loading transaction: ' + error.message, 'error');
                });
        }
        
        // Generate HTML for voucher print
        function generateVoucherHTML(transaction) {
            let detailsHTML = '';
            if (transaction.details && transaction.details.length > 0) {
                detailsHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr>
                                <th style="border: 1px solid #ddd; padding: 8px;">Account</th>
                                <th style="border: 1px solid #ddd; padding: 8px;">Description</th>
                                <th style="border: 1px solid #ddd; padding: 8px;">Debit</th>
                                <th style="border: 1px solid #ddd; padding: 8px;">Credit</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                let totalDebit = 0;
                let totalCredit = 0;
                
                transaction.details.forEach(detail => {
                    const debit = detail.type === 'Debit' ? parseFloat(detail.total_amount || detail.amount || 0) : 0;
                    const credit = detail.type === 'Credit' ? parseFloat(detail.total_amount || detail.amount || 0) : 0;
                    
                    totalDebit += debit;
                    totalCredit += credit;
                    
                    detailsHTML += `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">${detail.account_name || ''}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${detail.description || ''}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${debit > 0 ? '₨' + debit.toFixed(2) : ''}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${credit > 0 ? '₨' + credit.toFixed(2) : ''}</td>
                        </tr>
                    `;
                });
                
                detailsHTML += `
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="2" style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total:</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">₨${totalDebit.toFixed(2)}</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">₨${totalCredit.toFixed(2)}</th>
                            </tr>
                        </tfoot>
                    </table>
                `;
            }
            
            return `
                <div class="voucher-header">
                    <div class="voucher-title">${transaction.type} Voucher</div>
                    <div>Voucher No: ${transaction.voucher_no}</div>
                    <div>Date: ${formatDate(transaction.date)}</div>
                    ${transaction.party_name ? `<div>Party: ${transaction.party_name}</div>` : ''}
                    ${transaction.party_ntn ? `<div>NTN: ${transaction.party_ntn}</div>` : ''}
                    ${transaction.party_strn ? `<div>STRN: ${transaction.party_strn}</div>` : ''}
                </div>
                
                <div style="margin: 20px 0;">
                    <strong>Description:</strong> ${transaction.description || 'N/A'}
                </div>
                
                ${detailsHTML}
                
                <div style="margin-top: 30px; display: flex; justify-content: space-between;">
                    <div>Prepared by: _________________</div>
                    <div>Checked by: _________________</div>
                    <div>Approved by: _________________</div>
                </div>
            `;
        }
        
        // Format date for display
        function formatDate(dateString) {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        }
        
        // Get current filter values
        function getCurrentFilters() {
            return {
                type: document.getElementById('filter-type').value,
                dateFrom: document.getElementById('filter-date-from').value,
                dateTo: document.getElementById('filter-date-to').value,
                partyId: document.getElementById('filter-party').value
            };
        }
        
        // Show notification
        function showNotification(message, type) {
            // Create notification element if it doesn't exist
            let notification = document.getElementById('notification');
            if (!notification) {
                notification = document.createElement('div');
                notification.id = 'notification';
                notification.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 15px; border-radius: 4px; color: white; font-weight: bold; z-index: 1000; display: none;';
                document.body.appendChild(notification);
            }
            
            // Set message and type
            notification.textContent = message;
            notification.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
            notification.style.display = 'block';
            
            // Auto hide after 3 seconds
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
        
        // Event Listeners
        document.addEventListener('DOMContentLoaded', function() {
            loadParties();
            loadTransactions();
            
            // Apply filter button
            document.getElementById('apply-filter').addEventListener('click', function() {
                loadTransactions(getCurrentFilters());
            });
            
            // Reset filter button
            document.getElementById('reset-filter').addEventListener('click', function() {
                document.getElementById('filter-type').value = '';
                document.getElementById('filter-date-from').value = '';
                document.getElementById('filter-date-to').value = '';
                document.getElementById('filter-party').value = '';
                document.getElementById('search-transaction').value = '';
                loadTransactions();
            });
            
            // Refresh button
            document.getElementById('refresh-btn').addEventListener('click', function() {
                loadTransactions(getCurrentFilters());
            });
            
            // Search input
            document.getElementById('search-transaction').addEventListener('input', function() {
                loadTransactions(getCurrentFilters());
            });
            
            // Close modal
            document.getElementById('close-modal').addEventListener('click', function() {
                document.getElementById('print-modal').style.display = 'none';
            });
            
            // Print voucher
            document.getElementById('print-voucher').addEventListener('click', function() {
                window.print();
            });
            
            // Close modal when clicking outside
            document.getElementById('print-modal').addEventListener('click', function(e) {
                if (e.target.id === 'print-modal') {
                    document.getElementById('print-modal').style.display = 'none';
                }
            });
        });
    </script>
</body>
</html>