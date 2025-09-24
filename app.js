// API Base URL
const API_BASE = './api';

// DOM Elements
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('.nav-link');
const tabButtons = document.querySelectorAll('.tab-button');

// State
let accounts = [];
let items = [];
let transactions = [];
let parties = [];
let categories = [];
let accountGroups = []; // Added for account groups

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log("App initialized");
    
    // Navigation
    if (navLinks) {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const view = this.getAttribute('data-view');
                console.log("Switching to view:", view);
                switchView(view);
            });
        });
    }
    
    // Tab switching
    if (tabButtons) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tab = this.getAttribute('data-tab');
                console.log("Switching to tab:", tab);
                switchTab(tab);
            });
        });
    }
    
    // Load initial data
    loadDashboardData();
    loadCategories();
    loadAccounts();
    loadItems();
    loadTransactions();
    loadParties();
    loadAccountGroups(); // Load account groups
    
    // Set up report filters
    setupReportFilters();
    
    // Set up form submissions
    setupFormSubmissions();
    
    // Set up export functionality
    setupExportFunctionality();
    
    // Set up form event listeners
    setupFormEventListeners();
});

// View Management
function switchView(viewName) {
    // Hide all views
    views.forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    // Update navigation
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-view') === viewName) {
            link.classList.add('active');
        }
    });
    
    // Load data based on view
    switch(viewName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'accounts':
            loadAccounts();
            loadParties(); // Reload parties for customer/supplier tabs
            loadAccountGroups(); // Reload account groups for potential display
            break;
        case 'inventory':
            loadItems();
            loadCategories(); // Reload categories for the categories tab
            break;
        case 'transactions':
            loadTransactions();
            break;
        case 'reports':
            setupReportFilters();
            break;
    }
}

function switchTab(tabName) {
    // Hide all tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab panel
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab button
    event.target.classList.add('active');

    // Specific actions for tabs
    if (tabName === 'categories') {
        loadCategories();
    } else if (tabName === 'chart-of-accounts') {
        loadAccounts();
    } else if (tabName === 'customers' || tabName === 'suppliers') {
        loadParties();
    }
}

