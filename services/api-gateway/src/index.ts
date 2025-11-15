import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// Proxy routes
const services = {
  "/api/users": process.env.USER_SERVICE_URL || "http://user-service:3001",
  "/api/catalog": process.env.CATALOG_SERVICE_URL || "http://catalog-service:3002",
  "/api/search": process.env.SEARCH_SERVICE_URL || "http://search-service:3003",
  "/api/messages": process.env.MESSAGING_SERVICE_URL || "http://messaging-service:3004",
  "/api/transactions": process.env.TRANSACTION_SERVICE_URL || "http://transaction-service:3005",
  "/api/notifications": process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3006",
  "/api/reviews": process.env.REVIEW_SERVICE_URL || "http://review-service:3007",
  "/api/favorites": process.env.FAVORITE_SERVICE_URL || "http://favorite-service:3008",
  "/api/deliveries": process.env.DELIVERY_SERVICE_URL || "http://delivery-service:3009",
  "/api/wallet": process.env.WALLET_SERVICE_URL || "http://wallet-service:3010",
  "/api/admin": process.env.ADMIN_SERVICE_URL || "http://admin-service:3011",
};

Object.entries(services).forEach(([path, target]) => {
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${path}`]: "",
      },
      xfwd: true,
      logLevel: "debug",
      onError: (err, req, res) => {
        console.error(`Proxy error for ${path}:`, err.message);
        if (!res.headersSent) {
        res.status(503).json({
          success: false,
          error: "Service temporarily unavailable",
          });
        }
      },
      onProxyReq: (proxyReq, req, res) => {
        // Set timeout on the proxy request
        proxyReq.setTimeout(10000, () => {
          if (!res.headersSent) {
            res.status(504).json({
              success: false,
              error: "Gateway timeout",
            });
          }
        });
      },
    })
  );
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
