const router = express.Router();
import express from "express";

import {
  getAllMsg,
  createMsg,
} from "../controllers/messageBoard.controller.js";

router.get("/", getAllMsg);

router.post("/", createMsg);

export default router;