// Notification System
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="close-btn">&times;</button>
    `;
    
    // Add close functionality
    notification.querySelector('.close-btn').addEventListener('click', function() {
        notification.remove();
    });
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Data Loading Functions
function loadDashboardData() {
    console.log("Loading dashboard data");
    
    // Load sales data
    fetch(`${API_BASE}/reports.php?type=sales`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Sales data loaded:", data);
            let totalSales = 0;
            if (Array.isArray(data)) {
                data.forEach(transaction => {
                    totalSales += parseFloat(transaction.total_amount || transaction.amount || 0);
                });
            }
            const salesElement = document.getElementById('total-sales');
            if (salesElement) {
                salesElement.textContent = '₨' + totalSales.toFixed(2);
            }
            loadRecentTransactions();
        })
        .catch(error => {
            console.error('Error loading sales data:', error);
            const salesElement = document.getElementById('total-sales');
            if (salesElement) {
                salesElement.textContent = '₨0.00';
            }
        });
    
    // Load purchases data
    fetch(`${API_BASE}/reports.php?type=purchase`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Purchase data loaded:", data);
            let totalPurchases = 0;
            if (Array.isArray(data)) {
                data.forEach(transaction => {
                    totalPurchases += parseFloat(transaction.total_amount || transaction.amount || 0);
                });
            }
            const purchasesElement = document.getElementById('total-purchases');
            if (purchasesElement) {
                purchasesElement.textContent = '₨' + totalPurchases.toFixed(2);
            }
        })
        .catch(error => {
            console.error('Error loading purchases data:', error);
            const purchasesElement = document.getElementById('total-purchases');
            if (purchasesElement) {
                purchasesElement.textContent = '₨0.00';
            }
        });
    
    // Load expenses data (from journal entries with expense accounts)
    fetch(`${API_BASE}/transactions.php?type=Journal`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Journal data loaded:", data);
            const expensesElement = document.getElementById('total-expenses');
            if (expensesElement) {
                expensesElement.textContent = '₨0.00';
            }
        })
        .catch(error => {
            console.error('Error loading expenses data:', error);
            const expensesElement = document.getElementById('total-expenses');
            if (expensesElement) {
                expensesElement.textContent = '₨0.00';
            }
        });
    
    // Load stock value
    fetch(`${API_BASE}/reports.php?type=stock`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Stock data loaded:", data);
            let totalStockValue = 0;
            if (Array.isArray(data)) {
                data.forEach(item => {
                    totalStockValue += parseFloat(item.stock_value || 0);
                });
            }
            const stockElement = document.getElementById('total-stock');
            if (stockElement) {
                stockElement.textContent = '₨' + totalStockValue.toFixed(2);
            }
        })
        .catch(error => {
            console.error('Error loading stock data:', error);
            const stockElement = document.getElementById('total-stock');
            if (stockElement) {
                stockElement.textContent = '₨0.00';
            }
        });
    
    loadRecentTransactions();
    loadLowStockItems();
}

function loadDashboardStats() {
    // Load sales data
    fetch(`${API_BASE}/reports.php?type=sales`)
        .then(response => response.json())
        .then(data => {
            let totalSales = 0;
            data.forEach(transaction => {
                totalSales += parseFloat(transaction.total_amount || transaction.amount || 0);
            });
            document.getElementById('total-sales').textContent = '₨' + totalSales.toFixed(2);
        })
        .catch(error => {
            console.error('Error loading sales data:', error);
            document.getElementById('total-sales').textContent = '₨0.00';
        });
    
    // Load purchases data
    fetch(`${API_BASE}/reports.php?type=purchase`)
        .then(response => response.json())
        .then(data => {
            let totalPurchases = 0;
            data.forEach(transaction => {
                totalPurchases += parseFloat(transaction.total_amount || transaction.amount || 0);
            });
            document.getElementById('total-purchases').textContent = '₨' + totalPurchases.toFixed(2);
        })
        .catch(error => {
            console.error('Error loading purchases data:', error);
            document.getElementById('total-purchases').textContent = '₨0.00';
        });
    
    // Load expenses data (from journal entries with expense accounts)
    fetch(`${API_BASE}/transactions.php?type=Journal`)
        .then(response => response.json())
        .then(data => {
            let totalExpenses = 0;
            // In a real implementation, we would filter for expense accounts
            // For now, we'll just show a placeholder
            document.getElementById('total-expenses').textContent = '₨0.00';
        })
        .catch(error => {
            console.error('Error loading expenses data:', error);
            document.getElementById('total-expenses').textContent = '₨0.00';
        });
    
    // Load stock value
    fetch(`${API_BASE}/reports.php?type=stock`)
        .then(response => response.json())
        .then(data => {
            let totalStockValue = 0;
            data.forEach(item => {
                totalStockValue += parseFloat(item.stock_value || 0);
            });
            document.getElementById('total-stock').textContent = '₨' + totalStockValue.toFixed(2);
        })
        .catch(error => {
            console.error('Error loading stock data:', error);
            document.getElementById('total-stock').textContent = '₨0.00';
        });
}

function loadRecentTransactions() {
    fetch(`${API_BASE}/transactions.php`)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                // Sort by date and take the 5 most recent
                const recentTransactions = data
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5);
                
                let transactionsHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Tax</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                if (recentTransactions.length > 0) {
                    recentTransactions.forEach(transaction => {
                        transactionsHTML += `
                            <tr>
                                <td>${transaction.date}</td>
                                <td>${transaction.type}</td>
                                <td>${transaction.description || 'N/A'}</td>
                                <td>₨${parseFloat(transaction.amount || 0).toFixed(2)}</td>
                                <td>₨${parseFloat(transaction.tax_amount || 0).toFixed(2)}</td>
                            </tr>
                        `;
                    });
                } else {
                    transactionsHTML += `
                        <tr>
                            <td colspan="5">No recent transactions</td>
                        </tr>
                    `;
                }
                
                transactionsHTML += `
                        </tbody>
                    </table>
                `;
                
                document.getElementById('recent-transactions').innerHTML = transactionsHTML;
            } else {
                document.getElementById('recent-transactions').innerHTML = '<p>Error loading transactions</p>';
            }
        })
        .catch(error => {
            console.error('Error loading recent transactions:', error);
            document.getElementById('recent-transactions').innerHTML = '<p>Error loading transactions</p>';
        });
}

function loadLowStockItems() {
    fetch(`${API_BASE}/reports.php?type=stock`)
        .then(response => response.json())
        .then(data => {
            // Filter for items with low stock (less than 10 units)
            const lowStockItems = data.filter(item => parseFloat(item.stock_quantity) < 10);
            
            let stockHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Current Stock</th>
                            <th>Unit</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (lowStockItems.length > 0) {
                lowStockItems.forEach(item => {
                    stockHTML += `
                        <tr>
                            <td>${item.name}</td>
                            <td>${parseFloat(item.stock_quantity).toFixed(2)}</td>
                            <td>${item.unit}</td>
                        </tr>
                    `;
                });
            } else {
                stockHTML += `
                    <tr>
                        <td colspan="3">No low stock items</td>
                    </tr>
                `;
            }
            
            stockHTML += `
                    </tbody>
                </table>
            `;
            
            document.getElementById('low-stock-items').innerHTML = stockHTML;
        })
        .catch(error => {
            console.error('Error loading stock data:', error);
            document.getElementById('low-stock-items').innerHTML = '<p>Error loading stock data</p>';
        });
}

function loadCategories(page = 1, search = '') {
    fetch(`${API_BASE}/categories.php?page=${page}&search=${search}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                categories = data.data;
                renderCategoriesList(data.pagination); // Render categories in the tab
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error loading categories:', error);
            showNotification('Error loading categories: ' + error.message, 'error');
            renderCategoriesList(); // Render with placeholder data if API fails
        });
}

