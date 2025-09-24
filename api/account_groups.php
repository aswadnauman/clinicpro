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

switch($method) {
    case 'GET':
        handleGet($conn);
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
        $stmt = $conn->prepare("SELECT * FROM account_groups WHERE id = ? AND deleted = 0");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode(["success" => true, "data" => $result->fetch_assoc()]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Account group not found"]);
        }
    } else {
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        $offset = ($page - 1) * $limit;

        $query = "SELECT * FROM account_groups WHERE deleted = 0";
        $countQuery = "SELECT COUNT(*) as total FROM account_groups WHERE deleted = 0";
        
        if ($search) {
            $search_param = "%{$search}%";
            $query .= " AND name LIKE ?";
            $countQuery .= " AND name LIKE ?";
        }
        
        $query .= " ORDER BY name LIMIT ? OFFSET ?";
        
        $stmt = $conn->prepare($query);
        $countStmt = $conn->prepare($countQuery);

        if ($search) {
            $stmt->bind_param("sii", $search_param, $limit, $offset);
            $countStmt->bind_param("s", $search_param);
        } else {
            $stmt->bind_param("ii", $limit, $offset);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $groups = $result->fetch_all(MYSQLI_ASSOC);

        $countStmt->execute();
        $totalResult = $countStmt->get_result()->fetch_assoc();
        $totalPages = ceil($totalResult['total'] / $limit);

        echo json_encode([
            "success" => true,
            'data' => $groups,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $totalResult['total'],
                'totalPages' => $totalPages
            ]
        ]);
    }
}

function handlePost($conn) {
    $data = json_decode(file_get_contents("php://input"), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid JSON payload"]);
        return;
    }

    $errors = validateAccountGroupData($conn, $data);
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Validation failed", "errors" => $errors]);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("INSERT INTO account_groups (name, type) VALUES (?, ?)");
        $stmt->bind_param("ss", $data['name'], $data['type']);
        $stmt->execute();

        $id = $conn->insert_id;
        $conn->commit();

        $stmt = $conn->prepare("SELECT * FROM account_groups WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $group = $stmt->get_result()->fetch_assoc();

        http_response_code(201);
        echo json_encode(["success" => true, "message" => "Account group created successfully", "data" => $group]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to create account group", "error" => $e->getMessage()]);
    }
}

function handlePut($conn) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Account group ID is required"]);
        return;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid JSON payload"]);
        return;
    }

    $errors = validateAccountGroupData($conn, $data, $id);
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Validation failed", "errors" => $errors]);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("UPDATE account_groups SET name = ?, type = ? WHERE id = ? AND deleted = 0");
        $stmt->bind_param("ssi", $data['name'], $data['type'], $id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            $conn->rollback();
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Account group not found or no changes made"]);
            return;
        }
        
        $conn->commit();

        $stmt = $conn->prepare("SELECT * FROM account_groups WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $group = $stmt->get_result()->fetch_assoc();

        echo json_encode(["success" => true, "message" => "Account group updated successfully", "data" => $group]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to update account group", "error" => $e->getMessage()]);
    }
}

function handleDelete($conn) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Account group ID is required"]);
        return;
    }

    // Check for related accounts
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM accounts WHERE group_id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    if ($stmt->get_result()->fetch_assoc()['count'] > 0) {
        http_response_code(409); // Conflict
        echo json_encode(["success" => false, "message" => "Cannot delete account group with existing accounts. Please reassign or delete accounts first."]);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("UPDATE account_groups SET deleted = 1 WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            $conn->commit();
            echo json_encode(["success" => true, "message" => "Account group deleted successfully"]);
        } else {
            $conn->rollback();
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Account group not found"]);
        }
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to delete account group", "error" => $e->getMessage()]);
    }
}

function validateAccountGroupData($conn, $data, $id = null) {
    $errors = [];
    
    if (empty($data['name'])) {
        $errors['name'] = 'Account group name is required';
    } else {
        // Check for duplicate name
        $stmt = $conn->prepare("SELECT id FROM account_groups WHERE name = ? AND (id != ? OR ? IS NULL) AND deleted = 0");
        $stmt->bind_param("sii", $data['name'], $id, $id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            $errors['name'] = 'Account group name must be unique';
        }
    }

    if (empty($data['type'])) {
        $errors['type'] = 'Account group type is required';
    }

    return $errors;
}
?>