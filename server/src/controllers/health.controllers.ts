import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Health check endpoint
 * GET /api/health
 * Returns server and database status
 */
export const healthCheck = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText =
      dbStatus === 0
        ? "disconnected"
        : dbStatus === 1
        ? "connected"
        : dbStatus === 2
        ? "connecting"
        : dbStatus === 3
        ? "disconnecting"
        : "unknown";

    const healthData = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatusText,
        connected: dbStatus === 1,
      },
    };

    const statusCode = dbStatus === 1 ? 200 : 503;

    res
      .status(statusCode)
      .json(new ApiResponse(statusCode, healthData, "Health check successful"));
  }
);
