<?php
// Export functionality for reports
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed"));
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['type']) || !isset($data['data'])) {
    http_response_code(400);
    echo json_encode(array("message" => "Missing required parameters"));
    exit;
}

$type = $data['type'];
$reportData = $data['data'];
$filename = $data['filename'] ?? 'report';

switch ($type) {
    case 'csv':
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="' . $filename . '.csv"');
        
        if (empty($reportData)) {
            echo "No data available";
            exit;
        }
        
        // Output CSV headers
        if (isset($reportData[0]) && is_array($reportData[0])) {
            echo implode(',', array_keys($reportData[0])) . "\n";
            
            // Output CSV data
            foreach ($reportData as $row) {
                // Escape values that might contain commas
                $escapedRow = array_map(function($value) {
                    if (is_string($value) && strpos($value, ',') !== false) {
                        return '"' . $value . '"';
                    }
                    return $value;
                }, $row);
                echo implode(',', $escapedRow) . "\n";
            }
        } else {
            echo "Invalid data format";
        }
        break;
        
    case 'pdf':
        // In a real implementation, this would generate a PDF
        // For now, we'll just return a JSON response indicating PDF generation
        echo json_encode(array(
            "message" => "PDF generation would be implemented here",
            "filename" => $filename . ".pdf"
        ));
        break;
        
    default:
        http_response_code(400);
        echo json_encode(array("message" => "Unsupported export type"));
        break;
}

exit;
?>