<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "fashionflow";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit();
}

// Get POST data
$id = $_POST['ID'] ?? '';
$first_name = $_POST['first_name'] ?? '';
$middle_initial = $_POST['middle_initial'] ?? '';
$last_name = $_POST['last_name'] ?? '';
$extension = $_POST['extension'] ?? '';
$birthdate = $_POST['birthdate'] ?? '';
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';
$email = $_POST['email'] ?? '';
$sex = $_POST['sex'] ?? '';
$purok = $_POST['purok'] ?? '';
$barangay = $_POST['barangay'] ?? '';
$city_municipality = $_POST['city_municipality'] ?? '';
$province = $_POST['province'] ?? '';
$country = $_POST['country'] ?? '';
$zip_code = $_POST['zip_code'] ?? '';
$sec_question_1 = $_POST['sec_question_1'] ?? '';
$sec_answer_1 = $_POST['sec_answer_1'] ?? '';
$sec_question_2 = $_POST['sec_question_2'] ?? '';
$sec_answer_2 = $_POST['sec_answer_2'] ?? '';
$sec_question_3 = $_POST['sec_question_3'] ?? '';
$sec_answer_3 = $_POST['sec_answer_3'] ?? '';

// Validation
if (empty($id) || empty($first_name) || empty($last_name) || empty($username) || empty($password) || empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Required fields are missing.']);
    exit();
}

if (empty($sec_question_1) || empty($sec_question_2) || empty($sec_question_3)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please select all three security questions.']);
    exit();
}

if (empty($sec_answer_1) || empty($sec_answer_2) || empty($sec_answer_3)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please provide answers for all security questions.']);
    exit();
}

if ($sec_question_1 === $sec_question_2 || $sec_question_1 === $sec_question_3 || $sec_question_2 === $sec_question_3) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please select three different security questions.']);
    exit();
}

// Hash passwords
$hashed_password = password_hash($password, PASSWORD_BCRYPT);
$hashed_answer_1 = password_hash(strtolower(trim($sec_answer_1)), PASSWORD_BCRYPT);
$hashed_answer_2 = password_hash(strtolower(trim($sec_answer_2)), PASSWORD_BCRYPT);
$hashed_answer_3 = password_hash(strtolower(trim($sec_answer_3)), PASSWORD_BCRYPT);

// Check duplicates (exclude rejected users so they can re-register)
$checks = [
    ['query' => 'SELECT user_ID FROM users WHERE user_ID = ? AND approval_status != "rejected"', 'param' => $id, 'message' => 'ID already exists.'],
    ['query' => 'SELECT username FROM users WHERE username = ? AND approval_status != "rejected"', 'param' => $username, 'message' => 'Username already exists.'],
    ['query' => 'SELECT email FROM users WHERE email = ? AND approval_status != "rejected"', 'param' => $email, 'message' => 'Email already exists.']
];

foreach ($checks as $check) {
    $stmt = $conn->prepare($check['query']);
    $stmt->bind_param("s", $check['param']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => $check['message']]);
        exit();
    }
    $stmt->close();
}

// Check password uniqueness against approved users only
$stmt = $conn->prepare("SELECT password FROM users WHERE approval_status = 'approved'");
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    if (password_verify($password, $row['password'])) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Password already exists. Please choose a different password.']);
        exit();
    }
}
$stmt->close();

// Insert user with PENDING approval_status
$stmt = $conn->prepare("INSERT INTO users (
    user_ID, Fname, M_I, Lname, Extension, birthdate, username, password, 
    email, sex, purok, barangay, City_Municipality, province, country, zip_code, 
    sec_question_1, sec_answer_1, sec_question_2, sec_answer_2, sec_question_3, sec_answer_3,
    account_status, approval_status, registered_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 'pending', NOW())");

$stmt->bind_param(
    "ssssssssssssssssssssss",
    $id, $first_name, $middle_initial, $last_name, $extension, $birthdate,
    $username, $hashed_password, $email, $sex, $purok, $barangay,
    $city_municipality, $province, $country, $zip_code,
    $sec_question_1, $hashed_answer_1, $sec_question_2, $hashed_answer_2,
    $sec_question_3, $hashed_answer_3
);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
        'success' => true, 
        'message' => 'Registration submitted successfully! Your account is pending approval from the administrator. You will be notified via email once approved.',
        'pending_approval' => true
    ]);
} else {
    error_log("Registration error: " . $stmt->error);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again later.']);
}

$stmt->close();
$conn->close();
?>