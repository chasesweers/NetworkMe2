import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const DB_PATH = path.join(process.cwd(), 'data', 'networkme.db')

const globalForDb = globalThis as unknown as { db: Database.Database | undefined }

function createDb(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    UNIQUE NOT NULL,
      display_name  TEXT,
      password_hash TEXT    NOT NULL,
      created_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS connections (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT    NOT NULL,
      title      TEXT    NOT NULL DEFAULT '',
      company    TEXT    NOT NULL DEFAULT '',
      connected  TEXT    NOT NULL DEFAULT '',
      url        TEXT    NOT NULL DEFAULT '',
      email      TEXT    NOT NULL DEFAULT '',
      person_key TEXT    NOT NULL,
      UNIQUE(user_id, person_key)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      person_key TEXT    NOT NULL,
      PRIMARY KEY (user_id, person_key)
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      a          TEXT    NOT NULL,
      b          TEXT    NOT NULL,
      type_id    TEXT    NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      UNIQUE(user_id, a, b, type_id)
    );

    CREATE TABLE IF NOT EXISTS custom_types (
      id      TEXT    NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label   TEXT    NOT NULL,
      color   TEXT    NOT NULL,
      PRIMARY KEY (user_id, id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      person_key TEXT    NOT NULL,
      text       TEXT    NOT NULL,
      PRIMARY KEY (user_id, person_key)
    );

    CREATE TABLE IF NOT EXISTS archives (
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      person_key TEXT    NOT NULL,
      PRIMARY KEY (user_id, person_key)
    );

    CREATE TABLE IF NOT EXISTS shared_graphs (
      token      TEXT    PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_shared_graphs_user ON shared_graphs(user_id);

    CREATE TABLE IF NOT EXISTS user_snapshots (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      payload    TEXT    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_snapshots_user_created ON user_snapshots(user_id, created_at DESC);
  `)

  // Guarded migration: add is_admin column if not present
  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[]
  if (!cols.some(c => c.name === 'is_admin')) {
    db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
  }

  // Seed admin account from env vars (idempotent)
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    const existing = db.prepare('SELECT id FROM users WHERE is_admin = 1').get()
    if (!existing) {
      const hash = bcrypt.hashSync(adminPassword, 12)
      db.prepare('INSERT OR IGNORE INTO users (email, display_name, password_hash, is_admin) VALUES (?, ?, ?, 1)')
        .run(adminEmail, 'Admin', hash)
    }
  }

  return db
}

export function getDb(): Database.Database {
  if (!globalForDb.db) {
    globalForDb.db = createDb()
  }
  return globalForDb.db
}
