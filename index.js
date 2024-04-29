import express from "express";
import bodyParser from "body-parser";
import colors from "colors";
import dotenv from "dotenv";
import createError from "http-errors";
dotenv.config();
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.get("/", (req, res) => {
  res.send("Hello!");
});

// app.use("/api/messageBoard", messageBoardRoutes);

// catch 404 and forward to error handler
app.use(function (next) {
  next(createError(404));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`[INFO] Server is start running`.blue));
