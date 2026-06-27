import mongoose from "mongoose";

const retryDelayMs = Number(process.env.MONGO_RETRY_DELAY_MS || 5000);
const serverSelectionTimeoutMs = Number(
  process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 5000
);

let connectionInFlight = false;

const scheduleReconnect = () => {
  setTimeout(() => {
    void connectDB();
  }, retryDelayMs);
};

export const getDatabaseState = () => mongoose.connection.readyState;

export const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    console.error("MONGO_URL is not set");
    return;
  }

  if (connectionInFlight || mongoose.connection.readyState === 1) {
    return;
  }

  connectionInFlight = true;

  try {
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: serverSelectionTimeoutMs,
    });
    console.log("DB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    scheduleReconnect();
  } finally {
    connectionInFlight = false;
  }
};
