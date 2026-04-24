import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';

const dataDir = path.resolve('data');
const filesDir = path.join(dataDir, 'files');
const dbPath = path.join(dataDir, 'petecho.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

sqlite3.verbose();

export const db = new sqlite3.Database(dbPath, (error) => {
  if (error) {
    console.error('Failed to connect to SQLite database.', error);
    return;
  }

  console.log(`SQLite connected at ${dbPath}`);
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  // ... (previous table creation code remains, but I'll add the new columns)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      type_key TEXT NOT NULL,
      sprite_key TEXT NOT NULL,
      description TEXT,
      birthday TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, () => {
    // Migrate existing pets table if needed
    db.run('ALTER TABLE pets ADD COLUMN description TEXT', () => {});
    db.run('ALTER TABLE pets ADD COLUMN birthday TEXT', () => {});
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      pet_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'pet')),
      text TEXT NOT NULL,
      mime_type TEXT,
      file_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
    )
  `, () => {
    // Migrate existing chats table if needed
    db.run('ALTER TABLE chats ADD COLUMN mime_type TEXT', () => {});
    db.run('ALTER TABLE chats ADD COLUMN file_url TEXT', () => {});
  });

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_pets_user_id
    ON pets (user_id)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_chats_pet_created_at
    ON chats (pet_id, created_at)
  `);
});
