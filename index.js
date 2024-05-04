import express from "express";
import bodyParser from "body-parser";
import colors from "colors";
import createError from "http-errors";
import dotenv from "dotenv";
import cors from "cors";
import WebSocket from "ws";
import http from "http";
dotenv.config();

import songListRoutes from "./routes/songList.route.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket 服务器逻辑
wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
  });

  // 示例：定时发送消息
  setInterval(() => {
    const data = JSON.stringify({
      type: "update",
      message: "New data available",
    });
    ws.send(data);
  }, 1000); // 每秒发送一次更新消息
});

// Middleware
app.use((req, res, next) => {
  next();
}, cors({ maxAge: 84600 }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.use("/songList", songListRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.log(err.stack.red);
  res.status(500).send("[ERROR] Something broke!");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`[INFO] Server is start running`.blue));
