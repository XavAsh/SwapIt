import { Request, Response } from "express";
import { pool } from "../index";
import { AppError } from "../../shared/middleware/errorHandler";
import { Logger } from "../../shared/utils/logger";
import { publishEvent } from "../utils/rabbitmq";

const logger = new Logger("DeliveryController");

export const createShipment = async (req: Request, res: Response) => {
  const { orderId, shippingMethod, trackingNumber, carrier, address } = req.body;

  if (!orderId || !shippingMethod || !address) {
    throw new AppError("orderId, shippingMethod, and address are required", 400);
  }

  const validMethods = ["relay_point", "home_delivery"];
  if (!validMethods.includes(shippingMethod)) {
    throw new AppError("shippingMethod must be 'relay_point' or 'home_delivery'", 400);
  }

  const result = await pool.query(
    `INSERT INTO shipments (order_id, shipping_method, tracking_number, carrier, address, status)
     VALUES ($1, $2, $3, $4, $5, 'prepared')
     RETURNING *`,
    [orderId, shippingMethod, trackingNumber || null, carrier || null, JSON.stringify(address)]
  );

  const shipment = result.rows[0];

  publishEvent("ShipmentCreated", {
    shipmentId: shipment.id,
    orderId: shipment.order_id,
    shippingMethod: shipment.shipping_method,
    trackingNumber: shipment.tracking_number,
    timestamp: new Date(),
  }).catch((err) => logger.error("Failed to publish ShipmentCreated event", err));

  logger.info(`Shipment created: ${shipment.id}`);

  res.status(201).json({
    success: true,
    data: shipment,
  });
};

export const updateShipmentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, trackingNumber } = req.body;

  if (!status) {
    throw new AppError("status is required", 400);
  }

  const validStatuses = ["prepared", "shipped", "in_transit", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new AppError(`status must be one of: ${validStatuses.join(", ")}`, 400);
  }

  const result = await pool.query(
    `UPDATE shipments 
     SET status = $1, tracking_number = COALESCE($2, tracking_number), updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [status, trackingNumber, id]
  );

  if (result.rows.length === 0) {
    throw new AppError("Shipment not found", 404);
  }

  const shipment = result.rows[0];

  // If delivered, publish event
  if (status === "delivered") {
    publishEvent("OrderDelivered", {
      shipmentId: shipment.id,
      orderId: shipment.order_id,
      timestamp: new Date(),
    }).catch((err) => logger.error("Failed to publish OrderDelivered event", err));
  }

  publishEvent("ShipmentStatusUpdated", {
    shipmentId: shipment.id,
    orderId: shipment.order_id,
    status: shipment.status,
    timestamp: new Date(),
  }).catch((err) => logger.error("Failed to publish ShipmentStatusUpdated event", err));

  logger.info(`Shipment status updated: ${shipment.id} -> ${status}`);

  res.json({
    success: true,
    data: shipment,
  });
};

export const getShipmentByOrder = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const result = await pool.query("SELECT * FROM shipments WHERE order_id = $1", [orderId]);

  if (result.rows.length === 0) {
    throw new AppError("Shipment not found for this order", 404);
  }

  const shipment = result.rows[0];
  if (shipment.address) {
    shipment.address = JSON.parse(shipment.address);
  }

  res.json({
    success: true,
    data: shipment,
  });
};

export const getShipment = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query("SELECT * FROM shipments WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    throw new AppError("Shipment not found", 404);
  }

  const shipment = result.rows[0];
  if (shipment.address) {
    shipment.address = JSON.parse(shipment.address);
  }

  res.json({
    success: true,
    data: shipment,
  });
};

export const getUserShipments = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.query; // 'buyer' or 'seller'

  let query = `
    SELECT s.*, o.buyer_id, o.seller_id
    FROM shipments s
    JOIN orders o ON s.order_id = o.id
    WHERE 
  `;

  if (role === "buyer") {
    query += `o.buyer_id = $1`;
  } else if (role === "seller") {
    query += `o.seller_id = $1`;
  } else {
    query += `(o.buyer_id = $1 OR o.seller_id = $1)`;
  }

  query += ` ORDER BY s.created_at DESC`;

  const result = await pool.query(query, [userId]);

  const shipments = result.rows.map((shipment: any) => {
    if (shipment.address) {
      shipment.address = JSON.parse(shipment.address);
    }
    return shipment;
  });

  res.json({
    success: true,
    data: shipments,
  });
};

