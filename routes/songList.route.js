const router = express.Router();
import express from "express";

import {
  getSongList,
  getSongById,
  createSong,
  updateSong,
  deleteSong,
  deleteAllSongs,
  updateNowPlaying,
  stopNowPlaying,
  createOrderSong,
  getOrderSongList,
  deleteOrderSong,
  deleteAllOrderSongs,
} from "../controllers/songList.controller.js";

router.get("/", getSongList);

router.get("/:id", getSongById);

router.post("/", createSong);

router.put("/:id", updateSong);

router.put("/start/:id", updateNowPlaying);

router.put("/stop/:id", stopNowPlaying);

router.delete("/:id", deleteSong);

router.delete("/", deleteAllSongs);

router.post("/order", createOrderSong);

router.get("/order", getOrderSongList);

router.delete("/order/:id", deleteOrderSong);

router.delete("/order", deleteAllOrderSongs);

export default router;
