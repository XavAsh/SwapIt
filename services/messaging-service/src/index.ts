import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { errorHandler } from "../shared/middleware/errorHandler";
import { Logger } from "../shared/utils/logger";
import messageRoutes from "./routes/messageRoutes";
import { initRabbitMQ } from "./utils/rabbitmq";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3004;
const logger = new Logger("MessagingService");

export let db: any;
export let messagesCollection: any;
export let conversationsCollection: any;

const initDatabase = async (retries = 10, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = new MongoClient(process.env.MONGODB_URL || "mongodb://swapit:swapit123@mongodb:27017/swapit?authSource=admin");
      await client.connect();
      db = client.db("swapit");
      messagesCollection = db.collection("messages");
      conversationsCollection = db.collection("conversations");

      // Create indexes
      await messagesCollection.createIndex({ conversationId: 1, createdAt: -1 });
      await conversationsCollection.createIndex({ participant1Id: 1, participant2Id: 1 });

      logger.info("Connected to MongoDB");
      return;
    } catch (error) {
      logger.warn(`MongoDB connection attempt ${i + 1}/${retries} failed, retrying...`);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

// Socket.IO connection handling
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
    logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on("leave-conversation", (conversationId) => {
    socket.leave(conversationId);
    logger.info(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

export { io };

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "messaging-service" });
});

app.use("/", messageRoutes);

app.use(errorHandler);

const start = async () => {
  try {
    await initDatabase();

    try {
      await initRabbitMQ();
    } catch (error) {
      logger.warn("RabbitMQ not available, continuing without it", error);
    }

    httpServer.listen(PORT, () => {
      logger.info(`Messaging Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start service", error);
    process.exit(1);
  }
};

start();