function renderCategoriesList(pagination) {
    let categoriesHTML = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (categories.length > 0) {
        categories.forEach(category => {
            categoriesHTML += `
                <tr>
                    <td>${category.name}</td>
                    <td>
                        <button class="btn edit-category" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn delete-category" data-id="${category.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } else {
        categoriesHTML += `
            <tr>
                <td colspan="2">No categories found</td>
            </tr>
        `;
    }
    
    categoriesHTML += `
            </tbody>
        </table>
    `;

    if (pagination) {
        categoriesHTML += renderPagination(pagination, 'loadCategories');
    }
    
    document.getElementById('categories-list').innerHTML = categoriesHTML;
}

function loadAccountGroups(page = 1, search = '') {
    fetch(`${API_BASE}/account_groups.php?page=${page}&search=${search}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                accountGroups = data.data;
                // No direct rendering in index.html for account groups, but data is loaded for dropdowns
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error loading account groups:', error);
            showNotification('Error loading account groups: ' + error.message, 'error');
        });
}


function loadAccounts(page = 1, search = '') {
    fetch(`${API_BASE}/accounts.php?page=${page}&search=${search}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                accounts = data.data;
                renderAccountsList(data.pagination);
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error loading accounts:', error);
            showNotification('Error loading accounts: ' + error.message, 'error');
            renderAccountsList(); // Render with placeholder data if API fails
        });
}

function renderAccountsList(pagination) {
    let accountsHTML = `
        <table>
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Group</th>
                    <th>Type</th>
                    <th>Balance</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (accounts.length > 0) {
        accounts.forEach(account => {
            accountsHTML += `
                <tr>
                    <td>${account.code}</td>
                    <td>${account.name}</td>
                    <td>${account.group_name}</td>
                    <td>${account.type}</td>
                    <td>₨${parseFloat(account.balance).toFixed(2)}</td>
                    <td>
                        <button class="btn edit-account" data-id="${account.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn delete-account" data-id="${account.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } else {
        accountsHTML += `
            <tr>
                <td colspan="6">No accounts found</td>
            </tr>
        `;
    }
    
    accountsHTML += `
            </tbody>
        </table>
    `;

    if (pagination) {
        accountsHTML += renderPagination(pagination, 'loadAccounts');
    }
    
    document.getElementById('accounts-list').innerHTML = accountsHTML;
}

function loadItems(page = 1, search = '') {
    fetch(`${API_BASE}/items.php?page=${page}&search=${search}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                items = data.data;
                renderItemsList(data.pagination);
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error loading items:', error);
            showNotification('Error loading items: ' + error.message, 'error');
            renderItemsList(); // Render with placeholder data if API fails
        });
}

function renderItemsList(pagination) {
    let itemsHTML = `
        <table>
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Price</th>
                    <th>Tax Rate</th>
                    <th>Stock</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (items.length > 0) {
        items.forEach(item => {
            itemsHTML += `
                <tr>
                    <td>${item.code}</td>
                    <td>${item.name}</td>
                    <td>${getCategoryName(item.category_id)}</td>
                    <td>${item.unit}</td>
                    <td>₨${parseFloat(item.price).toFixed(2)}</td>
                    <td>${parseFloat(item.sales_tax_rate).toFixed(2)}%</td>
                    <td>${parseFloat(item.stock_quantity).toFixed(2)}</td>
                    <td>
                        <button class="btn edit-item" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn delete-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } else {
        itemsHTML += `
            <tr>
                <td colspan="8">No items found</td>
            </tr>
        `;
    }
    
    itemsHTML += `
            </tbody>
        </table>
    `;

    if (pagination) {
        itemsHTML += renderPagination(pagination, 'loadItems');
    }
    
    document.getElementById('items-list').innerHTML = itemsHTML;
}

function getCategoryName(categoryId) {
    const category = categories.find(c => c.id == categoryId);
    return category ? category.name : 'Unknown';
}

function loadTransactions(page = 1, search = '') {
    fetch(`${API_BASE}/transactions.php?page=${page}&search=${search}`)
        .then(response => response.json())
        .then(data => {
            // The API returns an array directly, not an object with 'success' and 'data'
            if (Array.isArray(data)) {
                transactions = data;
                renderTransactionsList(); // Pagination is not directly supported by this API endpoint
            } else {
                showNotification(data.message || 'Error loading transactions', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading transactions:', error);
            showNotification('Error loading transactions: ' + error.message, 'error');
            renderTransactionsList(); // Render with placeholder data if API fails
        });
}

function renderTransactionsList(pagination) { // pagination parameter is currently unused as API doesn't support it
    let salesHTML = `
        <table>
            <thead>
                <tr>
                    <th>Voucher No</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (transactions.length > 0) {
        transactions.filter(t => t.type === 'Sales').forEach(transaction => {
            salesHTML += `
                <tr>
                    <td>${transaction.voucher_no}</td>
                    <td>${transaction.date}</td>
                    <td>${transaction.party_name || 'N/A'}</td>
                    <td>${transaction.description}</td>
                    <td>₨${parseFloat(transaction.amount).toFixed(2)}</td>
                    <td>₨${parseFloat(transaction.tax_amount).toFixed(2)}</td>
                    <td>₨${parseFloat(transaction.total_amount).toFixed(2)}</td>
                    <td>
                        <button class="btn edit-transaction" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn delete-transaction" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
                        <button class="btn print-transaction" data-id="${transaction.id}"><i class="fas fa-print"></i></button>
                    </td>
                </tr>
            `;
        });
    } else {
        salesHTML += `
            <tr>
                <td colspan="8">No sales transactions found</td>
            </tr>
        `;
    }
    
    salesHTML += `
            </tbody>
        </table>
    `;
    
    document.getElementById('sales-list').innerHTML = salesHTML;
    
    // Render purchases
    let purchasesHTML = `
        <table>
            <thead>
                <tr>
                    <th>Voucher No</th>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (transactions.length > 0) {
        transactions.filter(t => t.type === 'Purchase').forEach(transaction => {
            purchasesHTML += `
                <tr>
                    <td>${transaction.voucher_no}</td>
                    <td>${transaction.date}</td>
                    <td>${transaction.party_name || 'N/A'}</td>
                    <td>${transaction.description}</td>
                    <td>₨${parseFloat(transaction.amount).toFixed(2)}</td>
                    <td>₨${parseFloat(transaction.tax_amount).toFixed(2)}</td>
                    <td>₨${parseFloat(transaction.total_amount).toFixed(2)}</td>
                    <td>
                        <button class="btn edit-transaction" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn delete-transaction" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
                        <button class="btn print-transaction" data-id="${transaction.id}"><i class="fas fa-print"></i></button>
                    </td>
                </tr>
            `;
        });
    } else {
        purchasesHTML += `
            <tr>
                <td colspan="8">No purchase transactions found</td>
            </tr>
        `;
    }
    
    purchasesHTML += `
            </tbody>
        </table>
    `;
    
    document.getElementById('purchases-list').innerHTML = purchasesHTML;
    
    // Render payments
    let paymentsHTML = `
        <table>
            <thead>
                <tr>
                    <th>Voucher No</th>
                    <th>Date</th>
                    <th>Party</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (transactions.length > 0) {
        transactions.filter(t => t.type === 'Payment').forEach(transaction => {
            paymentsHTML += `
                <tr>
                    <td>${transaction.voucher_no}</td>
                    <td>${transaction.date}</td>
                    <td>${transaction.party_name || 'N/A'}</td>
                    <td>${transaction.description}</td>
                    <td>₨${parseFloat(transaction.amount).toFixed(2)}</td>
                    <td>₨${parseFloat(transaction.tax_amount).toFixed(2)}</td>
                    <td>₨${parseFloat(transaction.total_amount).toFixed(2)}</td>
                    <td>
                        <button class="btn edit-transaction" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn delete-transaction" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
                        <button class="btn print-transaction" data-id="${transaction.id}"><i class="fas fa-print"></i></button>
                    </td>
                </tr>
            `;
        });
    } else {
        paymentsHTML += `
            <tr>
                <td colspan="8">No payment transactions found</td>
            </tr>
        `;
    }
    
    paymentsHTML += `
            </tbody>
        </table>
    `;
    
    document.getElementById('payments-list').innerHTML = paymentsHTML;
    
    // Render receipts
    let receiptsHTML = `
        <table>
            <thead>
                <tr>
                    <th>Voucher No</th>
                    <th>Date</th>
                    <th>Party</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (transactions.length > 0) {
        transactions.filter(t => t.type === 'Receipt').forEach(transaction => {
            receiptsHTML += `
                <tr>
                    <td>${transaction.voucher_no}</td>
                    <td>${transaction.date}</td>
                    <td>${transaction.party_name || 'N/A'}</td>
                    <td>${transaction.description}</td>
                    <td>₨${parseFloat(transaction.amount).toFixed(2)}</td>
                    <td>₨${parseFloat(transaction.tax_amount).toFixed(2)}</td>
                    <td>₨${parseFloat(transaction.total_amount).toFixed(2)}</td>
                    <td>
                        <button class="btn edit-transaction" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn delete-transaction" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
                        <button class="btn print-transaction" data-id="${transaction.id}"><i class="fas fa-print"></i></button>
                    </td>
                </tr>
            `;
        });
    } else {
        receiptsHTML += `
            <tr>
                <td colspan="8">No receipt transactions found</td>
            </tr>
        `;
    }
    
    receiptsHTML += `
            </tbody>
        </table>
    `;
    
    document.getElementById('receipts-list').innerHTML = receiptsHTML;
    
    // Render journal entries
    let journalHTML = `
        <table>
            <thead>
                <tr>
                    <th>Voucher No</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (transactions.length > 0) {
        transactions.filter(t => t.type === 'Journal').forEach(transaction => {
            journalHTML += `
                <tr>
                    <td>${transaction.voucher_no}</td>
                    <td>${transaction.date}</td>
                    <td>${transaction.description}</td>
                    <td>₨${parseFloat(transaction.amount).toFixed(2)}</td>
                    <td>₨${parseFloat(transaction.tax_amount).toFixed(2)}</td>
                    <td>₨${parseFloat(transaction.total_amount).toFixed(2)}</td>
                    <td>
                        <button class="btn edit-transaction" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn delete-transaction" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
                        <button class="btn print-transaction" data-id="${transaction.id}"><i class="fas fa-print"></i></button>
                    </td>
                </tr>
            `;
        });
    } else {
        journalHTML += `
            <tr>
                <td colspan="7">No journal transactions found</td>
            </tr>
        `;
    }
    
    journalHTML += `
            </tbody>
        </table>
    `;

    // Pagination is not directly supported by the current transactions API endpoint
    // if (pagination) {
    //     salesHTML += renderPagination(pagination, 'loadTransactions');
    //     purchasesHTML += renderPagination(pagination, 'loadTransactions');
    //     paymentsHTML += renderPagination(pagination, 'loadTransactions');
    //     receiptsHTML += renderPagination(pagination, 'loadTransactions');
    //     journalHTML += renderPagination(pagination, 'loadTransactions');
    // }
    
    document.getElementById('journal-list').innerHTML = journalHTML;
}

function loadParties(page = 1, search = '') {
    fetch(`${API_BASE}/parties.php?page=${page}&search=${search}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                parties = data.data;
                // Render customers and suppliers in their respective tabs
                renderPartiesList(data.pagination);
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error loading parties:', error);
            showNotification('Error loading parties: ' + error.message, 'error');
            renderPartiesList(); // Render with placeholder data if API fails
        });
}

function renderPartiesList(pagination) {
    let customersHTML = `
        <table>
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>NTN</th>
                    <th>STRN</th>
                    <th>Balance</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (parties.length > 0) {
        parties.filter(p => p.party_type === 'Customer').forEach(party => {
            customersHTML += `
                <tr>
                    <td>${party.code}</td>
                    <td>${party.name}</td>
                    <td>${party.ntn || ''}</td>
                    <td>${party.strn || ''}</td>
                    <td>₨${parseFloat(party.balance).toFixed(2)}</td>
                    <td>
                        <button class="btn edit-party" data-id="${party.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn delete-party" data-id="${party.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } else {
        customersHTML += `
            <tr>
                <td colspan="6">No customers found</td>
            </tr>
        `;
    }
    
    customersHTML += `
            </tbody>
        </table>
    `;

    // Only render pagination once for the entire parties section if needed, or for each tab
    // For simplicity, we'll assume pagination is handled by the individual forms if they are linked
    // if (pagination) {
    //     customersHTML += renderPagination(pagination, 'loadParties');
    // }
    
    document.getElementById('customers-list').innerHTML = customersHTML;
    
    // Similar for suppliers
    let suppliersHTML = `
        <table>
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>NTN</th>
                    <th>STRN</th>
                    <th>Balance</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (parties.length > 0) {
        parties.filter(p => p.party_type === 'Supplier').forEach(party => {
            suppliersHTML += `
                <tr>
                    <td>${party.code}</td>
                    <td>${party.name}</td>
                    <td>${party.ntn || ''}</td>
                    <td>${party.strn || ''}</td>
                    <td>₨${parseFloat(party.balance).toFixed(2)}</td>
                    <td>
                        <button class="btn edit-party" data-id="${party.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn delete-party" data-id="${party.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } else {
        suppliersHTML += `
            <tr>
                <td colspan="6">No suppliers found</td>
            </tr>
        `;
    }

    suppliersHTML += `
            </tbody>
        </table>
    `;

    // if (pagination) {
    //     suppliersHTML += renderPagination(pagination, 'loadParties');
    // }

    document.getElementById('suppliers-list').innerHTML = suppliersHTML;
}

