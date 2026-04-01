-- SQLite schema — for reference only.
-- The database is auto-created by api/config.php on first request.
-- You do NOT need to run this manually.
--
-- To inspect the database locally, open db/chat.db with:
--   - DB Browser for SQLite (https://sqlitebrowser.org) — free GUI
--   - sqlite3 db/chat.db  (command line)

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

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
