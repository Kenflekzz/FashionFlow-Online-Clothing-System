<?php
function logActivity($conn, $userId, $username, $role, $activityType, $description = '', $performedBy = null) {
    $ip     = $_SERVER['REMOTE_ADDR']    ?? 'Unknown';
    $device = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

    $stmt = $conn->prepare("
        INSERT INTO activity_log
            (user_id, username, role, activity_type, description, ip_address, device, performed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    if (!$stmt) return false;

    $stmt->bind_param("ssssssss",
        $userId, $username, $role,
        $activityType, $description,
        $ip, $device, $performedBy
    );

    $result = $stmt->execute();
    $stmt->close();
    return $result;
}
?>