function renderPagination(pagination, callbackFunction) {
    console.log("Rendering pagination");
    
    const { page, totalPages } = pagination;
    let paginationHTML = '<div class="pagination">';
    
    // Previous button
    if (page > 1) {
        paginationHTML += `<button onclick="${callbackFunction}(${page - 1})">&laquo; Prev</button>`;
    }
    
    // Page numbers
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        if (i === page) {
            paginationHTML += `<button class="active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="${callbackFunction}(${i})">${i}</button>`;
        }
    }
    
    // Next button
    if (page < totalPages) {
        paginationHTML += `<button onclick="${callbackFunction}(${page + 1})">Next &raquo;</button>`;
    }
    
    paginationHTML += '</div>';
    return paginationHTML;
}

// CRUD Operations for Accounts
// createAccount function removed as creation is handled by forms/chart_of_accounts.html
function editAccount(accountId) {
    const account = accounts.find(a => a.id == accountId);
    if (account) {
        // For simplicity, we'll reuse the add form and populate it with data
        window.location.href = `forms/chart_of_accounts.html?id=${accountId}`;
    }
}

function deleteAccount(accountId) {
    if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
        fetch(`${API_BASE}/accounts.php?id=${accountId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                loadAccounts(); // Refresh the accounts list
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting account:', error);
            showNotification('Error deleting account: ' + error.message, 'error');
        });
    }
}

// CRUD Operations for Categories
// createCategory function removed as creation is handled by forms/categories.html
function editCategory(categoryId) {
    window.location.href = `forms/categories.html?id=${categoryId}`;
}

function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
        fetch(`${API_BASE}/categories.php?id=${categoryId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                loadCategories(); // Refresh the categories list
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting category:', error);
            showNotification('Error deleting category: ' + error.message, 'error');
        });
    }
}

