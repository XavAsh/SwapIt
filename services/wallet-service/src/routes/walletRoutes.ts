import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/errorHandler";
import * as walletController from "../controllers/walletController";

const router = Router();

router.get("/:userId", asyncHandler(walletController.getWallet));
router.post("/:userId/credit", asyncHandler(walletController.creditWallet));
router.post("/:userId/debit", asyncHandler(walletController.debitWallet));
router.get("/:userId/transactions", asyncHandler(walletController.getTransactions));

export default router;

