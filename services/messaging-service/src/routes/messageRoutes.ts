import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/errorHandler";
import * as messageController from "../controllers/messageController";

const router = Router();

router.post("/conversations", asyncHandler(messageController.createConversation));
router.get("/conversations/:userId", asyncHandler(messageController.getConversations));
router.get("/conversations/:conversationId/messages", asyncHandler(messageController.getMessages));
router.post("/conversations/:conversationId/messages", asyncHandler(messageController.sendMessage));
router.put("/messages/:messageId/read", asyncHandler(messageController.markAsRead));

export default router;
