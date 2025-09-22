<?php
include_once 'header.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            getTransaction($_GET['id']);
        } else if(isset($_GET['type'])) {
            getTransactionsByType($_GET['type']);
        } else {
            getTransactions();
        }
        break;
    case 'POST':
        createTransaction();
        break;
    case 'PUT':
        updateTransaction();
        break;
    case 'DELETE':
        deleteTransaction();
        break;
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

function getTransactions() {
    global $conn;
    
    $query = "SELECT t.*, p.name as party_name FROM transactions t LEFT JOIN parties p ON t.party_id = p.id ORDER BY t.date DESC";
    $result = $conn->query($query);
    
    $transactions = array();
    while($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
    
    echo json_encode($transactions);
}

function getTransactionsByType($type) {
    global $conn;
    
    $query = "SELECT t.*, p.name as party_name FROM transactions t LEFT JOIN parties p ON t.party_id = p.id WHERE t.type = ? ORDER BY t.date DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $type);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $transactions = array();
    while($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
    
    echo json_encode($transactions);
}

function getTransaction($id) {
    global $conn;
    
    // Get transaction
    $query = "SELECT t.*, p.name as party_name, p.ntn as party_ntn, p.strn as party_strn FROM transactions t LEFT JOIN parties p ON t.party_id = p.id WHERE t.id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if($row = $result->fetch_assoc()) {
        $transaction = $row;
        
        // Get transaction details
        $query = "SELECT td.*, a.name as account_name, i.name as item_name 
                  FROM transaction_details td 
                  LEFT JOIN accounts a ON td.account_id = a.id 
                  LEFT JOIN items i ON td.item_id = i.id 
                  WHERE td.transaction_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $details = array();
        while($row = $result->fetch_assoc()) {
            $details[] = $row;
        }
        
        $transaction['details'] = $details;
        echo json_encode($transaction);
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Transaction not found"));
    }
}

function createTransaction() {
    global $conn;
    
    $data = json_decode(file_get_contents("php://input"));
    
    $conn->begin_transaction();
    
    try {
        // Insert transaction
        $voucher_no = $data->voucher_no;
        $date = $data->date;
        $type = $data->type;
        $description = $data->description;
        $amount = $data->amount;
        $tax_amount = $data->tax_amount ?? 0;
        $total_amount = $data->total_amount ?? $amount;
        $calculated_total_amount = 0;
        $calculated_taxable_amount = 0;
        
        $query = "INSERT INTO transactions (voucher_no, date, type, description, amount, tax_amount, total_amount, party_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ssssdddi", $voucher_no, $date, $type, $description, $amount, $tax_amount, $calculated_total_amount, $party_id);
        if(!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        $transaction_id = $conn->insert_id;
        
        // Insert transaction details
        $total_tax = 0;
        foreach($data->details as $detail) {
            $account_id = $detail->account_id;
            $item_id = $detail->item_id ?? null;
            $quantity = $detail->quantity ?? null;
            $rate = $detail->rate ?? null;
            $amount_detail = $detail->amount;
            $tax_rate = $detail->tax_rate ?? 0;
            $tax_amount_detail = $detail->tax_amount ?? 0;
            $total_amount_detail = $detail->total_amount ?? $amount_detail;
            $type_detail = $detail->type;
            
            $query = "INSERT INTO transaction_details (transaction_id, account_id, item_id, quantity, rate, amount, tax_rate, tax_amount, total_amount, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("iiidddddds", $transaction_id, $account_id, $item_id, $quantity, $rate, $amount_detail, $tax_rate, $tax_amount_detail, $total_amount_detail, $type_detail);
            if(!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
            
            // Update account balances for all transaction types
            if($type_detail == 'Debit') {
                $query = "UPDATE accounts SET balance = balance + ? WHERE id = ?";
            } else {
                $query = "UPDATE accounts SET balance = balance - ? WHERE id = ?";
            }
            $stmt = $conn->prepare($query);
            $stmt->bind_param("di", $total_amount_detail, $account_id);
            if(!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
            
            // Update item stock for sales and purchases
            if($item_id && ($type == 'Sales' || $type == 'Purchase')) {
                if($type == 'Sales') {
                    $query = "UPDATE items SET stock_quantity = stock_quantity - ? WHERE id = ?";
                } else {
                    $query = "UPDATE items SET stock_quantity = stock_quantity + ? WHERE id = ?";
                }
                $stmt = $conn->prepare($query);
                $stmt->bind_param("di", $quantity, $item_id);
                if(!$stmt->execute()) {
                    throw new Exception($stmt->error);
                }
            }
            
            // Add to tax amount
            $total_tax += $tax_amount_detail;
            $calculated_total_amount += $total_amount_detail;
        }

        // Update the total_amount in the transactions table after calculating all details
        $query = "UPDATE transactions SET total_amount = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("di", $calculated_total_amount, $transaction_id);
        if(!$stmt->execute()) {
            throw new Exception($stmt->error);
        }

        // Update party balances for Payment, Receipt, Sales and Purchase transactions
        if($party_id) {
            if($type == 'Sales') {
                $query = "UPDATE parties SET balance = balance + ? WHERE id = ?";
                $stmt = $conn->prepare($query);
                $stmt->bind_param("di", $total_amount, $party_id);
                if(!$stmt->execute()) {
                    throw new Exception($stmt->error);
                }
            } else if($type == 'Purchase') {
                $query = "UPDATE parties SET balance = balance - ? WHERE id = ?";
                $stmt = $conn->prepare($query);
                $stmt->bind_param("di", $total_amount, $party_id);
                if(!$stmt->execute()) {
                    throw new Exception($stmt->error);
                }
            } else if($type == 'Receipt') {
                $query = "UPDATE parties SET balance = balance - ? WHERE id = ?";
                $stmt = $conn->prepare($query);
                $stmt->bind_param("di", $total_amount, $party_id);
                if(!$stmt->execute()) {
                    throw new Exception($stmt->error);
                }
            } else if($type == 'Payment') {
                $query = "UPDATE parties SET balance = balance + ? WHERE id = ?";
                $stmt = $conn->prepare($query);
                $stmt->bind_param("di", $total_amount, $party_id);
                if(!$stmt->execute()) {
                    throw new Exception($stmt->error);
                }
            }
        }
        
        // Insert into sales tax register for FBR compliance (only for Sales and Purchases)
        if($total_tax > 0 && ($type == 'Sales' || $type == 'Purchase') && $party_id) {
            // Get party details
            $query = "SELECT ntn, strn FROM parties WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $party_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $party = $result->fetch_assoc();
            
                                    $query = "INSERT INTO sales_tax_register (transaction_id, invoice_date, invoice_number, party_id, party_ntn, party_strn, taxable_amount, tax_rate, tax_amount, total_amount, invoice_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            $tax_rate = ($calculated_taxable_amount > 0) ? ($total_tax / $calculated_taxable_amount) * 100 : 0;
            $stmt->bind_param("ississsddds", $transaction_id, $date, $voucher_no, $party_id, $party['ntn'], $party['strn'], $calculated_taxable_amount, $tax_rate, $total_tax, $calculated_total_amount, $type);
            if(!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
        }
        }
        
        $conn->commit();
        http_response_code(201);
        echo json_encode(array("message" => "Transaction created successfully", "id" => $transaction_id));
    } catch(Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(array("message" => "Unable to create transaction: " . $e->getMessage()));
    }
}

function updateTransaction() {
    global $conn;
    
    $data = json_decode(file_get_contents("php://input"));
    $id = $data->id;

    $conn->begin_transaction();

    try {
        // First, delete the old transaction to reverse all balances
        deleteTransactionLogic($id, $conn);

        // Now, create the new transaction
        createTransactionLogic($data, $conn);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("message" => "Transaction updated successfully"));

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(array("message" => "Unable to update transaction: " . $e->getMessage()));
    }
}

function deleteTransaction() {
    global $conn;
    
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(array("message" => "Transaction ID is required"));
        return;
    }
    
    $conn->begin_transaction();
    
    try {
        deleteTransactionLogic($id, $conn);
        $conn->commit();
        echo json_encode(array("message" => "Transaction deleted successfully"));
    } catch(Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(array("message" => "Unable to delete transaction: " . $e->getMessage()));
    }
}

function createTransactionLogic($data, $conn) {
    // This function contains the logic to create a transaction, extracted from the original createTransaction function
    // This allows it to be reused by updateTransaction
    // Note: This function assumes it's being called within a transaction ($conn->begin_transaction())

    // Insert transaction
    $voucher_no = $data->voucher_no;
    $date = $data->date;
    $type = $data->type;
    $description = $data->description;
    $amount = $data->amount;
    $tax_amount = $data->tax_amount ?? 0;
    $party_id = $data->party_id ?? null;
    $calculated_total_amount = 0;
    
    $query = "INSERT INTO transactions (voucher_no, date, type, description, amount, tax_amount, total_amount, party_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ssssdddi", $voucher_no, $date, $type, $description, $amount, $tax_amount, $calculated_total_amount, $party_id);
    if(!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    $transaction_id = $conn->insert_id;
    
    // Insert transaction details
    $total_tax = 0;
    foreach($data->details as $detail) {
        $account_id = $detail->account_id;
        $item_id = $detail->item_id ?? null;
        $quantity = $detail->quantity ?? null;
        $rate = $detail->rate ?? null;
        $amount_detail = $detail->amount;
        $tax_rate = $detail->tax_rate ?? 0;
        $tax_amount_detail = $detail->tax_amount ?? 0;
        $total_amount_detail = $detail->total_amount ?? $amount_detail;
        $type_detail = $detail->type;
        
        $query = "INSERT INTO transaction_details (transaction_id, account_id, item_id, quantity, rate, amount, tax_rate, tax_amount, total_amount, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("iiidddddds", $transaction_id, $account_id, $item_id, $quantity, $rate, $amount_detail, $tax_rate, $tax_amount_detail, $total_amount_detail, $type_detail);
        if(!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        
        // Update account balances for all transaction types
        if($type_detail == 'Debit') {
            $query = "UPDATE accounts SET balance = balance + ? WHERE id = ?";
        } else {
            $query = "UPDATE accounts SET balance = balance - ? WHERE id = ?";
        }
        $stmt = $conn->prepare($query);
        $stmt->bind_param("di", $total_amount_detail, $account_id);
        if(!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        
        // Update item stock for sales and purchases
        if($item_id && ($type == 'Sales' || $type == 'Purchase')) {
            if($type == 'Sales') {
                $query = "UPDATE items SET stock_quantity = stock_quantity - ? WHERE id = ?";
            } else {
                $query = "UPDATE items SET stock_quantity = stock_quantity + ? WHERE id = ?";
            }
            $stmt = $conn->prepare($query);
            $stmt->bind_param("di", $quantity, $item_id);
            if(!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
        }
        
        // Add to tax amount
        $total_tax += $tax_amount_detail;
        $calculated_total_amount += $total_amount_detail;
    }

    // Update the total_amount in the transactions table after calculating all details
    $query = "UPDATE transactions SET total_amount = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("di", $calculated_total_amount, $transaction_id);
    if(!$stmt->execute()) {
        throw new Exception($stmt->error);
    }

    // Update party balances for Payment, Receipt, Sales and Purchase transactions
    if($party_id) {
        if($type == 'Sales') {
            $query = "UPDATE parties SET balance = balance + ? WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("di", $total_amount, $party_id);
            if(!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
        } else if($type == 'Purchase') {
            $query = "UPDATE parties SET balance = balance - ? WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("di", $total_amount, $party_id);
            if(!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
        } else if($type == 'Receipt') {
            $query = "UPDATE parties SET balance = balance - ? WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("di", $total_amount, $party_id);
            if(!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
        } else if($type == 'Payment') {
            $query = "UPDATE parties SET balance = balance + ? WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("di", $total_amount, $party_id);
            if(!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
        }
    }
    
    // Insert into sales tax register for FBR compliance (only for Sales and Purchases)
    if($total_tax > 0 && ($type == 'Sales' || $type == 'Purchase') && $party_id) {
        // Get party details
        $query = "SELECT ntn, strn FROM parties WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $party_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $party = $result->fetch_assoc();
        
        $query = "INSERT INTO sales_tax_register (transaction_id, invoice_date, invoice_number, party_id, party_ntn, party_strn, taxable_amount, tax_rate, tax_amount, total_amount, invoice_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $tax_rate = ($amount > 0) ? ($total_tax / $amount) * 100 : 0;
        $stmt->bind_param("ississsddds", $transaction_id, $date, $voucher_no, $party_id, $party['ntn'], $party['strn'], $amount, $tax_rate, $total_tax, $total_amount, $type);
        if(!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
    }
    return $transaction_id;
}

function deleteTransactionLogic($id, $conn) {
    // This function contains the logic to delete a transaction, extracted from the original deleteTransaction function
    // This allows it to be reused by updateTransaction
    // Note: This function assumes it's being called within a transaction ($conn->begin_transaction())

    // Get transaction details before deleting for reversing account balances
    $query = "SELECT * FROM transactions WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows == 0) {
        throw new Exception("Transaction not found");
    }
    
    $transaction = $result->fetch_assoc();
    
    // Get transaction details
    $query = "SELECT * FROM transaction_details WHERE transaction_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $details = array();
    while($row = $result->fetch_assoc()) {
        $details[] = $row;
    }
    
    // Reverse account balances
    foreach($details as $detail) {
        $account_id = $detail['account_id'];
        $amount_detail = $detail['total_amount'];
        $type_detail = $detail['type'];
        
        if($type_detail == 'Debit') {
            $query = "UPDATE accounts SET balance = balance - ? WHERE id = ?";
        } else {
            $query = "UPDATE accounts SET balance = balance + ? WHERE id = ?";
        }
        $stmt = $conn->prepare($query);
        $stmt->bind_param("di", $amount_detail, $account_id);
        if(!$stmt->execute()) {
            throw new Exception($stmt->error);
        }

        // Reverse item stock for sales and purchases
        $item_id = $detail['item_id'];
        $quantity = $detail['quantity'];
        if($item_id && ($transaction['type'] == 'Sales' || $transaction['type'] == 'Purchase')) {
            if($transaction['type'] == 'Sales') {
                $query = "UPDATE items SET stock_quantity = stock_quantity + ? WHERE id = ?";
            } else {
                $query = "UPDATE items SET stock_quantity = stock_quantity - ? WHERE id = ?";
            }
            $stmt = $conn->prepare($query);
            $stmt->bind_param("di", $quantity, $item_id);
            if(!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
        }
    }
    
    // Reverse party balances if applicable
    $party_id = $transaction['party_id'];
    if($party_id) {
        $total_amount = $transaction['total_amount'];
        $type = $transaction['type'];
        
        if($type == 'Sales') {
            $query = "UPDATE parties SET balance = balance - ? WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("di", $total_amount, $party_id);
            if(!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
        } else if($type == 'Purchase') {
            $query = "UPDATE parties SET balance = balance + ? WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("di", $total_amount, $party_id);
            if(!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
        } else if($type == 'Receipt') {
            $query = "UPDATE parties SET balance = balance + ? WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("di", $total_amount, $party_id);
            if(!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
        } else if($type == 'Payment') {
            $query = "UPDATE parties SET balance = balance - ? WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("di", $total_amount, $party_id);
            if(!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
        }
    }
    
    // Delete from sales tax register if applicable
    if($transaction['type'] == 'Sales' || $transaction['type'] == 'Purchase') {
        $query = "DELETE FROM sales_tax_register WHERE transaction_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        if(!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
    }
    
    // Delete transaction details
    $query = "DELETE FROM transaction_details WHERE transaction_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);
    if(!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    
    // Delete transaction
    $query = "DELETE FROM transactions WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);
    if(!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
}
?>