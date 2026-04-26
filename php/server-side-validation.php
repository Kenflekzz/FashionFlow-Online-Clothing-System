<?php
ini_set('display_errors', 1); // Show errors in the browser (not recommended for production)
error_reporting(E_ALL); // Report all types of errors

// Log errors to Apache's error log
ini_set('log_errors', 1); // Enable error logging
ini_set('error_log', '/var/log/apache2/error_log'); // Specify the Apache error log location
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "fashionflow";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit();
}

$response = ['success' => false];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['check_username'])) {
        $username = $conn->real_escape_string($_POST['username']);
        $query = "SELECT * FROM users WHERE username = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            http_response_code(409); // Conflict
            $response['message'] = 'Username already exists.';
        } else {
            http_response_code(200); // OK
            $response['success'] = true;
        }
        $stmt->close();
        echo json_encode($response);
        exit();
    }

    if (isset($_POST['check_ID'])) {
        $id = $conn->real_escape_string($_POST['ID']);
        $query = "SELECT * FROM users WHERE user_ID = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            http_response_code(409); // Conflict
            $response['message'] = 'ID already exists.';
        } else {
            http_response_code(200); // OK
            $response['success'] = true;
        }
        $stmt->close();
        echo json_encode($response);
        exit();
    }

    if (isset($_POST['check_email'])) {
        $email = $conn->real_escape_string($_POST['email']);
        $query = "SELECT * FROM users WHERE email = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            http_response_code(409); // Conflict
            $response['message'] = 'Email already exists.';
        } else {
            http_response_code(200); // OK
            $response['success'] = true;
        }
        $stmt->close();
        echo json_encode($response);
        exit();
    }

    if (isset($_POST['check_password']) && !empty($_POST['password'])) {
        $enteredPassword = $_POST['password'];
        $query = "SELECT password FROM users";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $result = $stmt->get_result();

        $passwordExists = false;

        while ($row = $result->fetch_assoc()) {
            $hashedPassword = $row['password'];
            if (password_verify($enteredPassword, $hashedPassword)) {
                $passwordExists = true;
                break;
            }
        }

        $stmt->close();

        if ($passwordExists) {
            http_response_code(409); // Conflict
            $response['message'] = 'Password already in use.';
        } else {
            http_response_code(200); // OK
            $response['success'] = true;
        }
        echo json_encode($response);
        exit();
    }
}

$conn->close();
http_response_code(400); // Bad Request for unknown cases
echo json_encode(['message' => 'Invalid request.']);
exit();
?>
