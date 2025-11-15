import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { messagesCollection, conversationsCollection, io } from "../index";
import { AppError } from "../../shared/middleware/errorHandler";
import { Logger } from "../../shared/utils/logger";
import { publishEvent } from "../utils/rabbitmq";

const logger = new Logger("MessageController");

export const createConversation = async (req: Request, res: Response) => {
  const { participant1Id, participant2Id, productId } = req.body;

  if (!participant1Id || !participant2Id) {
    throw new AppError("participant1Id and participant2Id are required", 400);
  }

  // Check if conversation already exists
  const existing = await conversationsCollection.findOne({
    $or: [
      { participant1Id, participant2Id },
      { participant1Id: participant2Id, participant2Id: participant1Id },
    ],
  });

  if (existing) {
    return res.json({
      success: true,
      data: existing,
    });
  }

  const conversation: any = {
    participant1Id,
    participant2Id,
    productId: productId || null,
    lastMessageAt: new Date(),
    createdAt: new Date(),
  };

  const result = await conversationsCollection.insertOne(conversation);
  conversation._id = result.insertedId;

  res.status(201).json({
    success: true,
    data: conversation,
  });
};

export const getConversations = async (req: Request, res: Response) => {
  const { userId } = req.params;

  const conversations = await conversationsCollection
    .find({
      $or: [{ participant1Id: userId }, { participant2Id: userId }],
    })
    .sort({ lastMessageAt: -1 })
    .toArray();

  res.json({
    success: true,
    data: conversations,
  });
};

export const getMessages = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { limit = 50, before } = req.query;

  const query: any = { conversationId };
  if (before) {
    query.createdAt = { $lt: new Date(before as string) };
  }

  const messages = await messagesCollection.find(query).sort({ createdAt: -1 }).limit(Number(limit)).toArray();

  res.json({
    success: true,
    data: messages.reverse(),
  });
};

export const sendMessage = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { senderId, receiverId, content } = req.body;

  if (!senderId || !receiverId || !content) {
    throw new AppError("senderId, receiverId, and content are required", 400);
  }

  // Verify conversation exists
  const conversation = await conversationsCollection.findOne({
    _id: new ObjectId(conversationId),
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const message: any = {
    conversationId,
    senderId,
    receiverId,
    content,
    read: false,
    createdAt: new Date(),
  };

  const result = await messagesCollection.insertOne(message);
  message._id = result.insertedId;

  // Update conversation last message time
  await conversationsCollection.updateOne({ _id: new ObjectId(conversationId) }, { $set: { lastMessageAt: new Date() } });

  // Emit via Socket.IO
  io.to(conversationId).emit("new-message", message);

  // Publish event
  await publishEvent("MessageSent", {
    messageId: message._id.toString(),
    senderId,
    receiverId,
    content,
    timestamp: new Date(),
  });

  logger.info(`Message sent: ${message._id}`);

  res.status(201).json({
    success: true,
    data: message,
  });
};

export const markAsRead = async (req: Request, res: Response) => {
  const { messageId } = req.params;

  const result = await messagesCollection.updateOne({ _id: new ObjectId(messageId) }, { $set: { read: true } });

  if (result.matchedCount === 0) {
    throw new AppError("Message not found", 404);
  }

  res.json({
    success: true,
    message: "Message marked as read",
  });
};
