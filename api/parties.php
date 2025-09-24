<?php
// Include config file
include_once '../config.php';

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
        $stmt = $conn->prepare("SELECT * FROM parties WHERE id = ? AND deleted = 0");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode(["success" => true, "data" => $result->fetch_assoc()]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Party not found"]);
        }
    } else {
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        $offset = ($page - 1) * $limit;
        $type = isset($_GET['type']) ? $_GET['type'] : null;

        $query = "SELECT * FROM parties WHERE deleted = 0";
        $countQuery = "SELECT COUNT(*) as total FROM parties WHERE deleted = 0";
        $params = [];
        $countParams = [];
        $types = '';
        $countTypes = '';

        if ($type) {
            $query .= " AND party_type = ?";
            $countQuery .= " AND party_type = ?";
            $params[] = $type;
            $countParams[] = $type;
            $types .= 's';
            $countTypes .= 's';
        }
        
        if ($search) {
            $search_param = "%{$search}%";
            $query .= " AND (name LIKE ? OR code LIKE ?)";
            $countQuery .= " AND (name LIKE ? OR code LIKE ?)";
            $params[] = $search_param;
            $params[] = $search_param;
            $countParams[] = $search_param;
            $countParams[] = $search_param;
            $types .= 'ss';
            $countTypes .= 'ss';
        }
        
        $query .= " ORDER BY code LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';
        
        $stmt = $conn->prepare($query);
        if ($types) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $parties = $result->fetch_all(MYSQLI_ASSOC);

        $countStmt = $conn->prepare($countQuery);
        if ($countTypes) {
            $countStmt->bind_param($countTypes, ...$countParams);
        }
        $countStmt->execute();
        $totalResult = $countStmt->get_result()->fetch_assoc();
        $totalPages = ceil($totalResult['total'] / $limit);

        echo json_encode([
            "success" => true,
            'data' => $parties,
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

    $errors = validatePartyData($conn, $data);
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Validation failed", "errors" => $errors]);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("INSERT INTO parties (code, name, party_type, address, city, phone, email, ntn, strn, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssssssd", $data['code'], $data['name'], $data['party_type'], $data['address'], $data['city'], $data['phone'], $data['email'], $data['ntn'], $data['strn'], $data['balance']);
        $stmt->execute();

        $id = $conn->insert_id;
        $conn->commit();

        $stmt = $conn->prepare("SELECT * FROM parties WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $party = $stmt->get_result()->fetch_assoc();

        http_response_code(201);
        echo json_encode(["success" => true, "message" => "Party created successfully", "data" => $party]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to create party", "error" => $e->getMessage()]);
    }
}

function handlePut($conn) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Party ID is required"]);
        return;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid JSON payload"]);
        return;
    }

    $errors = validatePartyData($conn, $data, $id);
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Validation failed", "errors" => $errors]);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("UPDATE parties SET code = ?, name = ?, party_type = ?, address = ?, city = ?, phone = ?, email = ?, ntn = ?, strn = ?, balance = ? WHERE id = ? AND deleted = 0");
        $stmt->bind_param("sssssssssdi", $data['code'], $data['name'], $data['party_type'], $data['address'], $data['city'], $data['phone'], $data['email'], $data['ntn'], $data['strn'], $data['balance'], $id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
             $conn->rollback();
             http_response_code(404);
             echo json_encode(["success" => false, "message" => "Party not found or no changes made"]);
             return;
        }
        
        $conn->commit();

        $stmt = $conn->prepare("SELECT * FROM parties WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $party = $stmt->get_result()->fetch_assoc();

        echo json_encode(["success" => true, "message" => "Party updated successfully", "data" => $party]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to update party", "error" => $e->getMessage()]);
    }
}

function handleDelete($conn) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Party ID is required"]);
        return;
    }

    // Check for related transactions
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM transactions WHERE party_id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    if ($stmt->get_result()->fetch_assoc()['count'] > 0) {
        http_response_code(409); // Conflict
        echo json_encode(["success" => false, "message" => "Cannot delete party with existing transactions."]);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("UPDATE parties SET deleted = 1 WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            $conn->commit();
            echo json_encode(["success" => true, "message" => "Party deleted successfully"]);
        } else {
            $conn->rollback();
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Party not found"]);
        }
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to delete party", "error" => $e->getMessage()]);
    }
}

function validatePartyData($conn, $data, $id = null) {
    $errors = [];
    if (empty($data['code'])) {
        $errors['code'] = 'Party code is required';
    } else {
        // Check for duplicate code
        $stmt = $conn->prepare("SELECT id FROM parties WHERE code = ? AND id != ? AND deleted = 0");
        $stmt->bind_param("si", $data['code'], $id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            $errors['code'] = 'Party code must be unique';
        }
    }

    if (empty($data['name'])) {
        $errors['name'] = 'Party name is required';
    }

    if (empty($data['party_type'])) {
        $errors['party_type'] = 'Party type is required';
    }

    if (!isset($data['balance']) || !is_numeric($data['balance'])) {
        $errors['balance'] = 'Balance must be a number';
    }

    return $errors;
}
?>