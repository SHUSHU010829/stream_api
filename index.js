import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

import colors from 'colors';
import productsRoutes from './routes/product.route.js';
import messageBoardRoutes from './routes/messageBoard.route.js';
import dotenv from 'dotenv';
import createError from 'http-errors';
dotenv.config();
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use('/api/products', productsRoutes);
app.use('/api/messageBoard', messageBoardRoutes);
app.get('/', (req, res) => {
    res.send('Hello from Homepage')
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("[INFO] MongoDB Atlas is connected".blue))
  .catch(err => console.log(`[INFO] MongoDB Atlas is connected failed: ${err}`.red));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`[INFO] Server is start running`.blue))