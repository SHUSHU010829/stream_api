import express from "express";
const router = express.Router();

import { requireAdmin } from "../middleware/auth.middleware.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  importRepertoire,
  getRepertoireList,
  createRepertoire,
  updateRepertoire,
  deleteRepertoire,
} from "../controllers/repertoire.controller.js";

router.get("/categories", getCategories);
router.post("/categories", requireAdmin, createCategory);
router.put("/categories/:id", requireAdmin, updateCategory);
router.delete("/categories/:id", requireAdmin, deleteCategory);

router.post("/import", requireAdmin, importRepertoire);

router.get("/", getRepertoireList);
router.post("/", requireAdmin, createRepertoire);
router.put("/:id", requireAdmin, updateRepertoire);
router.delete("/:id", requireAdmin, deleteRepertoire);

export default router;
