import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/errorHandler";
import * as productController from "../controllers/productController";

const router = Router();

router.post("/", asyncHandler(productController.createProduct));
router.get("/:id", asyncHandler(productController.getProduct));
router.get("/", asyncHandler(productController.getProducts));
router.put("/:id", asyncHandler(productController.updateProduct));
router.delete("/:id", asyncHandler(productController.deleteProduct));
router.get("/user/:userId", asyncHandler(productController.getProductsByUser));

export default router;
