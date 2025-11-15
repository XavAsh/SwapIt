import { Request, Response } from "express";
import { pool } from "../index";
import { AppError } from "../../shared/middleware/errorHandler";
import { Logger } from "../../shared/utils/logger";
import { publishEvent } from "../utils/rabbitmq";

const logger = new Logger("FavoriteController");

export const addFavorite = async (req: Request, res: Response) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    throw new AppError("userId and productId are required", 400);
  }

  // Check if favorite already exists
  const existing = await pool.query(
    "SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2",
    [userId, productId]
  );

  if (existing.rows.length > 0) {
    throw new AppError("Product already in favorites", 409);
  }

  const result = await pool.query(
    `INSERT INTO favorites (user_id, product_id)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, productId]
  );

  const favorite = result.rows[0];

  publishEvent("FavoriteAdded", {
    favoriteId: favorite.id,
    userId: favorite.user_id,
    productId: favorite.product_id,
    timestamp: new Date(),
  }).catch((err) => logger.error("Failed to publish FavoriteAdded event", err));

  logger.info(`Favorite added: ${favorite.id}`);

  res.status(201).json({
    success: true,
    data: favorite,
  });
};

export const removeFavorite = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query("SELECT * FROM favorites WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    throw new AppError("Favorite not found", 404);
  }

  const favorite = result.rows[0];

  await pool.query("DELETE FROM favorites WHERE id = $1", [id]);

  publishEvent("FavoriteRemoved", {
    favoriteId: favorite.id,
    userId: favorite.user_id,
    productId: favorite.product_id,
    timestamp: new Date(),
  }).catch((err) => logger.error("Failed to publish FavoriteRemoved event", err));

  logger.info(`Favorite removed: ${favorite.id}`);

  res.json({
    success: true,
    message: "Favorite removed",
  });
};

export const getUserFavorites = async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await pool.query(
    `SELECT f.*, p.title, p.price, p.category, p.images, p.status
     FROM favorites f
     JOIN products p ON f.product_id = p.id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );

  res.json({
    success: true,
    data: result.rows,
    count: result.rows.length,
  });
};

export const checkFavorite = async (req: Request, res: Response) => {
  const { userId, productId } = req.query;

  if (!userId || !productId) {
    throw new AppError("userId and productId are required", 400);
  }

  const result = await pool.query(
    "SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2",
    [userId, productId]
  );

  res.json({
    success: true,
    isFavorite: result.rows.length > 0,
    favoriteId: result.rows[0]?.id || null,
  });
};

