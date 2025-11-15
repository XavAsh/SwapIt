import { Request, Response } from "express";
import axios from "axios";
import { pool } from "../index";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../../shared/middleware/errorHandler";
import { Logger } from "../../shared/utils/logger";
import { publishEvent } from "../utils/rabbitmq";

const logger = new Logger("UserController");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL || "http://transaction-service:3005";

export const register = async (req: Request, res: Response) => {
  const { email, username, password, firstName, lastName } = req.body;

  if (!email || !username || !password) {
    throw new AppError("Email, username, and password are required", 400);
  }

  // Check if user exists
  const existingUser = await pool.query("SELECT id FROM users WHERE email = $1 OR username = $2", [email, username]);

  if (existingUser.rows.length > 0) {
    throw new AppError("User already exists", 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const result = await pool.query(
    `INSERT INTO users (email, username, password_hash, first_name, last_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, username, first_name, last_name, created_at`,
    [email, username, passwordHash, firstName || null, lastName || null]
  );

  const user = result.rows[0];

  // Publish event (non-blocking)
  publishEvent("UserRegistered", {
    userId: user.id,
    email: user.email,
    username: user.username,
    timestamp: new Date(),
  }).catch((err) => logger.error("Failed to publish UserRegistered event", err));

  logger.info(`User registered: ${user.id}`);

  res.status(201).json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  // Find user
  const result = await pool.query("SELECT id, email, username, password_hash, first_name, last_name FROM users WHERE email = $1", [email]);

  if (result.rows.length === 0) {
    throw new AppError("Invalid credentials", 401);
  }

  const user = result.rows[0];

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new AppError("Invalid credentials", 401);
  }

  // Generate JWT
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

  logger.info(`User logged in: ${user.id}`);

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    },
  });
};

export const getProfile = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(
    "SELECT id, email, username, first_name, last_name, avatar, bio, preferences, address, created_at FROM users WHERE id = $1",
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError("User not found", 404);
  }

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      avatar: user.avatar,
      bio: user.bio,
      preferences: user.preferences || {},
      address: user.address || {},
      createdAt: user.created_at,
    },
  });
};

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query("SELECT id, username, first_name, last_name, avatar, created_at FROM users WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    throw new AppError("User not found", 404);
  }

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      avatar: user.avatar,
      createdAt: user.created_at,
    },
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, avatar, bio, preferences, address } = req.body;

  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (firstName !== undefined) {
    updates.push(`first_name = $${paramCount++}`);
    values.push(firstName);
  }
  if (lastName !== undefined) {
    updates.push(`last_name = $${paramCount++}`);
    values.push(lastName);
  }
  if (avatar !== undefined) {
    updates.push(`avatar = $${paramCount++}`);
    values.push(avatar);
  }
  if (bio !== undefined) {
    updates.push(`bio = $${paramCount++}`);
    values.push(bio);
  }
  if (preferences !== undefined) {
    updates.push(`preferences = $${paramCount++}::jsonb`);
    values.push(JSON.stringify(preferences));
  }
  if (address !== undefined) {
    updates.push(`address = $${paramCount++}::jsonb`);
    values.push(JSON.stringify(address));
  }

  if (updates.length === 0) {
    throw new AppError("No fields to update", 400);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(
    `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id, email, username, first_name, last_name, avatar, bio, preferences, address`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError("User not found", 404);
  }

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      avatar: user.avatar,
      bio: user.bio,
      preferences: user.preferences || {},
      address: user.address || {},
    },
  });
};

export const getHistory = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verify user exists
  const userResult = await pool.query("SELECT id FROM users WHERE id = $1", [id]);
  if (userResult.rows.length === 0) {
    throw new AppError("User not found", 404);
  }

  try {
    // Get orders as buyer
    const buyerResponse = await axios.get(`${TRANSACTION_SERVICE_URL}/user/${id}?role=buyer`);
    const buyerOrders = buyerResponse.data.data || [];

    // Get orders as seller
    const sellerResponse = await axios.get(`${TRANSACTION_SERVICE_URL}/user/${id}?role=seller`);
    const sellerOrders = sellerResponse.data.data || [];

    res.json({
      success: true,
      data: {
        purchases: buyerOrders,
        sales: sellerOrders,
        totalPurchases: buyerOrders.length,
        totalSales: sellerOrders.length,
      },
    });
  } catch (error: any) {
    logger.error("Failed to fetch user history", error);
    // Return empty history if transaction service is unavailable
    res.json({
      success: true,
      data: {
        purchases: [],
        sales: [],
        totalPurchases: 0,
        totalSales: 0,
      },
    });
  }
};
