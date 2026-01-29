-- SQLite Schema

CREATE TABLE IF NOT EXISTS song_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    song_title TEXT,
    singer TEXT,
    song_tags TEXT,
    now_playing INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1  -- 1: active (顯示), 0: archived (歷史紀錄)
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
