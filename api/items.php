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
        $stmt = $conn->prepare("SELECT i.*, c.name as category_name FROM items i JOIN categories c ON i.category_id = c.id WHERE i.id = ? AND i.deleted = 0");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode(["success" => true, "data" => $result->fetch_assoc()]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Item not found"]);
        }
    } else {
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        $offset = ($page - 1) * $limit;

        $query = "SELECT i.*, c.name as category_name FROM items i JOIN categories c ON i.category_id = c.id WHERE i.deleted = 0";
        $countQuery = "SELECT COUNT(*) as total FROM items i JOIN categories c ON i.category_id = c.id WHERE i.deleted = 0";
        
        if ($search) {
            $search_param = "%{$search}%";
            $query .= " AND (i.name LIKE ? OR i.code LIKE ? OR c.name LIKE ?)";
            $countQuery .= " AND (i.name LIKE ? OR i.code LIKE ? OR c.name LIKE ?)";
        }
        
        $query .= " ORDER BY i.code LIMIT ? OFFSET ?";
        
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
        $items = $result->fetch_all(MYSQLI_ASSOC);

        $countStmt->execute();
        $totalResult = $countStmt->get_result()->fetch_assoc();
        $totalPages = ceil($totalResult['total'] / $limit);

        echo json_encode([
            "success" => true,
            'data' => $items,
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

    $errors = validateItemData($conn, $data);
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Validation failed", "errors" => $errors]);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("INSERT INTO items (code, name, category_id, unit, price, stock_quantity, sales_tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssisddd", $data['code'], $data['name'], $data['category_id'], $data['unit'], $data['price'], $data['stock_quantity'], $data['sales_tax_rate']);
        $stmt->execute();

        $id = $conn->insert_id;
        $conn->commit();

        $stmt = $conn->prepare("SELECT i.*, c.name as category_name FROM items i JOIN categories c ON i.category_id = c.id WHERE i.id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $item = $stmt->get_result()->fetch_assoc();

        http_response_code(201);
        echo json_encode(["success" => true, "message" => "Item created successfully", "data" => $item]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to create item", "error" => $e->getMessage()]);
    }
}

function handlePut($conn) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Item ID is required"]);
        return;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid JSON payload"]);
        return;
    }

    $errors = validateItemData($conn, $data, $id);
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Validation failed", "errors" => $errors]);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("UPDATE items SET code = ?, name = ?, category_id = ?, unit = ?, price = ?, stock_quantity = ?, sales_tax_rate = ? WHERE id = ? AND deleted = 0");
        $stmt->bind_param("ssisdddi", $data['code'], $data['name'], $data['category_id'], $data['unit'], $data['price'], $data['stock_quantity'], $data['sales_tax_rate'], $id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
             $conn->rollback();
             http_response_code(404);
             echo json_encode(["success" => false, "message" => "Item not found or no changes made"]);
             return;
        }
        
        $conn->commit();

        $stmt = $conn->prepare("SELECT i.*, c.name as category_name FROM items i JOIN categories c ON i.category_id = c.id WHERE i.id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $item = $stmt->get_result()->fetch_assoc();

        echo json_encode(["success" => true, "message" => "Item updated successfully", "data" => $item]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to update item", "error" => $e->getMessage()]);
    }
}

function handleDelete($conn) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Item ID is required"]);
        return;
    }

    // Check for related transactions
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM transaction_details WHERE item_id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    if ($stmt->get_result()->fetch_assoc()['count'] > 0) {
        http_response_code(409); // Conflict
        echo json_encode(["success" => false, "message" => "Cannot delete item with existing transactions."]);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("UPDATE items SET deleted = 1 WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            $conn->commit();
            echo json_encode(["success" => true, "message" => "Item deleted successfully"]);
        } else {
            $conn->rollback();
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Item not found"]);
        }
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to delete item", "error" => $e->getMessage()]);
    }
}

function validateItemData($conn, $data, $id = null) {
    $errors = [];
    if (empty($data['code'])) {
        $errors['code'] = 'Item code is required';
    } else {
        // Check for duplicate code
        $stmt = $conn->prepare("SELECT id FROM items WHERE code = ? AND id != ? AND deleted = 0");
        $stmt->bind_param("si", $data['code'], $id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            $errors['code'] = 'Item code must be unique';
        }
    }

    if (empty($data['name'])) {
        $errors['name'] = 'Item name is required';
    }

    if (empty($data['category_id'])) {
        $errors['category_id'] = 'Category is required';
    } else {
        // Check if category_id exists
        $stmt = $conn->prepare("SELECT id FROM categories WHERE id = ?");
        $stmt->bind_param("i", $data['category_id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            $errors['category_id'] = 'Invalid category';
        }
    }
    
    if (empty($data['unit'])) {
        $errors['unit'] = 'Unit is required';
    }

    if (!isset($data['price']) || !is_numeric($data['price'])) {
        $errors['price'] = 'Price must be a number';
    }

    if (!isset($data['stock_quantity']) || !is_numeric($data['stock_quantity'])) {
        $errors['stock_quantity'] = 'Stock quantity must be a number';
    }

    if (!isset($data['sales_tax_rate']) || !is_numeric($data['sales_tax_rate'])) {
        $errors['sales_tax_rate'] = 'Sales tax rate must be a number';
    }

    return $errors;
}
?>