// CRUD Operations for Items
// createItem function removed as creation is handled by forms/items.html
function editItem(itemId) {
    const item = items.find(i => i.id == itemId);
    if (item) {
        window.location.href = `forms/items.html?id=${itemId}`;
    }
}

function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        fetch(`${API_BASE}/items.php?id=${itemId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                loadItems(); // Refresh the items list
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting item:', error);
            showNotification('Error deleting item: ' + error.message, 'error');
        });
    }
}

// CRUD Operations for Parties
// createParty function removed as creation is handled by forms/parties.html
function editParty(partyId) {
    const party = parties.find(p => p.id == partyId);
    if (party) {
        window.location.href = `forms/parties.html?id=${partyId}`;
    }
}

function deleteParty(partyId) {
    if (confirm('Are you sure you want to delete this party? This action cannot be undone.')) {
        fetch(`${API_BASE}/parties.php?id=${partyId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                loadParties(); // Refresh the parties list
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting party:', error);
            showNotification('Error deleting party: ' + error.message, 'error');
        });
    }
}

// CRUD Operations for Transactions
// createTransaction function removed as creation is handled by voucher forms
function editTransaction(transactionId) {
    const transaction = transactions.find(t => t.id == transactionId);
    if (transaction) {
        window.location.href = `forms/${transaction.type.toLowerCase()}_voucher.html?id=${transactionId}`;
    }
}

