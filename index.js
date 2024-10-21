import express from "express";
import bodyParser from "body-parser";
import colors from "colors";
import createError from "http-errors";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

import songListRoutes from "./routes/songList.route.js";
import messageBoardRoutes from "./routes/messageBoard.route.js";

const app = express();

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
app.use("/messageBoard", messageBoardRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.log(err.stack.red);
  res.status(500).send("[ERROR] Something broke!");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`[INFO] Server is start running`.blue));
