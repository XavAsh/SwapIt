import express from "express";
import dotenv from "dotenv";
import { errorHandler } from "../shared/middleware/errorHandler";
import { Logger } from "../shared/utils/logger";
import { initRabbitMQ } from "./utils/rabbitmq";
import { initEmailService } from "./utils/emailService";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;
const logger = new Logger("NotificationService");

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

app.use(errorHandler);

const start = async () => {
  try {
    await initEmailService();

    // Wait a bit for RabbitMQ to be ready
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      await initRabbitMQ();
    } catch (error) {
      logger.warn("RabbitMQ not available, continuing without it", error);
    }

    app.listen(PORT, () => {
      logger.info(`Notification Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start service", error);
    process.exit(1);
  }
};

start();
