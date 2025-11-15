import express from "express";
import dotenv from "dotenv";
import { Pool } from "pg";
import { errorHandler, asyncHandler } from "../shared/middleware/errorHandler";
import { Logger } from "../shared/utils/logger";
import userRoutes from "./routes/userRoutes";
import { initRabbitMQ } from "./utils/rabbitmq";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const logger = new Logger("UserService");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Database connection with retry logic
const connectWithRetry = async (retries = 15, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1");
      logger.info("Database is ready");
      return true;
    } catch (error: any) {
      logger.warn(`Database connection attempt ${i + 1}/${retries} failed: ${error.message || error}, retrying...`);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};

pool.on("connect", () => {
  logger.info("Connected to PostgreSQL");
});

pool.on("error", (err) => {
  logger.error("PostgreSQL connection error", err);
});

// Initialize database schema
const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        avatar TEXT,
        bio TEXT,
        preferences JSONB,
        address JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info("Database schema initialized");
  } catch (error) {
    logger.error("Failed to initialize database", error);
  }
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "user-service" });
});

app.use("/", userRoutes);

// Error handling
app.use(errorHandler);

// Initialize services
const start = async () => {
  try {
    // Wait for database to be ready
    const dbReady = await connectWithRetry();
    if (!dbReady) {
      throw new Error("Failed to connect to database after retries");
    }

    await initDatabase();

    // RabbitMQ connection with retry
    try {
      await initRabbitMQ();
    } catch (error) {
      logger.warn("RabbitMQ not available, continuing without it", error);
    }

    app.listen(PORT, () => {
      logger.info(`User Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start service", error);
    process.exit(1);
  }
};

start();
