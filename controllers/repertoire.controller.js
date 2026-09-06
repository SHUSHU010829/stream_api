import {
  getDBCategories,
  createDBCategory,
  updateDBCategory,
  deleteDBCategory,
  getDBRepertoireList,
  createDBRepertoire,
  updateDBRepertoire,
  deleteDBRepertoire,
  importDBRepertoire,
} from "../models/repertoire.model.js";

// ---- 分類 ----

export const getCategories = async (req, res) => {
  try {
    const categories = await getDBCategories();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCategory = async (req, res) => {
  const { dimension, slug, label, sort_order } = req.body;
  if (!dimension || !slug || !label) {
    return res
      .status(400)
      .json({ message: "請提供 dimension、slug、label！" });
  }
  try {
    const category = await createDBCategory({
      dimension,
      slug,
      label,
      sort_order,
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { label, slug, sort_order } = req.body;
  const updates = {};
  if (label !== undefined) updates.label = label;
  if (slug !== undefined) updates.slug = slug;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "沒有可更新的欄位！" });
  }

  try {
    const count = await updateDBCategory(id, updates);
    if (count === 0) {
      return res.status(404).json({ message: "找不到分類！" });
    }
    res.status(200).json({ message: "分類更新成功！" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const count = await deleteDBCategory(id);
    if (count === 0) {
      return res.status(404).json({ message: "找不到分類！" });
    }
    res.status(200).json({ message: "分類刪除成功！" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- 曲庫 ----

export const getRepertoireList = async (req, res) => {
  const includeAll = req.query.status === "all";
  try {
    const list = await getDBRepertoireList({ includeAll });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createRepertoire = async (req, res) => {
  const { song_title, singer, note, category_ids } = req.body;
  if (!song_title) {
    return res.status(400).json({ message: "請提供歌曲名稱！" });
  }
  try {
    const song = await createDBRepertoire({
      song_title,
      singer,
      note,
      category_ids,
    });
    res.status(201).json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRepertoire = async (req, res) => {
  const { id } = req.params;
  const { song_title, singer, note, status, sort_order, category_ids } =
    req.body;
  const updates = {};
  if (song_title !== undefined) updates.song_title = song_title;
  if (singer !== undefined) updates.singer = singer;
  if (note !== undefined) updates.note = note;
  if (status !== undefined) updates.status = status;
  if (sort_order !== undefined) updates.sort_order = sort_order;
  if (category_ids !== undefined) updates.category_ids = category_ids;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "沒有可更新的欄位！" });
  }

  try {
    const count = await updateDBRepertoire(id, updates);
    if (count === 0) {
      return res.status(404).json({ message: "找不到歌曲！" });
    }
    res.status(200).json({ message: "曲庫更新成功！" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRepertoire = async (req, res) => {
  const { id } = req.params;
  try {
    const count = await deleteDBRepertoire(id);
    if (count === 0) {
      return res.status(404).json({ message: "找不到歌曲！" });
    }
    res.status(200).json({ message: "歌曲已下架！" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const importRepertoire = async (req, res) => {
  const { songs } = req.body;
  if (!songs || !Array.isArray(songs) || songs.length === 0) {
    return res.status(400).json({ message: "請提供歌曲陣列！" });
  }
  if (songs.some((s) => !s.song_title)) {
    return res.status(400).json({ message: "每首歌都必須有 song_title！" });
  }
  try {
    const created = await importDBRepertoire(songs);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
