import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/errorHandler";
import * as userController from "../controllers/userController";

const router = Router();

router.post("/register", asyncHandler(userController.register));
router.post("/login", asyncHandler(userController.login));
router.get("/profile/:id", asyncHandler(userController.getProfile));
router.put("/profile/:id", asyncHandler(userController.updateProfile));
router.get("/:id/history", asyncHandler(userController.getHistory));
router.get("/:id", asyncHandler(userController.getUserById));

export default router;
