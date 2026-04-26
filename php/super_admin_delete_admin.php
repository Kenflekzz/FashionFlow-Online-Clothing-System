<?php
ini_set('display_errors', 0); // Hide errors from browser (show as JSON instead)
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', '/var/log/apache2/error_log');
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "fashionflow";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit;
}

// Check if ID is provided
if (!isset($_POST['id'])) {
    echo json_encode(['success' => false, 'message' => 'No ID provided']);
    exit;
}

$id = $_POST['id'];

// Delete only if this is an admin
$sql = "DELETE FROM users WHERE user_ID = ? AND account_status = 'admin'";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Admin deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Admin not found or cannot delete (might be super admin)']);
    }
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}

$stmt->close();
$conn->close();
?>