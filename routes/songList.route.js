const router = express.Router();
import express from "express";

import {
  getSongList,
  getActiveSongList,
  getSongHistory,
  getSongById,
  createSong,
  updateSong,
  deleteSong,
  deleteAllSongs,
  hardDeleteSong,
  hardDeleteAllSongs,
  restoreSong,
  updateSongOrder,
  updateBatchSongOrder,
  updateNowPlaying,
  stopNowPlaying,
  createOrderSong,
  getOrderSongList,
  deleteOrderSong,
  deleteAllOrderSongs,
} from "../controllers/songList.controller.js";

router.get("/", getSongList);

router.get("/active", getActiveSongList);

router.get("/history", getSongHistory);

router.get("/:id", getSongById);

router.post("/", createSong);

router.put("/start/:id", updateNowPlaying);

router.put("/stop/:id", stopNowPlaying);

router.put("/restore/:id", restoreSong);

router.put("/sort/:id", updateSongOrder);

router.put("/sort", updateBatchSongOrder);

router.put("/:id", updateSong);

router.delete("/hard/:id", hardDeleteSong);

router.delete("/hard", hardDeleteAllSongs);

router.delete("/:id", deleteSong);

router.delete("/", deleteAllSongs);

router.post("/order/", createOrderSong);

router.get("/order/", getOrderSongList);

router.delete("/order/:id", deleteOrderSong);

router.delete("/order/", deleteAllOrderSongs);

export default router;
