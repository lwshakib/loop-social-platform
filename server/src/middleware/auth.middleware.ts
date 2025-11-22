import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { envs } from "../config/envs.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to verify JWT access token
 * Attaches the user to the request object if token is valid
 */
export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try to get token from Authorization header first, then from cookies
    let accessToken = req.headers.authorization?.replace("Bearer ", "");

    // If not in header, try cookies
    if (!accessToken) {
      accessToken = req.cookies?.accessToken;
    }

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized - No token provided");
    }

    // Verify the token
    const decoded = jwt.verify(accessToken, envs.ACCESS_TOKEN_SECRET) as {
      id: string;
    };

    // Find the user
    const user = await User.findById(decoded.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Unauthorized - User not found");
    }

    // Attach user to request object
    (req as any).user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    // Handle JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, "Unauthorized - Invalid token"));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, "Unauthorized - Token expired"));
    }
    return next(new ApiError(401, "Unauthorized"));
  }
};
