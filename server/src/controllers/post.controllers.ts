import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import logger from "../logger/winston.logger.js";
import Post from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createPostSchema,
  type CreatePostInput,
} from "../validators/post.validators.js";

/**
 * Create a new post
 * POST /api/posts
 * Requires authentication
 */
export const createPost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get user from request (set by verifyJWT middleware)
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    // Validate request body
    let validatedData: CreatePostInput;
    try {
      validatedData = createPostSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw new ApiError(400, "Validation failed", errors);
      }
      throw new ApiError(400, "Invalid request data");
    }

    const { caption, url, type } = validatedData;

    // Create the post
    let post;
    try {
      post = await Post.create({
        userId: user._id,
        caption: caption || "",
        url: url || "",
        type,
      });
    } catch (error: any) {
      // Handle mongoose validation errors
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new ApiError(400, errors.join(", "), errors);
      }

      logger.error(error);
      throw new ApiError(500, "Internal server error");
    }

    // Populate user data
    await post.populate("userId", "firstName surName username email");

    // Return the created post
    res
      .status(201)
      .json(new ApiResponse(201, post, "Post created successfully"));
  }
);

/**
 * Get all posts
 * GET /api/posts
 * Requires authentication
 */
export const getPosts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get user from request (set by verifyJWT middleware)
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Fetch posts with pagination
    const posts = await Post.find()
      .populate("userId", "firstName surName username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Post.countDocuments();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          posts,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        "Posts fetched successfully"
      )
    );
  }
);
