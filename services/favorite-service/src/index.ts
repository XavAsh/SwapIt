import express from "express";
import dotenv from "dotenv";
import { Pool } from "pg";
import { errorHandler } from "../shared/middleware/errorHandler";
import { Logger } from "../shared/utils/logger";
import favoriteRoutes from "./routes/favoriteRoutes";
import { initRabbitMQ } from "./utils/rabbitmq";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;
const logger = new Logger("FavoriteService");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        product_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);
    logger.info("Database schema initialized");
  } catch (error) {
    logger.error("Failed to initialize database", error);
  }
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "favorite-service" });
});

app.use("/", favoriteRoutes);

app.use(errorHandler);

const start = async () => {
  try {
    const dbReady = await connectWithRetry();
    if (!dbReady) {
      throw new Error("Failed to connect to database after retries");
    }

    await initDatabase();

    try {
      await initRabbitMQ();
    } catch (error) {
      logger.warn("RabbitMQ not available, continuing without it", error);
    }

    app.listen(PORT, () => {
      logger.info(`Favorite Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start service", error);
    process.exit(1);
  }
};

start();

