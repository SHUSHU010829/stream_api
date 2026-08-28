-- Supabase (PostgreSQL) Schema
-- 在 Supabase SQL Editor 執行此檔案來建表

CREATE TABLE IF NOT EXISTS song_list (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    create_time TIMESTAMPTZ DEFAULT now(),
    song_title TEXT,
    singer TEXT,
    song_tags TEXT,
    now_playing INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,  -- 1: active (顯示), 0: archived (歷史紀錄)
    sort_order INTEGER DEFAULT 0  -- 自訂排序順序，數字越小越前面
);

CREATE TABLE IF NOT EXISTS order_song (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    create_time TIMESTAMPTZ DEFAULT now(),
    title TEXT
);

CREATE TABLE IF NOT EXISTS message_board (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    create_time TIMESTAMPTZ DEFAULT now(),
    message TEXT
);
