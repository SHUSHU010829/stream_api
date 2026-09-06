# 企劃：曲庫（Song Repertoire）＋ 點歌審核（Song Request）

## 背景

這是跨三個 repo 的功能（另兩個是 `obs_tool`、`shushu.tw`，各自有自己的企劃文件）。目標：觀眾在 shushu.tw 瀏覽實況主的曲庫並用 Twitch 帳號點歌，實況主在 obs_tool 審核，核准後進入 `song_list`（既有的即時歌單，OBS overlay 已透過 SSE 讀取）。stream_api 是三邊的唯一真實資料來源，本文件只涵蓋 stream_api 這一側要做的事。

現況：`song_list`（目前播放佇列）、`order_song`（半成品點歌表，只有 `title`，不知道誰點的，且其 `GET /order/`、`DELETE /order/` 因路由順序 bug 實際上呼叫不到）、`message_board` 三張表，沒有「曲庫」概念，也沒有分類，零驗證（CORS 全開、Supabase 用 service-role key），沒有 Twitch 整合。

## 決策

### 1. 新增 `song_repertoire`／`song_category`／`song_repertoire_category`／`song_request` 四張表，不沿用 `order_song`

`order_song` 只有 `title`，沒有點歌者、沒有狀態，硬改要同時修路由 bug 又要加欄位，不如新建。`order_song` 保留不動，之後再決定要不要清掉。

**分類採多維度模型**，不是單一 `language TEXT` 欄位：新增 `song_category(dimension, slug, label)`，`dimension` 例如 `language`、以後可能的 `mood`／`era` 都是「加一筆資料」而不是「改 schema」。這是 SDD 那邊也已確認的模型，obs_tool 和 shushu.tw 都會按這個形狀串接，**不要中途改成單欄 language，否則另外兩邊的分類 UI 全部要重寫**。

不要重用 `song_tags`（`song_list` 上那個從沒被讀寫過的欄位）——那是佇列表不是曲庫表，語意不對，而且 OBS overlay 目前用 `select('*')` 讀 `song_list`，動它有風險。留著當死欄位，之後再清。

### 2. 新路由掛在頂層，不要塞進 `/songList` 底下

`routes/songList.route.js` 現有一個真實存在的 bug：`GET /:id`（第 35 行）擋在 `GET /order/`（第 61 行）之前，`DELETE /:id`（第 55 行）擋在 `DELETE /order/`（第 65 行）之前，導致這兩個端點永遠呼叫不到（`DELETE /order/:id` 因為是兩段路徑沒事）。

新路由一律掛在頂層（`/repertoire`、`/songRequest`），完全不進 `/songList` 命名空間，從結構上避開這個坑。**但在 `/repertoire`、`/songRequest` 內部，一樣要把 `/categories`、`/pending`、`/mine`、`/import` 這類集合層級路徑，全部寫在 `/:id` 之上**，否則會在新路由裡重蹈覆轍（例如 `GET /repertoire/categories` 若晚於 `GET /repertoire/:id` 註冊，會被當成 `id="categories"` 打到 Supabase 炸掉）。

順手把 `songList.route.js` 裡 `/order/*` 的兩行也搬到 `/:id` 之上修掉——沒有已知呼叫端，屬於零風險的順手修正。

### 3.（改版）用 tmi.js 發聊天室訊息，跟同帳號下 `twitch_bot` 專案同一套發送方式

原本決策是用 Helix `POST /helix/chat/messages`（無狀態 HTTP、有明確送達回饋），理由詳見下方「原始決策（已棄用）」。後來決定改成跟既有的 `twitch_bot` 專案（`~/Desktop/twitch_bot`，`src/index.js`）同一套：`tmi.js` 長連線 + `client.say(channel, message)`，identity 是 `{username, password}`，`password` 是 `oauth:`開頭的 chat token。理由：`twitch_bot` 已經在跑、已驗證過這套可行，不用再走 `user:write:chat` 的 client_secret + refresh_token 授權流程，Phase 0 的手動設定變簡單很多。代價是拿不到 Helix 的 `is_sent`／`drop_reason` 送達細節，但反正聊天室發送失敗本來就是整個吞掉，差異不大。

