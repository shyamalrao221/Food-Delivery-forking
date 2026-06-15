import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { connectDB, getDatabaseState } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import "dotenv/config";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

// app config
const app = express();
const port = process.env.PORT || 5000;

mongoose.connection.on("connected", () => {
  console.log("MongoDB connection is ready");
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
  void connectDB();
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB error:", error.message);
});

//middlewares
app.use(express.json());
app.use(cors());

// DB connection
connectDB();

// api endpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.get("/health", (req, res) => {
  const dbState = getDatabaseState();
  const isDatabaseReady = dbState === 1;

  res.status(isDatabaseReady ? 200 : 503).json({
    status: isDatabaseReady ? "ok" : "degraded",
    database: {
      readyState: dbState,
      connected: isDatabaseReady,
    },
  });
});

app.listen(port, () => {
  console.log(`Server Started on port: ${port}`);
});
