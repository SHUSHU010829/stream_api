const router = express.Router();
import express from "express";

import { getMessageBoard, getMessageBoard, createMessageBoard, updateMessageBoard, deleteMessageBoard } from "../controllers/messageBoard.controller.js";

router.get("/", getMessageBoard);

router.get("/:id", getMessageBoard);

router.post("/", createMessageBoard);

router.put("/:id", updateMessageBoard)

router.delete("/:id", deleteMessageBoard);

export default router;