Bot 帳號設定（**這步驟要手動先做**，仍是最容易卡關的一步）：
1. 沿用（或新開）一個 bot Twitch 帳號——`twitch_bot` 用的是 `shushuBot`／頻道 `shushu010829`，若要同一顆 bot 露出，`.env` 裡的 `TWITCH_PASSWORD` 可以直接複用 `twitch_bot` 那組 oauth token。
2. 用 https://twitchtokengenerator.com（或等效工具）產生 `chat:read`＋`chat:edit` scope 的 oauth token（格式 `oauth:xxxxxxxx`）。
3. 把 bot 設成頻道版主（moderator）——除了拿到 bot 徽章，發言速率上限也會從 20/30s 提高到 100/30s。
4. 記下 `TWITCH_BOT_USERNAME`、`TWITCH_PASSWORD`、`TWITCH_CHANNEL`。

`services/twitchChat.service.js` 用惰性建立、模組層級單例 `tmi.Client`，第一次呼叫 `sendChatMessage` 才 `connect()`，連線失敗只記 log 並把 client 重置成 `null`（下次呼叫會重試連線）。

**聊天室發送絕對不能讓點歌失敗**：包在 try/catch，一律吞掉例外只記 log／寫回 `chat_notified=false` + `chat_drop_reason`，never throw 到呼叫端。訊息內容要 sanitize（去掉 `\r\n`、裁到 480 字、去掉開頭的 `/` 或 `.` 避免被誤判成聊天室指令）。

<details>
<summary>原始決策（已棄用）：Helix + OAuth refresh token</summary>

tmi.js 要維持長連線、處理重連，且一樣需要 bot 的 token。Helix 是無狀態 HTTP 呼叫，對 Zeabur 上這種會被平台重啟的長駐 process 更簡單、也有明確的送達回饋（`is_sent`／`drop_reason`，可以知道是不是被 AutoMod 擋了）。

Bot 需要的 scope 是 `user:write:chat`（不是 IRC 用的 `chat:edit`）：開一個獨立的 bot Twitch 帳號、跑一次授權碼流程拿 `refresh_token`、記下 `TWITCH_BOT_USER_ID`／`TWITCH_BROADCASTER_ID`。Token 快取比照 shushu.tw 的 `token-manager.ts` 寫法：模組層級 `{accessToken, expiresAt}`，5 分鐘 buffer，401 時強制刷新重試一次。

</details>

### 4. 驗證用「密鑰未設定即放行」漸進式上線

三個 repo 分開部署，若 stream_api 一上線就強制檢查密鑰，obs_tool 的代理還沒接上就會全掛。Middleware 在 `ADMIN_API_KEY`／`CLIENT_API_KEY` 未設定時直接 `next()` 並印一次警告，讓密鑰的啟用變成一個之後可隨時反悔的環境變數開關。

兩把密鑰、兩種角色：
- `ADMIN_API_KEY` 給 obs_tool 的伺服器端代理用，可以做任何寫入/刪除。
- `CLIENT_API_KEY` 給 shushu.tw 的 Route Handler 用，只能呼叫 `POST /songRequest`（送出點歌）。

標頭用 `x-api-key`，比對用 `crypto.timingSafeEqual`（先比長度，不等長就直接判失敗，不要對不等長 buffer 硬做 timingSafeEqual 會丟例外）。**這個 middleware 必須掛在 `cors()` 之後**，否則不帶自訂標頭的 CORS 預檢請求（OPTIONS）會被擋成 401。

## Schema 異動

