import express from "express";
import { healthCheck } from "../controllers/health.controllers.js";

const router = express.Router();

// Health check endpoint
router.get("/", healthCheck);

export default router;

