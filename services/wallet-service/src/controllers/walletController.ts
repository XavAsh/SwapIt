import { Request, Response } from "express";
import { pool } from "../index";
import { AppError } from "../../shared/middleware/errorHandler";
import { Logger } from "../../shared/utils/logger";
import { publishEvent } from "../utils/rabbitmq";

const logger = new Logger("WalletController");

export const getWallet = async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [userId]);

  if (result.rows.length === 0) {
    // Create wallet if it doesn't exist
    const createResult = await pool.query(
      `INSERT INTO wallets (user_id, balance) VALUES ($1, 0) RETURNING *`,
      [userId]
    );
    return res.json({
      success: true,
      data: createResult.rows[0],
    });
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
};

export const creditWallet = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { amount, description } = req.body;

  if (!amount || amount <= 0) {
    throw new AppError("amount must be greater than 0", 400);
  }

  // Get or create wallet
  let wallet = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [userId]);
  if (wallet.rows.length === 0) {
    await pool.query("INSERT INTO wallets (user_id, balance) VALUES ($1, 0)", [userId]);
    wallet = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [userId]);
  }

  // Update balance
  const updateResult = await pool.query(
    `UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *`,
    [amount, userId]
  );

  // Create transaction record
  const transactionResult = await pool.query(
    `INSERT INTO wallet_transactions (wallet_id, amount, type, description)
     VALUES ($1, $2, 'credit', $3)
     RETURNING *`,
    [updateResult.rows[0].id, amount, description || "Wallet credit"]
  );

  publishEvent("WalletCredited", {
    userId,
    amount,
    newBalance: updateResult.rows[0].balance,
    transactionId: transactionResult.rows[0].id,
    timestamp: new Date(),
  }).catch((err) => logger.error("Failed to publish WalletCredited event", err));

  res.json({
    success: true,
    data: {
      wallet: updateResult.rows[0],
      transaction: transactionResult.rows[0],
    },
  });
};

export const debitWallet = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { amount, description } = req.body;

  if (!amount || amount <= 0) {
    throw new AppError("amount must be greater than 0", 400);
  }

  // Get wallet
  const wallet = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [userId]);
  if (wallet.rows.length === 0) {
    throw new AppError("Wallet not found", 404);
  }

  if (parseFloat(wallet.rows[0].balance) < amount) {
    throw new AppError("Insufficient balance", 400);
  }

  // Update balance
  const updateResult = await pool.query(
    `UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *`,
    [amount, userId]
  );

  // Create transaction record
  const transactionResult = await pool.query(
    `INSERT INTO wallet_transactions (wallet_id, amount, type, description)
     VALUES ($1, $2, 'debit', $3)
     RETURNING *`,
    [updateResult.rows[0].id, amount, description || "Wallet debit"]
  );

  publishEvent("WalletDebited", {
    userId,
    amount,
    newBalance: updateResult.rows[0].balance,
    transactionId: transactionResult.rows[0].id,
    timestamp: new Date(),
  }).catch((err) => logger.error("Failed to publish WalletDebited event", err));

  res.json({
    success: true,
    data: {
      wallet: updateResult.rows[0],
      transaction: transactionResult.rows[0],
    },
  });
};

export const getTransactions = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const result = await pool.query(
    `SELECT wt.* FROM wallet_transactions wt
     JOIN wallets w ON wt.wallet_id = w.id
     WHERE w.user_id = $1
     ORDER BY wt.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  res.json({
    success: true,
    data: result.rows,
    count: result.rows.length,
  });
};