在 `schema.sql` 追加（全部用 `IF NOT EXISTS`，這是純新增的 migration，不動既有三張表的資料）：

```sql
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
```

Seed `language` 維度：`('language','zh','中文')`、`('language','ja','日文')`、`('language','en','英文')`、`('language','ko','韓文')`。

**為什麼要那個 partial unique index**：需求裡「同一首已在佇列就不能重複點」是跨表（`song_list` vs `song_request`）的讀後寫檢查，沒辦法用單一 DB constraint 完整表達，但 `pending` 這個子情境（連續點兩下、兩個瀏覽器分頁幾乎同時點同一首）可以用 partial unique index 免費擋掉——API 只要把 Postgres 的 `23505` 錯誤碼轉成 409 即可，等於是應用層檢查之外的最後一道防線。

## 新增檔案

```
middleware/auth.middleware.js
services/songListStream.service.js      ← 從 songList.controller.js 抽出來，不改行為
services/twitchChat.service.js          ← tmi.js，同 twitch_bot 專案的發送方式
models/repertoire.model.js
models/songRequest.model.js
controllers/repertoire.controller.js
controllers/songRequest.controller.js
routes/repertoire.route.js
routes/songRequest.route.js
```

model 一律沿用既有慣例：`const {data, error} = await supabase...; if (error) throw error; return data;`，命名 `getDB*`／`createDB*`／`updateDB*`／`deleteDB*`。controller 回傳裸 payload，mutation 回 `{message: "…！"}`。**新 controller 的驗證與 404／409 一定要在 try 內明確 `return res.status(...)`，不要學現有 `songList.controller.js` 把 `createError(...)` 丟在 try 裡被同層 catch 吞掉變成 500，或丟在 try 外變成 async handler 裡的 unhandled rejection。**

### `routes/repertoire.route.js`（掛在 `/repertoire`，注意註冊順序）

| # | Method | Path | 驗證 | Body | 說明 |
|---|---|---|---|---|---|
| 1 | GET | `/repertoire/categories` | 無 | – | 所有分類選項，依 dimension 分組 |
| 2 | POST | `/repertoire/categories` | admin | `{dimension,slug,label,sort_order?}` | 新增分類 |
| 3 | PUT | `/repertoire/categories/:id` | admin | `{label?,slug?,sort_order?}` | 編輯分類 |
| 4 | DELETE | `/repertoire/categories/:id` | admin | – | 刪除分類 |
| 5 | POST | `/repertoire/import` | admin | `{songs:[{song_title,singer,category_slugs?}]}` | 批次匯入 |
| 6 | GET | `/repertoire/` | 無 | `?status=all`（預設只回上架） | 曲庫清單，含 embedded categories |
| 7 | POST | `/repertoire/` | admin | `{song_title,singer,note?,category_ids?}` | 新增歌曲 |
| 8 | PUT | `/repertoire/:id` | admin | 上述欄位任意子集 | 編輯 |
| 9 | DELETE | `/repertoire/:id` | admin | – | 軟刪除（`status=0`） |

第 1–5 項（含 `/categories`、`/import`）必須寫在第 6–9 項（含 `/:id`）之前。

v1 不做伺服器端分類篩選——`GET /repertoire/` 回傳全部並帶 embedded categories，篩選交給前端做（曲目數量還小，這樣最簡單）。

### `routes/songRequest.route.js`（掛在 `/songRequest`）

| # | Method | Path | 驗證 | Body | 說明 |
|---|---|---|---|---|---|
| 1 | GET | `/songRequest/pending` | admin | – | 待審清單 |
| 2 | GET | `/songRequest/mine` | client | `?twitch_id=` | 該觀眾自己的點歌紀錄 |
| 3 | PUT | `/songRequest/approve/:id` | admin | – | 核准（見下方原子邏輯） |
| 4 | PUT | `/songRequest/reject/:id` | admin | `{reason?}` | 拒絕 |
| 5 | POST | `/songRequest/` | client | `{repertoire_id?, song_title, singer?, requester:{twitch_id,login,display_name}}` | 建立點歌 |
| 6 | GET | `/songRequest/` | admin | `?status=` | 全部 |
| 7 | DELETE | `/songRequest/:id` | admin | – | 刪除紀錄 |

