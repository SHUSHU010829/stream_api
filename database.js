import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "stream.db");
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS song_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    song_title TEXT,
    singer TEXT,
    song_tags TEXT,
    now_playing INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS order_song (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    title TEXT
  );

  CREATE TABLE IF NOT EXISTS message_board (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    message TEXT
  );
`);

// Migration: Add status column if not exists
const tableInfo = db.prepare("PRAGMA table_info(song_list)").all();
const hasStatusColumn = tableInfo.some((col) => col.name === "status");
if (!hasStatusColumn) {
  db.exec("ALTER TABLE song_list ADD COLUMN status INTEGER DEFAULT 1");
}

// Migration: Add sort_order column if not exists
const hasSortOrderColumn = tableInfo.some((col) => col.name === "sort_order");
if (!hasSortOrderColumn) {
  db.exec("ALTER TABLE song_list ADD COLUMN sort_order INTEGER DEFAULT 0");
}

export default db;
