<?php
session_start();
header('Content-Type: application/json');

$response = [
    'session_id' => session_id(),
    'session_data' => $_SESSION,
    'cookies' => $_COOKIE,
    'logged_in' => isset($_SESSION['user_id']) ? true : false
];

// Add user data from database if needed
if (isset($_SESSION['user_id'])) {
    $conn = new mysqli("localhost", "root", "", "fashionflow");
    if (!$conn->connect_error) {
        $stmt = $conn->prepare("SELECT user_ID, username, account_status, is_blocked FROM users WHERE user_ID = ?");
        $stmt->bind_param("s", $_SESSION['user_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($user = $result->fetch_assoc()) {
            $response['user_data'] = $user;
        }
        $conn->close();
    }
}

echo json_encode($response);
?>