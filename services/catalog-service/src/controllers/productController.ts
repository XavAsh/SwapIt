import { Request, Response } from "express";
import { pool } from "../index";
import { AppError } from "../../shared/middleware/errorHandler";
import { Logger } from "../../shared/utils/logger";
import { publishEvent } from "../utils/rabbitmq";

const logger = new Logger("ProductController");

export const createProduct = async (req: Request, res: Response) => {
  const { userId, title, description, price, category, size, condition, images, location } = req.body;

  if (!userId || !title || !price || !category) {
    throw new AppError("userId, title, price, and category are required", 400);
  }

  const result = await pool.query(
    `INSERT INTO products (user_id, title, description, price, category, size, condition, images, location)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [userId, title, description || null, price, category, size || null, condition || "good", images || [], location || null]
  );

  const product = result.rows[0];

  // Publish event
  await publishEvent("ItemCreated", {
    productId: product.id,
    userId: product.user_id,
    title: product.title,
    description: product.description,
    category: product.category,
    price: parseFloat(product.price),
    timestamp: new Date(),
  });

  logger.info(`Product created: ${product.id}`);

  res.status(201).json({
    success: true,
    data: product,
  });
};

export const getProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    throw new AppError("Product not found", 404);
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
};

export const getProducts = async (req: Request, res: Response) => {
  const { category, minPrice, maxPrice, status } = req.query;
  let query = "SELECT * FROM products WHERE 1=1";
  const params: any[] = [];
  let paramCount = 1;

  if (category) {
    query += ` AND category = $${paramCount++}`;
    params.push(category);
  }
  if (minPrice) {
    query += ` AND price >= $${paramCount++}`;
    params.push(minPrice);
  }
  if (maxPrice) {
    query += ` AND price <= $${paramCount++}`;
    params.push(maxPrice);
  }
  if (status) {
    query += ` AND status = $${paramCount++}`;
    params.push(status);
  }

  query += " ORDER BY created_at DESC LIMIT 50";

  const result = await pool.query(query, params);

  res.json({
    success: true,
    data: result.rows,
    count: result.rows.length,
  });
};

export const getProductsByUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await pool.query("SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC", [userId]);

  res.json({
    success: true,
    data: result.rows,
  });
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const allowedFields = ["title", "description", "price", "category", "size", "condition", "images", "location", "status"];
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = $${paramCount++}`);
      values.push(updates[key]);
    }
  });

  if (updateFields.length === 0) {
    throw new AppError("No valid fields to update", 400);
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(`UPDATE products SET ${updateFields.join(", ")} WHERE id = $${paramCount} RETURNING *`, values);

  if (result.rows.length === 0) {
    throw new AppError("Product not found", 404);
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id", [id]);

  if (result.rows.length === 0) {
    throw new AppError("Product not found", 404);
  }

  res.json({
    success: true,
    message: "Product deleted",
  });
};