`GET /mine` 之所以能安全存在，是因為 `client` 密鑰只活在 shushu.tw 的伺服器端，`twitch_id` 是從 shushu.tw 已驗證的 session 帶過來的，瀏覽器完全碰不到 stream_api。

**`POST /songRequest/` 邏輯**：
1. body 驗證在 try 之前，缺欄位直接 `return res.status(400).json({message:"請提供歌曲與點歌者資訊！"})`。
2. 若帶 `repertoire_id`，用曲庫裡的 `song_title`／`singer` 覆蓋，**不要相信 client 傳來的字串**。
3. 重複檢查兩層（因為手動加進佇列的歌沒有 `repertoire_id`）：`song_list` 裡 `status=1` 且標題比對、以及 `song_request` 裡 `pending` 且同 `repertoire_id`——命中回 409。
4. Insert；捕捉 Postgres `23505`（撞到 partial unique index）同樣轉 409，當作競態的最後防線。
5. `sendChatMessage(...)` 用 fire-and-forget，結果寫回 `chat_notified`／`chat_drop_reason`，**絕不 await 進回應路徑**。
6. `res.status(201).json(newRequest)`。

**`PUT /songRequest/approve/:id` 必須是單一原子端點**（不要讓前端分兩次呼叫）：
1. 撈 request，若 `status !== 'pending'` → 409 `{message:"此點歌已處理過！"}`。
2. 對 `song_list` 再做一次重複檢查。
3. `nextSortOrder = max(sort_order WHERE status=1) + 1` ——**這一步不能省**：既有的 `createDBSong` 插入時 `sort_order` 預設是 0，若照抄會讓每一首核准的點歌跳到佇列最前面，把主播原本排好的順序打亂。
4. 新增一個 `createDBSongFromRequest(...)` model 函式插入 `song_list`（帶 `requester_login`、`requester_display_name`、`request_id`），**不要為此擴寬既有 `createDBSong(title, artist)` 的參數**。
5. 更新 request → `status='approved'`、`decided_time=now()`、`song_list_id`。
6. 呼叫抽出來的 `broadcastSongList()`（見下方），讓 OBS overlay 立即透過 SSE 更新。
7. 可選：發一則「@login 你點的《X》已加入歌單」到聊天室。
8. `200 {message:"已接受點歌！"}`。

### 抽出 SSE 廣播邏輯

`sseClients` 陣列與 `broadcastSongList()` 目前是 `controllers/songList.controller.js` 的模組私有變數。核准點歌時也需要觸發廣播，把兩者搬進 `services/songListStream.service.js`，讓 `songList.controller.js` 和 `songRequest.controller.js` 都 import 它——純搬移，不改行為，避免 controller 互相 import 造成循環相依。

## `index.js` 異動

- 掛上 `app.use("/repertoire", repertoireRoutes)`、`app.use("/songRequest", songRequestRoutes)`。
- CORS 從全開收斂成 allowlist：

```js
cors({
  origin: (process.env.ALLOWED_ORIGINS ?? "*").split(","),
  allowedHeaders: ["Content-Type", "x-api-key"],
  maxAge: 86400,   // 原本是 84600，疑似打字錯誤，順手修掉
})
```

- 掛驗證 middleware 到既有的寫入端點：`POST/PUT/DELETE /songList/*`（含 `/hard`）全部 `requireAdmin`；`POST /messageBoard/` 用 `requireClient`（**這個要等 shushu.tw 的 whisper 代理上線後才能真的鎖上，否則會打斷現有的悄悄話功能**）；所有 `GET`（含 `/songList/stream`）維持不驗證。

