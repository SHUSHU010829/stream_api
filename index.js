import express from "express";
import bodyParser from "body-parser";
import colors from "colors";
import createError from "http-errors";
import dotenv from "dotenv";
dotenv.config();

import {
  getSongList,
  getSongById,
  createSong,
  deleteSong,
  updateSong,
  deleteAllSongs,
} from "./handler/song.js";

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.get("/", (req, res) => {
  res.send("Hello!");
});

// * 歌單
// 拿取歌單
app.get("/songs", async (req, res) => {
  const songs = await getSongList();
  res.send(songs);
});
// 拿取單獨歌曲
app.get("/song/:id", async (req, res) => {
  const id = req.params.id;
  const song = await getSongById(id);
  res.send(song);
});
// 新增歌曲
app.post("/song", async (req, res) => {
  console.log(res.body);
  const { title, artist } = req.body;
  if (!title || !artist || title.trim() === "" || !artist.trim() === "") {
    throw createError(400, "歌曲名稱或歌手名稱不得為空！");
  }
  const song = await createSong(title.trim(), artist.trim());
  res.status(201).send(song);
});
// 更新歌曲
app.put("/song/:id", async (req, res) => {
  const id = req.params.id;
  const { title, artist } = req.body;
  const status = await updateSong(id, title.trim(), artist.trim());
  if (status === 0) {
    throw createError(404, "找不到歌曲！");
  } else {
    res.send("歌曲更新成功！");
  }
});
// 刪除歌曲
app.delete("/song/:id", async (req, res) => {
  const id = req.params.id;
  const status = await deleteSong(id);
  if (status === 0) {
    throw createError(404, "找不到歌曲！");
  } else {
    res.send("歌曲刪除成功！");
  }
});
// 刪除所有歌曲
app.delete("/songs", async (req, res) => {
  const status = await deleteAllSongs();
  if (status === 0) {
    throw createError(404, "沒有歌曲可以刪除！");
  } else {
    res.send("歌曲刪除成功！");
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.log(err.stack.red);
  res.status(500).send("[ERROR] Something broke!");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`[INFO] Server is start running`.blue));