function deleteTransaction(transactionId) {
    if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
        fetch(`${API_BASE}/transactions.php?id=${transactionId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                loadTransactions(); // Refresh the transactions list
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting transaction:', error);
            showNotification('Error deleting transaction: ' + error.message, 'error');
        });
    }
}

function printTransaction(transactionId) {
    // In a real application, this would generate and open a printable version of the transaction
    showNotification(`Print transaction with ID: ${transactionId}. In a real application, this would open a print dialog.`, 'info');
}

// Report Functions
function setupReportFilters() {
    const reportType = document.getElementById('report-type');
    const accountFilter = document.getElementById('account-filter');
    const partyFilter = document.getElementById('party-filter');
    
    if (reportType) {
        reportType.addEventListener('change', function() {
            const selectedType = this.value;
            
            // Hide all filters first
            if (accountFilter) accountFilter.style.display = 'none';
            if (partyFilter) partyFilter.style.display = 'none';
            
            // Show specific filters based on report type
            if (selectedType === 'ledger') {
                if (accountFilter) accountFilter.style.display = 'block';
                loadAccountOptions();
            } else if (selectedType === 'customer_ledger') {
                if (partyFilter) partyFilter.style.display = 'block';
                loadPartyOptions('Customer');
            }
        });
    }
    
    const generateReportBtn = document.getElementById('generate-report');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }
    
    const generateInvReportBtn = document.getElementById('generate-inv-report');
    if (generateInvReportBtn) {
        generateInvReportBtn.addEventListener('click', generateInventoryReport);
    }
    
    const generateFbrReportBtn = document.getElementById('generate-fbr-report');
    if (generateFbrReportBtn) {
        generateFbrReportBtn.addEventListener('click', generateFbrReport);
    }
}

function loadAccountOptions() {
    if (accounts.length > 0) {
        let optionsHTML = '<option value="">Select Account</option>';
        accounts.forEach(account => {
            optionsHTML += `<option value="${account.id}">${account.name} (${account.code})</option>`;
        });
        document.getElementById('account-select').innerHTML = optionsHTML;
    } else {
        document.getElementById('account-select').innerHTML = '<option value="">No accounts found</option>';
    }
}

function loadPartyOptions(partyType) {
    if (parties.length > 0) {
        let optionsHTML = '<option value="">Select Party</option>';
        parties.filter(p => p.party_type === partyType).forEach(party => {
            optionsHTML += `<option value="${party.id}">${party.name}</option>`;
        });
        document.getElementById('party-select').innerHTML = optionsHTML;
    } else {
        document.getElementById('party-select').innerHTML = '<option value="">No parties found</option>';
    }
}

function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const reportOutput = document.getElementById('report-output');
    
    // Enable print and export buttons
    const printBtn = document.getElementById('print-report');
    const exportPdfBtn = document.getElementById('export-pdf');
    
    if (printBtn) printBtn.disabled = false;
    if (exportPdfBtn) exportPdfBtn.disabled = false;
    
    reportOutput.innerHTML = '<p>Generating report...</p>';

    fetch(`${API_BASE}/reports.php?type=${reportType}`)
        .then(response => response.json())
        .then(data => {
            // The reports API returns data directly, not wrapped in 'success'
            if (data) { // Assuming any non-empty data means success for reports
                // For simplicity, just stringify the data. A real implementation would format it.
                reportOutput.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            } else {
                reportOutput.innerHTML = `<p class="error">${data.message || 'No data found for this report.'}</p>`;
            }
        })
        .catch(error => {
            console.error('Error generating report:', error);
            reportOutput.innerHTML = `<p class="error">Error generating report: ${error.message}</p>`;
        });
}

function generateInventoryReport() {
    const reportType = document.getElementById('inv-report-type').value;
    const reportOutput = document.getElementById('inv-report-output');
    
    // Enable print and export buttons
    const printBtn = document.getElementById('print-inv-report');
    const exportPdfBtn = document.getElementById('export-inv-pdf');
    
    if (printBtn) printBtn.disabled = false;
    if (exportPdfBtn) exportPdfBtn.disabled = false;
    
    reportOutput.innerHTML = '<p>Generating report...</p>';

    fetch(`${API_BASE}/reports.php?type=${reportType}`) // Removed 'inventory_' prefix as per API
        .then(response => response.json())
        .then(data => {
            if (data) {
                reportOutput.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            } else {
                reportOutput.innerHTML = `<p class="error">${data.message || 'No data found for this report.'}</p>`;
            }
        })
        .catch(error => {
            console.error('Error generating inventory report:', error);
            reportOutput.innerHTML = `<p class="error">Error generating inventory report: ${error.message}</p>`;
        });
}

function generateFbrReport() {
    const reportType = document.getElementById('fbr-report-type').value;
    const reportOutput = document.getElementById('fbr-report-output');
    const fromDate = document.getElementById('from-date').value;
    const toDate = document.getElementById('to-date').value;
    
    // Enable print and export buttons
    const printBtn = document.getElementById('print-fbr-report');
    const exportPdfBtn = document.getElementById('export-fbr-pdf');
    const exportCsvBtn = document.getElementById('export-fbr-csv');
    
    if (printBtn) printBtn.disabled = false;
    if (exportPdfBtn) exportPdfBtn.disabled = false;
    if (exportCsvBtn) exportCsvBtn.disabled = false;
    
    reportOutput.innerHTML = '<p>Generating report...</p>';

    let url = `${API_BASE}/reports.php?type=${reportType}`;
    if (fromDate) url += `&from_date=${fromDate}`;
    if (toDate) url += `&to_date=${toDate}`;

    fetch(url) // Removed 'fbr_' prefix as per API
        .then(response => response.json())
        .then(data => {
            if (data) {
                reportOutput.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            } else {
                reportOutput.innerHTML = `<p class="error">${data.message || 'No data found for this report.'}</p>`;
            }
        })
        .catch(error => {
            console.error('Error generating FBR report:', error);
            reportOutput.innerHTML = `<p class="error">Error generating FBR report: ${error.message}</p>`;
        });
}

// Export Functions
function setupExportFunctionality() {
    // Set up event listeners for export buttons
    const exportPdfBtn = document.getElementById('export-pdf');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function() {
            exportReport('pdf', 'general');
        });
    }
    
    const exportInvPdfBtn = document.getElementById('export-inv-pdf');
    if (exportInvPdfBtn) {
        exportInvPdfBtn.addEventListener('click', function() {
            exportReport('pdf', 'inventory');
        });
    }
    
    const exportFbrPdfBtn = document.getElementById('export-fbr-pdf');
    if (exportFbrPdfBtn) {
        exportFbrPdfBtn.addEventListener('click', function() {
            exportReport('pdf', 'fbr');
        });
    }
    
    const exportFbrCsvBtn = document.getElementById('export-fbr-csv');
    if (exportFbrCsvBtn) {
        exportFbrCsvBtn.addEventListener('click', function() {
            exportReport('csv', 'fbr');
        });
    }
}

function exportReport(format, reportGroup = 'general') {
    let reportType;
    let reportData;
    let filename = 'report';

    if (reportGroup === 'general') {
        reportType = document.getElementById('report-type').value;
        // For simplicity, we'll fetch data again. In a real app, you might store the last generated report data.
        fetch(`${API_BASE}/reports.php?type=${reportType}`)
            .then(response => response.json())
            .then(data => {
                reportData = data;
                performExport(format, reportType, reportData, filename);
            })
            .catch(error => showNotification('Error fetching report data for export: ' + error.message, 'error'));
    } else if (reportGroup === 'inventory') {
        reportType = document.getElementById('inv-report-type').value;
        fetch(`${API_BASE}/reports.php?type=${reportType}`)
            .then(response => response.json())
            .then(data => {
                reportData = data;
                performExport(format, reportType, reportData, `inventory_${reportType}`);
            })
            .catch(error => showNotification('Error fetching inventory report data for export: ' + error.message, 'error'));
    } else if (reportGroup === 'fbr') {
        reportType = document.getElementById('fbr-report-type').value;
        const fromDate = document.getElementById('from-date').value;
        const toDate = document.getElementById('to-date').value;
        let url = `${API_BASE}/reports.php?type=${reportType}`;
        if (fromDate) url += `&from_date=${fromDate}`;
        if (toDate) url += `&to_date=${toDate}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                reportData = data;
                performExport(format, reportType, reportData, `fbr_${reportType}`);
            })
            .catch(error => showNotification('Error fetching FBR report data for export: ' + error.message, 'error'));
    }
}