## 順手修掉的既有問題

- `body-parser`、`http-errors` 目前只靠 Express 4 的傳遞相依解析，不在 `package.json` `dependencies` 裡；`colors` 在 `devDependencies`。任何 `npm ci --omit=dev` 或升級 Express 都會炸——三個都補進 `dependencies`。
- `controllers/messageBoard.controller.js` 呼叫 `createError(...)` 卻沒 import `http-errors`——空 body 的 `POST /messageBoard` 會丟 `ReferenceError`，補上 import。

## 環境變數

`ADMIN_API_KEY`、`CLIENT_API_KEY`、`ALLOWED_ORIGINS`（可選）、`TWITCH_BOT_USERNAME`（例如 `shushuBot`）、`TWITCH_PASSWORD`（`oauth:`開頭的 chat token，可與 `twitch_bot` 共用同一顆 bot）、`TWITCH_CHANNEL`（例如 `shushu010829`）、`TWITCH_CHAT_ENABLED`（預設 true，緊急時可關）。

## 上線順序（本 repo 這一側）

1. 先做 Phase 0 的手動步驟（bot 帳號、拿 chat oauth token、設版主）——最容易卡關，最先驗證。
2. 在 Supabase SQL editor 跑 migration，seed 分類。
3. 抽出 `songListStream.service.js`（純搬移）。
4. 加 `auth.middleware.js`，掛到所有寫入路由，**先不設 `ADMIN_API_KEY`／`CLIENT_API_KEY`** 就部署——行為不變。
5. 加 `repertoire`、`songRequest` 路由/model/controller，`twitchChat.service.js`（沒設定 `TWITCH_PASSWORD` 時是 no-op），CORS 收斂，package.json 修正。部署。
6. 確認 obs_tool 的代理、shushu.tw 的 Route Handler 都已上線且都帶著各自的密鑰在打 stream_api 之後，才在 Zeabur 設定 `ADMIN_API_KEY`／`CLIENT_API_KEY`，讓驗證正式生效。**回退方式是把這兩個環境變數刪掉。**

## 驗證方式

1. `npm run start:dev`，用 curl 跑一輪：建曲庫（含分類）、查曲庫、點歌、重複點同一首應回 409、核准、確認 `song_list` 多一列且 `sort_order` 是接在佇列尾端而不是變成 0。
2. 開著 obs_tool 的 `/song` overlay，核准一首歌，overlay 應立即透過 SSE 更新。
3. 實際點一首歌，確認 bot 帳號真的在頻道發話；先發一則測試訊息確認 token／版主權限都到位。
4. 設定 `ADMIN_API_KEY` 後，直接 curl `DELETE /songList/hard` 應回 401 而不是清空資料。
5. `npm run lint`（若有設定）。這個 repo 沒有測試框架，以上以手動驗證為主。

## 風險

- **Bot 聊天室權限最容易卡關**，chat oauth token 只是 bot 端授權，還需要主播把 bot 設成版主，否則發言速率上限很低（20/30s）。
- **tmi.js 是長連線**，若 Zeabur 重啟 process 會需要重新 `connect()`——`twitchChat.service.js` 用惰性重連處理，但連線建立到完成前那幾秒的點歌通知可能會 drop（`chat_notified=false`），這是可接受的已知限制。
- **聊天室發送失敗絕不能擋住點歌**——已在設計裡強制包住，實作時務必保持。
- **既有 controller 的錯誤處理是壞的**（見上方「新增檔案」段落說明），新程式碼不要照抄。
- **Supabase 仍用 service-role key**，加了 API 層驗證後曝險已大幅收斂，但長期正解是 anon key + RLS，本次不做。
- 這是三個獨立 repo、三次獨立部署，Phase 4（開啟驗證）之前任何時間點都必須是可運作狀態，這正是「密鑰未設定即放行」的用意。
