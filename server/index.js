import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import connectDB from "./db/db.js";
import http from "http";
import cookieParser from "cookie-parser";
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import portfolioRoutes from './routes/portfolio.js';
import rentalRoutes from './routes/rentals.js';
import availabilityRoutes from './routes/availability.js';
import testimonialRoutes from './routes/testimonials.js';
import paymentRoutes from './routes/payments.js';
import analyticsRoutes from './routes/analytics.js';
import { sanitizeData } from "./middleware/sanitize.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);

app.use(
  cors({
       origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

app.use(sanitizeData);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get("/", (req, res) => {
  res.send("api backend working");
});

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to the database", err);
  });