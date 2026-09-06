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

-- 曲庫：主播「會唱」的歌
CREATE TABLE IF NOT EXISTS song_repertoire (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    create_time  TIMESTAMPTZ DEFAULT now(),
    update_time  TIMESTAMPTZ DEFAULT now(),
    song_title   TEXT NOT NULL,
    singer       TEXT NOT NULL DEFAULT '',
    note         TEXT,
    status       INTEGER DEFAULT 1,   -- 1: 上架, 0: 下架（沿用 song_list 的慣例）
    sort_order   INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS song_repertoire_status_idx ON song_repertoire (status);

-- 分類（多維度）：dimension = 'language' | 'mood' | 'era' | ...
CREATE TABLE IF NOT EXISTS song_category (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    create_time TIMESTAMPTZ DEFAULT now(),
    dimension   TEXT NOT NULL,
    slug        TEXT NOT NULL,
    label       TEXT NOT NULL,
    sort_order  INTEGER DEFAULT 0,
    UNIQUE (dimension, slug)
);

CREATE TABLE IF NOT EXISTS song_repertoire_category (
    repertoire_id BIGINT NOT NULL REFERENCES song_repertoire(id) ON DELETE CASCADE,
    category_id   BIGINT NOT NULL REFERENCES song_category(id)   ON DELETE CASCADE,
    PRIMARY KEY (repertoire_id, category_id)
);

-- 點歌申請（審核佇列）
CREATE TABLE IF NOT EXISTS song_request (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    create_time            TIMESTAMPTZ DEFAULT now(),
    decided_time           TIMESTAMPTZ,
    repertoire_id          BIGINT REFERENCES song_repertoire(id) ON DELETE SET NULL,
    song_title             TEXT NOT NULL,          -- 快照，曲庫改名不影響已送出的點歌
    singer                 TEXT NOT NULL DEFAULT '',
    requester_twitch_id    TEXT NOT NULL,
    requester_login        TEXT NOT NULL,
    requester_display_name TEXT NOT NULL,
    status                 TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','approved','rejected','cancelled')),
    reject_reason          TEXT,
    song_list_id           BIGINT REFERENCES song_list(id) ON DELETE SET NULL,
    chat_notified          BOOLEAN DEFAULT false,
    chat_drop_reason       TEXT,
    source                 TEXT DEFAULT 'web'
);
CREATE INDEX IF NOT EXISTS song_request_status_idx ON song_request (status, create_time);
CREATE INDEX IF NOT EXISTS song_request_requester_idx ON song_request (requester_twitch_id, create_time DESC);

-- 同一首歌同時只能有一筆 pending（連續點兩下、兩個分頁點同一首的競態保護）
CREATE UNIQUE INDEX IF NOT EXISTS song_request_pending_unique
    ON song_request (lower(btrim(song_title))) WHERE status = 'pending';

-- song_list 加上點歌來源（全部 nullable，既有列與 SSE 消費端不受影響）
ALTER TABLE song_list ADD COLUMN IF NOT EXISTS requester_login        TEXT;
ALTER TABLE song_list ADD COLUMN IF NOT EXISTS requester_display_name TEXT;
ALTER TABLE song_list ADD COLUMN IF NOT EXISTS request_id             BIGINT;

-- Seed language 維度
INSERT INTO song_category (dimension, slug, label, sort_order) VALUES
    ('language', 'zh', '中文', 1),
    ('language', 'ja', '日文', 2),
    ('language', 'en', '英文', 3),
    ('language', 'ko', '韓文', 4)
ON CONFLICT (dimension, slug) DO NOTHING;
