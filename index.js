import express from "express";
import bodyParser from "body-parser";
import colors from "colors";
import createError from "http-errors";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

import songListRoutes from "./routes/songList.route.js";
import messageBoardRoutes from "./routes/messageBoard.route.js";
import repertoireRoutes from "./routes/repertoire.route.js";
import songRequestRoutes from "./routes/songRequest.route.js";
import { requireAdmin, requireClient } from "./middleware/auth.middleware.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: (process.env.ALLOWED_ORIGINS ?? "*").split(","),
    allowedHeaders: ["Content-Type", "x-api-key"],
    maxAge: 86400,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.get("/", (req, res) => {
  res.send("Hello!");
});

// /songList、/messageBoard 的 GET（含 /songList/stream）維持不驗證，
// 只在寫入方法（非 GET）上要求對應密鑰。
app.use(
  "/songList",
  (req, res, next) => (req.method === "GET" ? next() : requireAdmin(req, res, next)),
  songListRoutes
);
app.use(
  "/messageBoard",
  (req, res, next) => (req.method === "GET" ? next() : requireClient(req, res, next)),
  messageBoardRoutes
);
app.use("/repertoire", repertoireRoutes);
app.use("/songRequest", songRequestRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.log(err.stack.red);
  res.status(500).send("[ERROR] Something broke!");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`[INFO] Server is start running`.blue));