function performExport(format, reportType, reportData, filename) {
    if (!reportData || reportData.length === 0) {
        showNotification('No data to export.', 'info');
        return;
    }

    if (format === 'csv') {
        // Client-side CSV generation (as per AI_RULES.md, backend handles CSV, but for client-side export, this is a common approach)
        // However, the AI_RULES.md explicitly states "Server-side CSV generation is implemented in PHP."
        // So, we should call the export.php endpoint with POST.
        fetch(`${API_BASE}/export.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'csv', data: reportData, filename: filename })
        })
        .then(response => {
            if (response.ok) {
                // If the server directly sends the file, the browser will handle it.
                // If it sends a JSON response, we need to handle that.
                // Assuming server sends file directly for CSV.
                showNotification('CSV export initiated.', 'success');
                // Trigger download if the server sends a blob or similar
                return response.blob();
            } else {
                return response.json().then(err => { throw new Error(err.message || 'Server error during CSV export'); });
            }
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${filename}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => showNotification('Error during CSV export: ' + error.message, 'error'));

    } else if (format === 'pdf') {
        // Client-side PDF generation using jsPDF (as per AI_RULES.md)
        // This requires jsPDF library to be included in the HTML.
        // For now, we'll just show a notification and log.
        showNotification('PDF generation is a planned feature using jsPDF.', 'info');
        console.log('PDF Export Data:', reportData);
    }
}


// Form Submission Setup
function setupFormSubmissions() {
    // Add event listeners for form submissions
    const addAccountBtn = document.getElementById('add-account');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', function() {
            window.location.href = 'forms/chart_of_accounts.html';
        });
    }

    const addAccountGroupBtn = document.getElementById('add-account-group');
    if (addAccountGroupBtn) {
        addAccountGroupBtn.addEventListener('click', function() {
            window.location.href = 'forms/account_groups.html';
        });
    }
    
    const addItemBtn = document.getElementById('add-item');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', function() {
            window.location.href = 'forms/items.html';
        });
    }

    const manageCategoriesBtn = document.getElementById('manage-categories');
    if (manageCategoriesBtn) {
        manageCategoriesBtn.addEventListener('click', function() {
            window.location.href = 'forms/categories.html';
        });
    }
    
    const addCategoryBtn = document.getElementById('add-category');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', function() {
            window.location.href = 'forms/categories.html';
        });
    }
    
    const addCustomerBtn = document.getElementById('add-customer');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', function() {
            window.location.href = 'forms/parties.html?type=Customer';
        });
    }
    
    const addSupplierBtn = document.getElementById('add-supplier');
    if (addSupplierBtn) {
        addSupplierBtn.addEventListener('click', function() {
            window.location.href = 'forms/parties.html?type=Supplier';
        });
    }
    
    const addSaleBtn = document.getElementById('add-sale');
    if (addSaleBtn) {
        addSaleBtn.addEventListener('click', function() {
            window.location.href = 'forms/sales_voucher.html';
        });
    }
    
    const addPurchaseBtn = document.getElementById('add-purchase');
    if (addPurchaseBtn) {
        addPurchaseBtn.addEventListener('click', function() {
            window.location.href = 'forms/purchase_voucher.html';
        });
    }
    
    const addPaymentBtn = document.getElementById('add-payment');
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', function() {
            window.location.href = 'forms/payment_voucher.html';
        });
    }
    
    const addReceiptBtn = document.getElementById('add-receipt');
    if (addReceiptBtn) {
        addReceiptBtn.addEventListener('click', function() {
            window.location.href = 'forms/receipt_voucher.html';
        });
    }
    
    const addJournalBtn = document.getElementById('add-journal');
    if (addJournalBtn) {
        addJournalBtn.addEventListener('click', function() {
            window.location.href = 'forms/journal_voucher.html';
        });
    }
    
    // Print and export functionality
    const printReportBtn = document.getElementById('print-report');
    if (printReportBtn) {
        printReportBtn.addEventListener('click', function() {
            window.print();
        });
    }
    
    const printInvReportBtn = document.getElementById('print-inv-report');
    if (printInvReportBtn) {
        printInvReportBtn.addEventListener('click', function() {
            window.print();
        });
    }
    
    const printFbrReportBtn = document.getElementById('print-fbr-report');
    if (printFbrReportBtn) {
        printFbrReportBtn.addEventListener('click', function() {
            window.print();
        });
    }
}

// Setup form event listeners
function setupFormEventListeners() {
    // Add event listeners for edit and delete buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.edit-account')) {
            const accountId = e.target.closest('.edit-account').getAttribute('data-id');
            editAccount(accountId);
        }
        
        if (e.target.closest('.delete-account')) {
            const accountId = e.target.closest('.delete-account').getAttribute('data-id');
            deleteAccount(accountId);
        }

        if (e.target.closest('.edit-category')) {
            const categoryId = e.target.closest('.edit-category').getAttribute('data-id');
            editCategory(categoryId);
        }
        
        if (e.target.closest('.delete-category')) {
            const categoryId = e.target.closest('.delete-category').getAttribute('data-id');
            deleteCategory(categoryId);
        }
        
        if (e.target.closest('.edit-item')) {
            const itemId = e.target.closest('.edit-item').getAttribute('data-id');
            editItem(itemId);
        }
        
        if (e.target.closest('.delete-item')) {
            const itemId = e.target.closest('.delete-item').getAttribute('data-id');
            deleteItem(itemId);
        }
        
        if (e.target.closest('.edit-party')) {
            const partyId = e.target.closest('.edit-party').getAttribute('data-id');
            editParty(partyId);
        }
        
        if (e.target.closest('.delete-party')) {
            const partyId = e.target.closest('.delete-party').getAttribute('data-id');
            deleteParty(partyId);
        }

        if (e.target.closest('.edit-transaction')) {
            const transactionId = e.target.closest('.edit-transaction').getAttribute('data-id');
            editTransaction(transactionId);
        }

        if (e.target.closest('.delete-transaction')) {
            const transactionId = e.target.closest('.delete-transaction').getAttribute('data-id');
            deleteTransaction(transactionId);
        }

        if (e.target.closest('.print-transaction')) {
            const transactionId = e.target.closest('.print-transaction').getAttribute('data-id');
            printTransaction(transactionId);
        }
    });
}