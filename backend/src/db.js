import crypto from 'node:crypto';
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

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      age INTEGER,
      description TEXT,
      profile_picture_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `, () => {
    // Migrations for users
    db.run('ALTER TABLE users ADD COLUMN name TEXT', () => {});
    db.run('ALTER TABLE users ADD COLUMN age INTEGER', () => {});
    db.run('ALTER TABLE users ADD COLUMN description TEXT', () => {});
    db.run('ALTER TABLE users ADD COLUMN profile_picture_url TEXT', () => {});
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      type_key TEXT NOT NULL,
      sprite_key TEXT NOT NULL,
      custom_sprite_url TEXT,
      share_token TEXT UNIQUE,
      description TEXT,
      birthday TEXT,
      run_count INTEGER DEFAULT 0,
      ball_count INTEGER DEFAULT 0,
      play_count INTEGER DEFAULT 0,
      guest_run_count INTEGER DEFAULT 0,
      guest_ball_count INTEGER DEFAULT 0,
      guest_play_count INTEGER DEFAULT 0,
      is_real INTEGER DEFAULT 0,
      is_alive INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, () => {
    // Migrate existing pets table if needed
    db.run('ALTER TABLE pets ADD COLUMN description TEXT', () => {});
    db.run('ALTER TABLE pets ADD COLUMN birthday TEXT', () => {});
    db.run('ALTER TABLE pets ADD COLUMN run_count INTEGER DEFAULT 0', () => {});
    db.run('ALTER TABLE pets ADD COLUMN ball_count INTEGER DEFAULT 0', () => {});
    db.run('ALTER TABLE pets ADD COLUMN play_count INTEGER DEFAULT 0', () => {});
    db.run('ALTER TABLE pets ADD COLUMN custom_sprite_url TEXT', () => {});
    db.run('ALTER TABLE pets ADD COLUMN share_token TEXT', () => {
      // Generate tokens for existing pets
      db.all('SELECT id FROM pets WHERE share_token IS NULL', (err, rows) => {
        if (rows) {
          rows.forEach(row => {
            const token = crypto.randomUUID();
            db.run('UPDATE pets SET share_token = ? WHERE id = ?', [token, row.id]);
          });
        }
      });
    });
    db.run('ALTER TABLE pets ADD COLUMN guest_run_count INTEGER DEFAULT 0', () => {});
    db.run('ALTER TABLE pets ADD COLUMN guest_ball_count INTEGER DEFAULT 0', () => {});
    db.run('ALTER TABLE pets ADD COLUMN guest_play_count INTEGER DEFAULT 0', () => {});
    db.run('ALTER TABLE pets ADD COLUMN is_real INTEGER DEFAULT 0', () => {});
    db.run('ALTER TABLE pets ADD COLUMN is_alive INTEGER DEFAULT 1', () => {});
    db.run('ALTER TABLE pets ADD COLUMN checkin_times TEXT', () => {});
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
      reply_to_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
      FOREIGN KEY (reply_to_id) REFERENCES chats(id) ON DELETE SET NULL
    )
  `, () => {
    // Migrate existing chats table if needed
    db.run('ALTER TABLE chats ADD COLUMN mime_type TEXT', () => {});
    db.run('ALTER TABLE chats ADD COLUMN file_url TEXT', () => {});
    db.run('ALTER TABLE chats ADD COLUMN reply_to_id INTEGER', () => {});
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS memory_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      pet_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      title TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_pets_user_id
    ON pets (user_id)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_chats_pet_created_at
    ON chats (pet_id, created_at)
  `);
});
