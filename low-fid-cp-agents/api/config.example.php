<?php
// ─────────────────────────────────────────────────────────────────────────────
// Copy this file to config.php and fill in your values.
// Upload config.php to public_html/api/ via cPanel File Manager.
// This file (config.example.php) is safe to commit — config.php is not.
// ─────────────────────────────────────────────────────────────────────────────

define('OPENAI_API_KEY', 'sk-YOUR_OPENAI_KEY_HERE');
define('OPENAI_MODEL',   'gpt-4o');

// Admin password — unlocks the Manage Users panel in the UI
define('ADMIN_PASSWORD', 'choose_a_strong_password');

// Editable system prompt file
define('PROMPT_FILE', dirname(__DIR__) . '/prompts/system_prompt.txt');

// SQLite database file (auto-created on first request, no setup needed)
define('SQLITE_PATH', dirname(__DIR__) . '/db/chat.db');

// ─────────────────────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────────────────────
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost:5173', 'http://localhost:3000'];
if (in_array($origin, $allowed, true) || str_contains($origin, 'illinois.edu')) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE
// ─────────────────────────────────────────────────────────────────────────────
function getDB(): PDO
{
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dir = dirname(SQLITE_PATH);
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $pdo = new PDO('sqlite:' . SQLITE_PATH, null, null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA journal_mode = WAL');

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT    NOT NULL UNIQUE,
            password_hash TEXT    NOT NULL,
            is_admin      INTEGER NOT NULL DEFAULT 0,
            created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS auth_tokens (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            token      TEXT    NOT NULL UNIQUE,
            created_at TEXT    NOT NULL DEFAULT (datetime('now')),
            expires_at TEXT    NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS conversations (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            role       TEXT    NOT NULL,
            topic      TEXT    NOT NULL,
            started_at TEXT    NOT NULL DEFAULT (datetime('now')),
            ended_at   TEXT    NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS messages (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role            TEXT    NOT NULL CHECK(role IN ('system','user','assistant')),
            content         TEXT    NOT NULL,
            tokens_used     INTEGER NULL,
            created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS logs (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NULL,
            conversation_id INTEGER NULL,
            event           TEXT    NOT NULL,
            detail          TEXT    NULL,
            created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE SET NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
        );
    ");

    $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    if ($count === 0) {
        $hash = password_hash('password', PASSWORD_BCRYPT);
        $pdo->prepare("INSERT INTO users (username, password_hash, is_admin) VALUES ('admin', ?, 1)")
            ->execute([$hash]);
    }

    return $pdo;
}

function requireAuth(): array
{
    $token = null;
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    foreach ($headers as $k => $v) {
        if (strtolower($k) === 'authorization') {
            $token = trim(str_replace('Bearer', '', $v));
            break;
        }
    }
    if (!$token && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $token = trim(str_replace('Bearer', '', $_SERVER['HTTP_AUTHORIZATION']));
    }
    if (!$token) jsonResponse(['error' => 'Unauthorized — no token'], 401);

    $db   = getDB();
    $stmt = $db->prepare(
        "SELECT u.* FROM users u
         JOIN auth_tokens t ON u.id = t.user_id
         WHERE t.token = ? AND t.expires_at > datetime('now')
         LIMIT 1"
    );
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    if (!$user) jsonResponse(['error' => 'Unauthorized — invalid or expired token'], 401);
    return $user;
}

function jsonResponse(array $data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requestBody(): array
{
    static $body = null;
    if ($body === null) {
        $raw  = file_get_contents('php://input');
        $body = $raw ? (json_decode($raw, true) ?? []) : [];
    }
    return $body;
}
