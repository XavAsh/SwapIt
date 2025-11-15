import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/errorHandler";
import * as favoriteController from "../controllers/favoriteController";

const router = Router();

router.post("/", asyncHandler(favoriteController.addFavorite));
router.delete("/:id", asyncHandler(favoriteController.removeFavorite));
router.get("/user/:userId", asyncHandler(favoriteController.getUserFavorites));
router.get("/check", asyncHandler(favoriteController.checkFavorite));

export default router;

