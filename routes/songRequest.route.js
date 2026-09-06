import express from "express";
const router = express.Router();

import { requireAdmin, requireClient } from "../middleware/auth.middleware.js";
import {
  getPendingRequests,
  getMyRequests,
  approveRequest,
  rejectRequest,
  createRequest,
  getAllRequests,
  deleteRequest,
} from "../controllers/songRequest.controller.js";

router.get("/pending", requireAdmin, getPendingRequests);
router.get("/mine", requireClient, getMyRequests);

router.put("/approve/:id", requireAdmin, approveRequest);
router.put("/reject/:id", requireAdmin, rejectRequest);

router.post("/", requireClient, createRequest);
router.get("/", requireAdmin, getAllRequests);
router.delete("/:id", requireAdmin, deleteRequest);

export default router;
