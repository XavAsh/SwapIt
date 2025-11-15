import express from "express";
import dotenv from "dotenv";
import { Client } from "@elastic/elasticsearch";
import { errorHandler } from "../shared/middleware/errorHandler";
import { Logger } from "../shared/utils/logger";
import searchRoutes from "./routes/searchRoutes";
import { initRabbitMQ } from "./utils/rabbitmq";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const logger = new Logger("SearchService");

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://elasticsearch:9200",
});

const initElasticsearch = async (retries = 10, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await esClient.ping();
      const indexExists = await esClient.indices.exists({ index: "products" });

      if (!indexExists) {
        await esClient.indices.create({
          index: "products",
          body: {
            mappings: {
              properties: {
                id: { type: "keyword" },
                userId: { type: "keyword" },
                title: { type: "text", analyzer: "standard" },
                description: { type: "text", analyzer: "standard" },
                price: { type: "float" },
                category: { type: "keyword" },
                size: { type: "keyword" },
                condition: { type: "keyword" },
                location: { type: "keyword" },
                status: { type: "keyword" },
                createdAt: { type: "date" },
              },
            },
          },
        });
        logger.info("Elasticsearch index created");
      }
      return;
    } catch (error) {
      logger.warn(`Elasticsearch connection attempt ${i + 1}/${retries} failed, retrying...`);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error("Failed to initialize Elasticsearch after retries", error);
      }
    }
  }
};

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "search-service" });
});

app.use("/", searchRoutes);

app.use(errorHandler);

const start = async () => {
  try {
    await initElasticsearch();

    try {
      await initRabbitMQ();
    } catch (error) {
      logger.warn("RabbitMQ not available, continuing without it", error);
    }

    app.listen(PORT, () => {
      logger.info(`Search Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start service", error);
    process.exit(1);
  }
};

start();
