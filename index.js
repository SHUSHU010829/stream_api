import express from "express";
import bodyParser from "body-parser";
import colors from "colors";
import createError from "http-errors";
import dotenv from "dotenv";
dotenv.config();

import songListRoutes from "./routes/songList.route.js";

const app = express();

// Middleware
app.use(cors());
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
