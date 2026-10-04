CREATE TABLE workspaces (
  user_id TEXT PRIMARY KEY REFERENCES accounts(user_id),
  sandbox_id TEXT UNIQUE,
  lock_id TEXT,
  locked_until INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
