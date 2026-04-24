import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';

const dataDir = path.resolve('data');
const dbPath = path.join(dataDir, 'petecho.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
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
  db.run(`
    CREATE TABLE IF NOT EXISTS healthcheck (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
});
