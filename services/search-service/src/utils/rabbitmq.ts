import * as amqp from "amqplib";
import { Logger } from "../../shared/utils/logger";
import { esClient } from "../index";

const logger = new Logger("RabbitMQ");
let connection: any = null;
let channel: amqp.Channel | null = null;

export const initRabbitMQ = async () => {
  try {
    const url = process.env.RABBITMQ_URL || "amqp://swapit:swapit123@rabbitmq:5672";
    connection = await amqp.connect(url);
    if (!connection) {
      throw new Error("Failed to establish RabbitMQ connection");
    }
    channel = await connection.createChannel();
    if (!channel) {
      throw new Error("Failed to create RabbitMQ channel");
    }

    const exchange = "swapit_events";
    await channel.assertExchange(exchange, "topic", { durable: true });

    const queue = await channel.assertQueue("search_service_queue", { durable: true });
    await channel.bindQueue(queue.queue, exchange, "ItemCreated");

    if (!channel) {
      throw new Error("Channel not initialized");
    }

    channel.consume(queue.queue, async (msg) => {
      if (msg && channel) {
        try {
          const event = JSON.parse(msg.content.toString());

          if (event.type === "ItemCreated") {
            await esClient.index({
              index: "products",
              id: event.productId,
              body: {
                id: event.productId,
                userId: event.userId,
                title: event.title,
                description: event.description,
                category: event.category,
                price: event.price,
                createdAt: new Date(event.timestamp),
              },
            });
            logger.info(`Indexed product: ${event.productId}`);
          }

          channel.ack(msg);
        } catch (error) {
          logger.error("Error processing message", error);
          if (channel) {
            channel.nack(msg, false, true);
          }
        }
      }
    });

    logger.info("Connected to RabbitMQ and listening for events");
    return { connection, channel };
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ", error);
    throw error;
  }
};

process.on("SIGINT", async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (error) {
    logger.error("Error closing RabbitMQ connection", error);
  }
  process.exit(0);
});
