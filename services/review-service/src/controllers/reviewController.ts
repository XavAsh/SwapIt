import { Request, Response } from "express";
import { pool } from "../index";
import { AppError } from "../../shared/middleware/errorHandler";
import { Logger } from "../../shared/utils/logger";
import { publishEvent } from "../utils/rabbitmq";

const logger = new Logger("ReviewController");

export const createReview = async (req: Request, res: Response) => {
  const { reviewerId, revieweeId, orderId, rating, comment } = req.body;

  if (!reviewerId || !revieweeId || !orderId || !rating) {
    throw new AppError("reviewerId, revieweeId, orderId, and rating are required", 400);
  }

  if (rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  // Check if review already exists for this order
  const existingReview = await pool.query(
    "SELECT id FROM reviews WHERE order_id = $1 AND reviewer_id = $2",
    [orderId, reviewerId]
  );

  if (existingReview.rows.length > 0) {
    throw new AppError("Review already exists for this order", 409);
  }

  const result = await pool.query(
    `INSERT INTO reviews (reviewer_id, reviewee_id, order_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [reviewerId, revieweeId, orderId, rating, comment || null]
  );

  const review = result.rows[0];

  // Calculate average rating for reviewee
  const avgResult = await pool.query(
    "SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE reviewee_id = $1",
    [revieweeId]
  );

  const avgRating = parseFloat(avgResult.rows[0].avg_rating || "0");
  const totalReviews = parseInt(avgResult.rows[0].total_reviews || "0");

  // Publish event
  publishEvent("ReviewCreated", {
    reviewId: review.id,
    reviewerId: review.reviewer_id,
    revieweeId: review.reviewee_id,
    orderId: review.order_id,
    rating: review.rating,
    avgRating,
    totalReviews,
    timestamp: new Date(),
  }).catch((err) => logger.error("Failed to publish ReviewCreated event", err));

  logger.info(`Review created: ${review.id}`);

  res.status(201).json({
    success: true,
    data: {
      ...review,
      avgRating,
      totalReviews,
    },
  });
};

export const getReviewsByUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await pool.query(
    `SELECT r.*, u.username as reviewer_username, u.avatar as reviewer_avatar
     FROM reviews r
     JOIN users u ON r.reviewer_id = u.id
     WHERE r.reviewee_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );

  // Get average rating
  const avgResult = await pool.query(
    "SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE reviewee_id = $1",
    [userId]
  );

  const avgRating = parseFloat(avgResult.rows[0]?.avg_rating || "0");
  const totalReviews = parseInt(avgResult.rows[0]?.total_reviews || "0");

  res.json({
    success: true,
    data: result.rows,
    avgRating,
    totalReviews,
  });
};

export const getReviewsByProduct = async (req: Request, res: Response) => {
  const { productId } = req.params;

  // Get reviews through orders
  const result = await pool.query(
    `SELECT r.*, u.username as reviewer_username, u.avatar as reviewer_avatar, o.product_id
     FROM reviews r
     JOIN orders o ON r.order_id = o.id
     JOIN users u ON r.reviewer_id = u.id
     WHERE o.product_id = $1
     ORDER BY r.created_at DESC`,
    [productId]
  );

  res.json({
    success: true,
    data: result.rows,
  });
};

export const getReview = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query("SELECT * FROM reviews WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    throw new AppError("Review not found", 404);
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
};

