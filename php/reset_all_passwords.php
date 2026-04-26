<?php
$host = "localhost";
$dbUser = "root";
$dbPassword = "";
$dbname = "fashionflow";

$conn = new mysqli($host, $dbUser, $dbPassword, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Define unique default passwords for each user
$users = [
    'pathrick' => 'Pathrick123',
    'kenneth' => 'Kenneth123',
    'harry' => 'Harry123'
];

foreach ($users as $username => $newPassword) {
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE username = ?");
    $stmt->bind_param("ss", $hashedPassword, $username);
    
    if ($stmt->execute()) {
        echo "Updated password for '$username'<br>";
        echo "New password: $newPassword<br>";
        echo "Hash: " . substr($hashedPassword, 0, 20) . "...<br><br>";
    } else {
        echo "Failed to update '$username'<br>";
    }
    
    $stmt->close();
}

$conn->close();
echo "<br>All passwords reset. Users must login with their new passwords above.";
?>