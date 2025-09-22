<?php
include_once 'header.php';

// Set headers for JSON response
header('Content-Type: application/json');

// Handle CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

// Pre-flight request handling
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Handle different request methods
switch($method) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] == 'ledger') {
            handleGetLedger($conn);
        } else {
            handleGet($conn);
        }
        break;
    case 'POST':
        handlePost($conn);
        break;
    case 'PUT':
        handlePut($conn);
        break;
    case 'DELETE':
        handleDelete($conn);
        break;
    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
        break;
}

function handleGet($conn) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if ($id) {
        $stmt = $conn->prepare("SELECT a.*, ag.name as group_name, ag.type as group_type FROM accounts a JOIN account_groups ag ON a.group_id = ag.id WHERE a.id = ? AND a.deleted = 0");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode(["success" => true, "data" => $result->fetch_assoc()]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Account not found"]);
        }
    } else {
        // Dashboard-friendly parameters
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        $offset = ($page - 1) * $limit;
        
        // Sorting parameters
        $sort_by = isset($_GET['sortBy']) ? $_GET['sortBy'] : 'a.code';
        $sort_dir = isset($_GET['sortDir']) ? strtoupper($_GET['sortDir']) : 'ASC';
        
        // Validate sort direction
        $sort_dir = ($sort_dir === 'ASC') ? 'ASC' : 'DESC';

        $query = "SELECT a.*, ag.name as group_name, ag.type as group_type 
                  FROM accounts a 
                  JOIN account_groups ag ON a.group_id = ag.id 
                  WHERE a.deleted = 0";
                  
        $countQuery = "SELECT COUNT(*) as total 
                      FROM accounts a 
                      JOIN account_groups ag ON a.group_id = ag.id 
                      WHERE a.deleted = 0";
        
        if ($search) {
            $search_param = "%{$search}%";
            $query .= " AND (a.name LIKE ? OR a.code LIKE ? OR ag.name LIKE ?)";
            $countQuery .= " AND (a.name LIKE ? OR a.code LIKE ? OR ag.name LIKE ?)";
        }
        
        // Add sorting
        $query .= " ORDER BY {$sort_by} {$sort_dir} LIMIT ? OFFSET ?";
        
        $stmt = $conn->prepare($query);
        $countStmt = $conn->prepare($countQuery);

        if ($search) {
            $stmt->bind_param("sssii", $search_param, $search_param, $search_param, $limit, $offset);
            $countStmt->bind_param("sss", $search_param, $search_param, $search_param);
        } else {
            $stmt->bind_param("ii", $limit, $offset);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $accounts = $result->fetch_all(MYSQLI_ASSOC);

        $countStmt->execute();
        $totalResult = $countStmt->get_result()->fetch_assoc();
        $totalPages = ceil($totalResult['total'] / $limit);

        echo json_encode([
            "success" => true,
            'data' => $accounts,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $totalResult['total'],
                'totalPages' => $totalPages
            ],
            'sort' => [
                'sortBy' => $sort_by,
                'sortDir' => $sort_dir
            ]
        ]);
    }
}

function handleGetLedger($conn) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Account ID is required"]);
        return;
    }
    
    // Get account info
    $stmt = $conn->prepare("SELECT a.*, ag.name as group_name FROM accounts a JOIN account_groups ag ON a.group_id = ag.id WHERE a.id = ? AND a.deleted = 0");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows == 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Account not found"]);
        return;
    }
    
    $account = $result->fetch_assoc();
    
    // Get ledger transactions with running balance
    $stmt = $conn->prepare("SELECT t.*, td.amount, td.type 
                            FROM transactions t 
                            JOIN transaction_details td ON t.id = td.transaction_id 
                            WHERE td.account_id = ? 
                            ORDER BY t.date, t.id");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $transactions = array();
    $running_balance = floatval($account['balance']); // Start with opening balance
    
    while($row = $result->fetch_assoc()) {
        if ($row['type'] == 'Debit') {
            $running_balance += floatval($row['amount']);
        } else {
            $running_balance -= floatval($row['amount']);
        }
        $row['running_balance'] = $running_balance;
        $transactions[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "account" => $account,
        "transactions" => $transactions,
        "balance" => $running_balance
    ]);
}

