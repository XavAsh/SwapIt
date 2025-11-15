import * as amqp from "amqplib";
import { Logger } from "../../shared/utils/logger";
import { sendEmail } from "./emailService";

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

    // Subscribe to events
    const queue = await channel.assertQueue("notification_service_queue", { durable: true });
    await channel.bindQueue(queue.queue, exchange, "UserRegistered");
    await channel.bindQueue(queue.queue, exchange, "OrderPlaced");
    await channel.bindQueue(queue.queue, exchange, "MessageSent");

    if (!channel) {
      throw new Error("Channel not initialized");
    }

    channel.consume(queue.queue, async (msg) => {
      if (msg && channel) {
        try {
          const event = JSON.parse(msg.content.toString());

          if (event.type === "UserRegistered") {
            await sendEmail(event.email, "Welcome to SwapIt!", `<h1>Welcome to SwapIt!</h1><p>Hi ${event.username}, thank you for joining SwapIt!</p>`);
          } else if (event.type === "OrderPlaced") {
            await sendEmail(
              `seller-${event.sellerId}@example.com`, // In production, fetch from user service
              "New Order Received",
              `<h1>New Order!</h1><p>You have received a new order for ${event.amount}€</p>`
            );
          } else if (event.type === "MessageSent") {
            await sendEmail(
              `user-${event.receiverId}@example.com`, // In production, fetch from user service
              "New Message on SwapIt",
              `<h1>New Message</h1><p>You have received a new message: ${event.content.substring(0, 50)}...</p>`
            );
          }

          channel.ack(msg);
        } catch (error) {
          logger.error("Error processing notification", error);
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
