import express from "express";
import dotenv from "dotenv";
import { Pool } from "pg";
import { errorHandler } from "../shared/middleware/errorHandler";
import { Logger } from "../shared/utils/logger";
import orderRoutes from "./routes/orderRoutes";
import { initRabbitMQ } from "./utils/rabbitmq";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
const logger = new Logger("TransactionService");

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
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID NOT NULL,
        seller_id UUID NOT NULL,
        product_id UUID NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
        payment_intent_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  res.json({ status: "ok", service: "transaction-service" });
});

app.use("/", orderRoutes);

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
      logger.info(`Transaction Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start service", error);
    process.exit(1);
  }
};

start();