function handlePost($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid JSON payload"]);
        return;
    }

    $errors = validateAccountData($conn, $data);
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Validation failed", "errors" => $errors]);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("INSERT INTO accounts (code, name, group_id, type, balance) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("ssisd", $data['code'], $data['name'], $data['group_id'], $data['type'], $data['balance']);
        $stmt->execute();

        $id = $conn->insert_id;
        $conn->commit();

        $stmt = $conn->prepare("SELECT a.*, ag.name as group_name, ag.type as group_type FROM accounts a JOIN account_groups ag ON a.group_id = ag.id WHERE a.id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $account = $stmt->get_result()->fetch_assoc();

        http_response_code(201);
        echo json_encode(["success" => true, "message" => "Account created successfully", "data" => $account]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to create account", "error" => $e->getMessage()]);
    }
}

function handlePut($conn) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Account ID is required"]);
        return;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid JSON payload"]);
        return;
    }

    $errors = validateAccountData($conn, $data, $id);
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Validation failed", "errors" => $errors]);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("UPDATE accounts SET code = ?, name = ?, group_id = ?, type = ?, balance = ? WHERE id = ? AND deleted = 0");
        $stmt->bind_param("ssisdi", $data['code'], $data['name'], $data['group_id'], $data['type'], $data['balance'], $id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
             $conn->rollback();
             http_response_code(404);
             echo json_encode(["success" => false, "message" => "Account not found or no changes made"]);
             return;
        }
        
        $conn->commit();

        $stmt = $conn->prepare("SELECT a.*, ag.name as group_name, ag.type as group_type FROM accounts a JOIN account_groups ag ON a.group_id = ag.id WHERE a.id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $account = $stmt->get_result()->fetch_assoc();

        echo json_encode(["success" => true, "message" => "Account updated successfully", "data" => $account]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to update account", "error" => $e->getMessage()]);
    }
}

function handleDelete($conn) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Account ID is required"]);
        return;
    }

    // Check for related transactions
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM transaction_details WHERE account_id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    if ($stmt->get_result()->fetch_assoc()['count'] > 0) {
        http_response_code(409); // Conflict
        echo json_encode(["success" => false, "message" => "Cannot delete account with existing transactions. Please delete or reassign transactions first."]);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("UPDATE accounts SET deleted = 1 WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            $conn->commit();
            echo json_encode(["success" => true, "message" => "Account deleted successfully"]);
        } else {
            $conn->rollback();
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Account not found"]);
        }
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to delete account", "error" => $e->getMessage()]);
    }
}

function validateAccountData($conn, $data, $id = null) {
    $errors = [];
    if (empty($data['code'])) {
        $errors['code'] = 'Account code is required';
    } else {
        // Check for duplicate code
        $stmt = $conn->prepare("SELECT id FROM accounts WHERE code = ? AND (id != ? OR ? IS NULL) AND deleted = 0");
        $stmt->bind_param("sii", $data['code'], $id, $id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            $errors['code'] = 'Account code must be unique';
        }
    }

    if (empty($data['name'])) {
        $errors['name'] = 'Account name is required';
    } else {
        // Check for duplicate name
        $stmt = $conn->prepare("SELECT id FROM accounts WHERE name = ? AND (id != ? OR ? IS NULL) AND deleted = 0");
        $stmt->bind_param("sii", $data['name'], $id, $id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            $errors['name'] = 'Account name must be unique';
        }
    }

    if (empty($data['group_id'])) {
        $errors['group_id'] = 'Account group is required';
    } else {
        // Check if group_id exists
        $stmt = $conn->prepare("SELECT id FROM account_groups WHERE id = ?");
        $stmt->bind_param("i", $data['group_id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            $errors['group_id'] = 'Invalid account group';
        }
    }
    
    if (empty($data['type'])) {
        $errors['type'] = 'Account type is required';
    }

    if (!isset($data['balance']) || !is_numeric($data['balance'])) {
        $errors['balance'] = 'Balance must be a number';
    }

    return $errors;
}
?>