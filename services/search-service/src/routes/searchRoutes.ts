import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/errorHandler";
import * as searchController from "../controllers/searchController";

const router = Router();

router.get("/search", asyncHandler(searchController.search));
router.get("/suggest", asyncHandler(searchController.suggest));

export default router;
