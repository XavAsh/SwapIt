import { Request, Response } from "express";
import { pool } from "../index";
import { AppError } from "../../shared/middleware/errorHandler";
import { Logger } from "../../shared/utils/logger";
import { publishEvent } from "../utils/rabbitmq";

const logger = new Logger("AdminController");

export const createReport = async (req: Request, res: Response) => {
  const { reporterId, reportedUserId, reportedProductId, reportedMessageId, reason, description } = req.body;

  if (!reporterId || !reason) {
    throw new AppError("reporterId and reason are required", 400);
  }

  if (!reportedUserId && !reportedProductId && !reportedMessageId) {
    throw new AppError("At least one of reportedUserId, reportedProductId, or reportedMessageId is required", 400);
  }

  const result = await pool.query(
    `INSERT INTO reports (reporter_id, reported_user_id, reported_product_id, reported_message_id, reason, description, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
    [reporterId, reportedUserId || null, reportedProductId || null, reportedMessageId || null, reason, description || null]
  );

  const report = result.rows[0];

  publishEvent("ReportCreated", {
    reportId: report.id,
    reporterId: report.reporter_id,
    timestamp: new Date(),
  }).catch((err) => logger.error("Failed to publish ReportCreated event", err));

  logger.info(`Report created: ${report.id}`);

  res.status(201).json({
    success: true,
    data: report,
  });
};

export const getReports = async (req: Request, res: Response) => {
  const { status, limit = 50, offset = 0 } = req.query;

  let query = "SELECT * FROM reports WHERE 1=1";
  const params: any[] = [];
  let paramCount = 1;

  if (status) {
    query += ` AND status = $${paramCount++}`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  res.json({
    success: true,
    data: result.rows,
    count: result.rows.length,
  });
};

export const updateReportStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  if (!status) {
    throw new AppError("status is required", 400);
  }

  const validStatuses = ["pending", "reviewing", "resolved", "dismissed"];
  if (!validStatuses.includes(status)) {
    throw new AppError(`status must be one of: ${validStatuses.join(", ")}`, 400);
  }

  const result = await pool.query(
    `UPDATE reports SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
    [status, adminNotes || null, id]
  );

  if (result.rows.length === 0) {
    throw new AppError("Report not found", 404);
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
};

export const getStatistics = async (req: Request, res: Response) => {
  // Get various statistics
  const [users, products, orders, reports] = await Promise.all([
    pool.query("SELECT COUNT(*) as count FROM users"),
    pool.query("SELECT COUNT(*) as count FROM products"),
    pool.query("SELECT COUNT(*) as count, SUM(amount) as total_revenue FROM orders WHERE status = 'delivered'"),
    pool.query("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'"),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers: parseInt(users.rows[0].count),
      totalProducts: parseInt(products.rows[0].count),
      totalOrders: parseInt(orders.rows[0].count),
      totalRevenue: parseFloat(orders.rows[0].total_revenue || "0"),
      pendingReports: parseInt(reports.rows[0].count),
    },
  });
};

export const moderateProduct = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { action, reason } = req.body; // action: 'approve', 'reject', 'hide'

  if (!action) {
    throw new AppError("action is required", 400);
  }

  const validActions = ["approve", "reject", "hide"];
  if (!validActions.includes(action)) {
    throw new AppError(`action must be one of: ${validActions.join(", ")}`, 400);
  }

  // This would typically call the catalog service
  // For now, we'll just log it
  logger.info(`Product moderation: ${productId} - ${action} - ${reason || ""}`);

  res.json({
    success: true,
    message: `Product ${action}d`,
  });
};

