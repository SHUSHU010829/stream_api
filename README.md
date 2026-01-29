# Stream API

直播工具後端 API 服務

## 技術棧

- Express.js
- SQLite (better-sqlite3)

---

## API 文檔

### 基礎 URL

```
http://localhost:3000
```

---

## 歌單 API (`/songList`)

### 資料結構

```json
{
  "id": 1,
  "create_time": "2024-01-01 12:00:00",
  "song_title": "歌曲名稱",
  "singer": "歌手",
  "song_tags": "標籤",
  "now_playing": 0,
  "status": 1,
  "sort_order": 0
}
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER | 歌曲唯一識別碼 |
| `create_time` | DATETIME | 建立時間 |
| `song_title` | TEXT | 歌曲名稱 |
| `singer` | TEXT | 歌手名稱 |
| `song_tags` | TEXT | 歌曲標籤 |
| `now_playing` | INTEGER | 播放狀態：`0` 停止，`1` 播放中 |
| `status` | INTEGER | 歌曲狀態：`1` 活動中，`0` 已歸檔 |
| `sort_order` | INTEGER | 排序順序，數字越小越前面 |

---

### 查詢類

#### 獲取所有歌曲

```
GET /songList/
```

回傳所有歌曲（包含活動中與已歸檔）。

**回傳範例：**
```json
[
  { "id": 1, "song_title": "歌曲A", "singer": "歌手A", "status": 1, ... },
  { "id": 2, "song_title": "歌曲B", "singer": "歌手B", "status": 0, ... }
]
```

---

#### 獲取活動中歌曲

```
GET /songList/active
```

只回傳 `status = 1` 的歌曲，依 `sort_order` 升序排列。

**用途：** 前端顯示當前歌單

---

#### 獲取歷史歌曲

```
GET /songList/history
```

回傳 `status = 0` 的歌曲，依建立時間降序排列。

**用途：** 查看歷史歌單紀錄

---

#### 根據 ID 獲取歌曲

```
GET /songList/:id
```

| 參數 | 位置 | 說明 |
|------|------|------|
| `id` | URL | 歌曲 ID |

---

### 新增類

#### 新增歌曲

```
POST /songList/
```

**Body：**
```json
{
  "title": "歌曲名稱",
  "artist": "歌手名稱"
}
```

**回傳：** 新建立的歌曲物件

---

### 更新類

#### 更新歌曲資訊

```
PUT /songList/:id
```

| 參數 | 位置 | 說明 |
|------|------|------|
| `id` | URL | 歌曲 ID |

**Body：**
```json
{
  "title": "新歌曲名稱",
  "artist": "新歌手名稱"
}
```

---

#### 開始播放

```
PUT /songList/start/:id
```

將指定歌曲設為播放中（`now_playing = 1`），同時停止其他歌曲。

| 參數 | 位置 | 說明 |
|------|------|------|
| `id` | URL | 歌曲 ID |

---

#### 停止播放

```
PUT /songList/stop/:id
```

將指定歌曲停止播放（`now_playing = 0`）。

| 參數 | 位置 | 說明 |
|------|------|------|
| `id` | URL | 歌曲 ID |

---

#### 恢復歸檔歌曲

```
PUT /songList/restore/:id
```

將已歸檔的歌曲恢復為活動狀態（`status = 1`）。

| 參數 | 位置 | 說明 |
|------|------|------|
| `id` | URL | 歌曲 ID |

**回傳：**
```json
{ "message": "歌曲已恢復！" }
```

---

#### 更新單一歌曲排序

```
PUT /songList/sort/:id
```

| 參數 | 位置 | 說明 |
|------|------|------|
| `id` | URL | 歌曲 ID |

**Body：**
```json
{
  "sort_order": 0
}
```

**回傳：**
```json
{ "message": "排序更新成功！" }
```

---

#### 批量更新排序

```
PUT /songList/sort
```

一次更新多首歌曲的排序，適合拖曳排序後呼叫。

**Body：**
```json
{
  "songs": [
    { "id": 3, "sort_order": 0 },
    { "id": 1, "sort_order": 1 },
    { "id": 2, "sort_order": 2 }
  ]
}
```

**回傳：**
```json
{ "message": "已更新 3 首歌曲的排序！" }
```

---

### 刪除類

#### 歸檔歌曲（軟刪除）

```
DELETE /songList/:id
```

將歌曲設為歸檔狀態（`status = 0`），資料保留。

| 參數 | 位置 | 說明 |
|------|------|------|
| `id` | URL | 歌曲 ID |

**回傳：**
```json
{ "message": "歌曲已歸檔！" }
```

---

#### 歸檔所有歌曲（軟刪除）

```
DELETE /songList/
```

將所有活動中的歌曲設為歸檔狀態，資料保留。

**回傳：**
```json
{ "message": "歌曲已歸檔！" }
```

---

#### 永久刪除歌曲

```
DELETE /songList/hard/:id
```

從資料庫完全刪除歌曲，無法恢復。

| 參數 | 位置 | 說明 |
|------|------|------|
| `id` | URL | 歌曲 ID |

**回傳：**
```json
{ "message": "歌曲永久刪除成功！" }
```

---

#### 永久刪除所有歌曲

```
DELETE /songList/hard
```

從資料庫完全刪除所有歌曲，無法恢復。

**回傳：**
```json
{ "message": "所有歌曲永久刪除成功！" }
```

---

## 點歌 API (`/songList/order`)

### 資料結構

```json
{
  "id": 1,
  "create_time": "2024-01-01 12:00:00",
  "title": "點歌名稱"
}
```

---

#### 獲取所有點歌

```
GET /songList/order/
```

---

#### 新增點歌

```
POST /songList/order/
```

**Body：**
```json
{
  "title": "想點的歌"
}
```

---

#### 刪除點歌

```
DELETE /songList/order/:id
```

| 參數 | 位置 | 說明 |
|------|------|------|
| `id` | URL | 點歌 ID |

---

#### 刪除所有點歌

```
DELETE /songList/order/
```

---

## 留言板 API (`/messageBoard`)

### 資料結構

```json
{
  "id": 1,
  "create_time": "2024-01-01 12:00:00",
  "message": "留言內容"
}
```

---

## API 路由總覽

### 歌單 API

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/songList/` | 獲取所有歌曲 |
| GET | `/songList/active` | 獲取活動中歌曲（已排序） |
| GET | `/songList/history` | 獲取歷史歌曲 |
| GET | `/songList/:id` | 根據 ID 獲取歌曲 |
| POST | `/songList/` | 新增歌曲 |
| PUT | `/songList/:id` | 更新歌曲資訊 |
| PUT | `/songList/start/:id` | 開始播放 |
| PUT | `/songList/stop/:id` | 停止播放 |
| PUT | `/songList/restore/:id` | 恢復歸檔歌曲 |
| PUT | `/songList/sort/:id` | 更新單一歌曲排序 |
| PUT | `/songList/sort` | 批量更新排序 |
| DELETE | `/songList/:id` | 歸檔歌曲（軟刪除） |
| DELETE | `/songList/` | 歸檔所有歌曲（軟刪除） |
| DELETE | `/songList/hard/:id` | 永久刪除歌曲 |
| DELETE | `/songList/hard` | 永久刪除所有歌曲 |

### 點歌 API

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/songList/order/` | 獲取所有點歌 |
| POST | `/songList/order/` | 新增點歌 |
| DELETE | `/songList/order/:id` | 刪除點歌 |
| DELETE | `/songList/order/` | 刪除所有點歌 |
