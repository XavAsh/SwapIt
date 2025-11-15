import * as amqp from "amqplib";
import { Logger } from "../../shared/utils/logger";

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

    logger.info("Connected to RabbitMQ");
    return { connection, channel };
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ", error);
    throw error;
  }
};

export const publishEvent = async (eventType: string, data: any) => {
  if (!channel) {
    logger.warn("RabbitMQ channel not initialized, skipping event");
    return;
  }

  try {
    const exchange = "swapit_events";
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("RabbitMQ publish timeout")), 2000)
    );
    
    await Promise.race([
      (async () => {
        await channel!.assertExchange(exchange, "topic", { durable: true });
        await channel!.publish(exchange, eventType, Buffer.from(JSON.stringify({ type: eventType, ...data })));
        logger.info(`Published event: ${eventType}`);
      })(),
      timeoutPromise
    ]);
  } catch (error) {
    logger.error(`Failed to publish event ${eventType}`, error);
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

