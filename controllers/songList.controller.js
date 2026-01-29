import {
  getDBSongList,
  getDBActiveSongList,
  getDBSongHistory,
  getDBSongById,
  createDBSong,
  updateDBSong,
  deleteDBSong,
  deleteDBAllSongs,
  hardDeleteDBSong,
  hardDeleteDBAllSongs,
  restoreDBSong,
  updateDBSongOrder,
  updateDBBatchSongOrder,
  updateDBNowPlaying,
  deleteDBOrderSong,
  deleteDBOrderAllSongs,
  getDBOrderSongList,
  createDBOrderSong,
} from "../models/songList.model.js";

export const getSongList = async (req, res) => {
  try {
    const songs = await getDBSongList();
    res.status(200).json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActiveSongList = async (req, res) => {
  try {
    const songs = await getDBActiveSongList();
    res.status(200).json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSongHistory = async (req, res) => {
  try {
    const songs = await getDBSongHistory();
    res.status(200).json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderSongList = async (req, res) => {
  try {
    const songs = await getDBOrderSongList();
    res.status(200).json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSongById = async (req, res) => {
  const { id } = req.params;
  try {
    const song = await getDBSongById(id);
    res.status(200).json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSong = async (req, res) => {
  const { title, artist } = req.body;
  if (!title || !artist) {
    throw createError(400, "歌曲名稱或歌手名稱不得為空！");
  }
  try {
    const newSong = await createDBSong(title, artist);
    res.status(201).json(newSong);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrderSong = async (req, res) => {
  const { title } = req.body;
  if (!title) {
    throw createError(400, "要打歌名啊！孩紙！");
  }
  try {
    const newSong = await createDBOrderSong(title);
    res.status(201).json(newSong);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSong = async (req, res) => {
  const { id } = req.params;
  const { title, artist } = req.body;
  try {
    const status = await updateDBSong(id, title, artist);
    if (status === 0) {
      throw createError(404, "找不到歌曲！");
    } else {
      res.status(200).json({ message: "歌曲更新成功！" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSong = async (req, res) => {
  const { id } = req.params;
  try {
    const status = await deleteDBSong(id);
    if (status === 0) {
      throw createError(404, "找不到歌曲！");
    } else {
      res.status(200).json({ message: "歌曲已歸檔！" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAllSongs = async (req, res) => {
  try {
    const status = await deleteDBAllSongs();
    if (status === 0) {
      throw createError(404, "沒有歌曲可以刪除！");
    } else {
      res.status(200).json({ message: "歌曲已歸檔！" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const hardDeleteSong = async (req, res) => {
  const { id } = req.params;
  try {
    const status = await hardDeleteDBSong(id);
    if (status === 0) {
      throw createError(404, "找不到歌曲！");
    } else {
      res.status(200).json({ message: "歌曲永久刪除成功！" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const hardDeleteAllSongs = async (req, res) => {
  try {
    const status = await hardDeleteDBAllSongs();
    if (status === 0) {
      throw createError(404, "沒有歌曲可以刪除！");
    } else {
      res.status(200).json({ message: "所有歌曲永久刪除成功！" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const restoreSong = async (req, res) => {
  const { id } = req.params;
  try {
    const status = await restoreDBSong(id);
    if (status === 0) {
      throw createError(404, "找不到歌曲！");
    } else {
      res.status(200).json({ message: "歌曲已恢復！" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSongOrder = async (req, res) => {
  const { id } = req.params;
  const { sort_order } = req.body;
  try {
    const status = await updateDBSongOrder(id, sort_order);
    if (status === 0) {
      throw createError(404, "找不到歌曲！");
    } else {
      res.status(200).json({ message: "排序更新成功！" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBatchSongOrder = async (req, res) => {
  const { songs } = req.body; // [{id, sort_order}, ...]
  try {
    if (!songs || !Array.isArray(songs)) {
      throw createError(400, "請提供歌曲排序陣列！");
    }
    const count = await updateDBBatchSongOrder(songs);
    res.status(200).json({ message: `已更新 ${count} 首歌曲的排序！` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOrderSong = async (req, res) => {
  const { id } = req.params;
  try {
    const status = await deleteDBOrderSong(id);
    if (status === 0) {
      throw createError(404, "找不到歌曲！");
    } else {
      res.status(200).json({ message: "歌曲刪除成功！" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAllOrderSongs = async (req, res) => {
  try {
    const status = await deleteDBOrderAllSongs();
    if (status === 0) {
      throw createError(404, "沒有歌曲可以刪除！");
    } else {
      res.status(200).json({ message: "歌曲刪除成功！" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const stopNowPlaying = async (req, res) => {
  const { id } = req.params;
  try {
    const status = await updateDBNowPlaying(id, 0); // 将特定id的歌曲的now_playing更改为0
    if (status === 0) {
      throw createError(404, "找不到歌曲或歌曲不在播放中！");
    } else {
      res.status(200).json({ message: "歌曲已停止播放！" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNowPlaying = async (req, res) => {
  const { id } = req.params;
  try {
    const status = await updateDBNowPlaying(id);
    if (status === 0) {
      throw createError(404, "找不到歌曲！");
    } else {
      res.status(200).json({ message: "歌曲開始播放！" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
