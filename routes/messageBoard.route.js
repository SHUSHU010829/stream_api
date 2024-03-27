const router = express.Router();
import express from "express";

import { getMessageBoard, createMessageBoard, updateMessageBoard } from "../controllers/messageBoard.controller.js";

router.get("/", getMessageBoard);

router.post("/", createMessageBoard);

router.put("/:id", updateMessageBoard)

export default router;