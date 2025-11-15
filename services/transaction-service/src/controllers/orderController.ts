import { Request, Response } from "express";
import axios from "axios";
import { pool } from "../index";
import { AppError } from "../../shared/middleware/errorHandler";
import { Logger } from "../../shared/utils/logger";
import { publishEvent } from "../utils/rabbitmq";

const logger = new Logger("OrderController");
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || "http://catalog-service:3002";

export const createOrder = async (req: Request, res: Response) => {
  const { buyerId, sellerId, productId, amount } = req.body;

  if (!buyerId || !sellerId || !productId || !amount) {
    throw new AppError("buyerId, sellerId, productId, and amount are required", 400);
  }

  // Verify product exists and is available
  try {
    const productResponse = await axios.get(`${CATALOG_SERVICE_URL}/${productId}`);
    const product = productResponse.data.data;

    if (product.status !== "available") {
      throw new AppError("Product is not available", 400);
    }

    // Handle both snake_case (user_id) and camelCase (userId) from database
    const productUserId = product.user_id || product.userId;
    if (productUserId !== sellerId) {
      throw new AppError("Product does not belong to seller", 400);
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new AppError("Product not found", 404);
    }
    throw error;
  }

  const result = await pool.query(
    `INSERT INTO orders (buyer_id, seller_id, product_id, amount, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [buyerId, sellerId, productId, amount]
  );

  const order = result.rows[0];

  // Update product status to reserved
  try {
    await axios.put(`${CATALOG_SERVICE_URL}/${productId}`, { status: "reserved" });
  } catch (error) {
    logger.warn("Failed to update product status", error);
  }

  // Publish event
  await publishEvent("OrderPlaced", {
    orderId: order.id,
    buyerId: order.buyer_id,
    sellerId: order.seller_id,
    productId: order.product_id,
    amount: parseFloat(order.amount),
    timestamp: new Date(),
  });

  logger.info(`Order created: ${order.id}`);

  res.status(201).json({
    success: true,
    data: order,
  });
};

export const getOrder = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    throw new AppError("Order not found", 404);
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
};

export const getUserOrders = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role = "buyer" } = req.query;

  const column = role === "seller" ? "seller_id" : "buyer_id";
  const result = await pool.query(`SELECT * FROM orders WHERE ${column} = $1 ORDER BY created_at DESC`, [userId]);

  res.json({
    success: true,
    data: result.rows,
  });
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError("status is required", 400);
  }

  const validStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const result = await pool.query(`UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`, [status, id]);

  if (result.rows.length === 0) {
    throw new AppError("Order not found", 404);
  }

  const order = result.rows[0];

  // If order is cancelled, make product available again
  if (status === "cancelled") {
    try {
      await axios.put(`${CATALOG_SERVICE_URL}/${order.product_id}`, { status: "available" });
    } catch (error) {
      logger.warn("Failed to update product status", error);
    }
  }

  // If order is delivered, mark product as sold
  if (status === "delivered") {
    try {
      await axios.put(`${CATALOG_SERVICE_URL}/${order.product_id}`, { status: "sold" });
    } catch (error) {
      logger.warn("Failed to update product status", error);
    }
  }

  res.json({
    success: true,
    data: order,
  });
};

export const processPayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentIntentId } = req.body;

  // In a real implementation, this would integrate with Stripe
  // For the prototype, we'll just simulate payment processing
  const result = await pool.query(`UPDATE orders SET status = 'paid', payment_intent_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`, [
    paymentIntentId || `mock_payment_${Date.now()}`,
    id,
  ]);

  if (result.rows.length === 0) {
    throw new AppError("Order not found", 404);
  }

  const order = result.rows[0];

  logger.info(`Payment processed for order: ${order.id}`);

  res.json({
    success: true,
    data: order,
    message: "Payment processed successfully",
  });
};
