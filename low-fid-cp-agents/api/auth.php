<?php
require_once __DIR__ . '/config.php';

$body   = requestBody();
$action = $body['action'] ?? '';

// ── Login ─────────────────────────────────────────────────────────────────────
if ($action === 'login') {
    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';

    if (!$username || !$password) {
        jsonResponse(['success' => false, 'error' => 'Username and password are required.']);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM users WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['success' => false, 'error' => 'Invalid username or password.']);
    }

    // Clean up expired tokens for this user
    $db->prepare("DELETE FROM auth_tokens WHERE user_id = ? AND expires_at < datetime('now')")->execute([$user['id']]);

    // Issue a fresh token (valid 24 h)
    $token   = bin2hex(random_bytes(32));
    $expires = gmdate('Y-m-d H:i:s', strtotime('+24 hours'));
    $db->prepare('INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, ?)')
       ->execute([$user['id'], $token, $expires]);

    jsonResponse([
        'success'  => true,
        'token'    => $token,
        'user_id'  => $user['id'],
        'is_admin' => (bool) $user['is_admin'],
        'group_id' => (int) ($user['group_id'] ?? 1),
    ]);
}

// ── Verify admin password ─────────────────────────────────────────────────────
if ($action === 'verify_admin') {
    $pw = $body['password'] ?? '';
    jsonResponse(['success' => $pw === ADMIN_PASSWORD]);
}

jsonResponse(['error' => 'Unknown action.'], 400);
