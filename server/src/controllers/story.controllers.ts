import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import logger from "../logger/winston.logger.js";
import Story from "../models/story.model.js";
import Follow from "../models/follow.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createStorySchema,
  type CreateStoryInput,
} from "../validators/story.validators.js";
import mongoose from "mongoose";

/**
 * Create a new story
 * POST /api/stories
 * Requires authentication
 */
export const createStory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get user from request (set by verifyJWT middleware)
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    // Validate request body
    let validatedData: CreateStoryInput;
    try {
      validatedData = createStorySchema.parse(req.body);
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

    // Create the story with 24-hour expiration
    let story;
    try {
      story = await Story.create({
        userId: user._id,
        caption: caption || "",
        url: url || "",
        type,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
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
    await story.populate("userId", "firstName surName username profileImage");

    // Transform story to match frontend expectations
    const populatedUser = story.userId as any;
    const transformedStory = {
      id: story._id.toString(),
      userId: populatedUser?._id?.toString() || "",
      user: populatedUser
        ? {
            id: populatedUser._id?.toString() || "",
            firstName: populatedUser.firstName || "",
            surName: populatedUser.surName || "",
            username: populatedUser.username || "",
            profileImage: populatedUser.profileImage || "",
          }
        : undefined,
      caption: story.caption || "",
      url: story.url || "",
      type: story.type,
      createdAt: story.createdAt.toISOString(),
      expiresAt: story.expiresAt.toISOString(),
    };

    // Return the created story
    res
      .status(201)
      .json(new ApiResponse(201, transformedStory, "Story created successfully"));
  }
);

/**
 * Get all stories grouped by user
 * GET /api/stories
 * Requires authentication
 * Returns stories grouped by userId, with only non-expired stories from followed users (including current user)
 */
export const getStories = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get user from request (set by verifyJWT middleware)
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    // Get list of users the current user is following
    const followingRecords = await Follow.find({
      followerId: user._id,
    }).select("followingId");

    // Create array of user IDs to include (followed users + current user)
    const userIdsToInclude = followingRecords.map(
      (follow: any) => follow.followingId
    );
    userIdsToInclude.push(user._id); // Include current user's own stories

    // Fetch all non-expired stories from followed users (including current user)
    const now = new Date();
    const stories = await Story.find({
      userId: { $in: userIdsToInclude },
      expiresAt: { $gt: now }, // Only get stories that haven't expired
    })
      .populate("userId", "firstName surName username profileImage")
      .sort({ createdAt: -1 });

    // Group stories by userId
    const storiesByUser = new Map<string, any[]>();

    stories.forEach((story: any) => {
      const userId = story.userId?._id?.toString() || story.userId?.toString();
      if (!userId) return;

      const populatedUser = story.userId as any;
      const transformedStory = {
        id: story._id.toString(),
        userId: userId,
        user: populatedUser
          ? {
              id: userId,
              firstName: populatedUser.firstName || "",
              surName: populatedUser.surName || "",
              username: populatedUser.username || "",
              profileImage: populatedUser.profileImage || "",
            }
          : undefined,
        caption: story.caption || "",
        url: story.url || "",
        type: story.type,
        createdAt: story.createdAt.toISOString(),
        expiresAt: story.expiresAt.toISOString(),
      };

      if (!storiesByUser.has(userId)) {
        storiesByUser.set(userId, []);
      }
      storiesByUser.get(userId)!.push(transformedStory);
    });

    // Convert map to array format
    const groupedStories = Array.from(storiesByUser.entries()).map(
      ([userId, userStories]) => {
        // Get user info from first story
        const userInfo = userStories[0]?.user;
        return {
          userId,
          user: userInfo,
          stories: userStories.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()
          ), // Sort by creation time (oldest first)
        };
      }
    );

    res.status(200).json(
      new ApiResponse(200, groupedStories, "Stories fetched successfully")
    );
  }
);

/**
 * Get stories by username
 * GET /api/stories/user/:username
 * Requires authentication
 */
export const getStoriesByUsername = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;

    if (!username) {
      throw new ApiError(400, "Username is required");
    }

    // Import User model to find user by username
    const User = (await import("../models/user.model.js")).default;
    const user = await User.findOne({ username });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Fetch all non-expired stories for this user
    const now = new Date();
    const stories = await Story.find({
      userId: user._id,
      expiresAt: { $gt: now }, // Only get stories that haven't expired
    })
      .populate("userId", "firstName surName username profileImage")
      .sort({ createdAt: 1 }); // Oldest first for story viewing

    // Transform stories
    const transformedStories = stories.map((story: any) => {
      const populatedUser = story.userId as any;
      return {
        id: story._id.toString(),
        userId: populatedUser?._id?.toString() || "",
        user: populatedUser
          ? {
              id: populatedUser._id?.toString() || "",
              firstName: populatedUser.firstName || "",
              surName: populatedUser.surName || "",
              username: populatedUser.username || "",
              profileImage: populatedUser.profileImage || "",
            }
          : undefined,
        caption: story.caption || "",
        url: story.url || "",
        type: story.type,
        createdAt: story.createdAt.toISOString(),
        expiresAt: story.expiresAt.toISOString(),
      };
    });

    res.status(200).json(
      new ApiResponse(200, transformedStories, "Stories fetched successfully")
    );
  }
);

/**
 * Get a single story by ID
 * GET /api/stories/:storyId
 * Requires authentication
 */
export const getStoryById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { storyId } = req.params;

    if (!storyId || !mongoose.Types.ObjectId.isValid(storyId)) {
      throw new ApiError(400, "Invalid story ID");
    }

    // Fetch the story
    const story = await Story.findById(storyId).populate(
      "userId",
      "firstName surName username profileImage"
    );

    if (!story) {
      throw new ApiError(404, "Story not found");
    }

    // Check if story has expired
    const now = new Date();
    if (story.expiresAt <= now) {
      throw new ApiError(404, "Story has expired");
    }

    // Transform story
    const populatedUser = story.userId as any;
    const transformedStory = {
      id: story._id.toString(),
      userId: populatedUser?._id?.toString() || "",
      user: populatedUser
        ? {
            id: populatedUser._id?.toString() || "",
            firstName: populatedUser.firstName || "",
            surName: populatedUser.surName || "",
            username: populatedUser.username || "",
            profileImage: populatedUser.profileImage || "",
          }
        : undefined,
      caption: story.caption || "",
      url: story.url || "",
      type: story.type,
      createdAt: story.createdAt.toISOString(),
      expiresAt: story.expiresAt.toISOString(),
    };

    res.status(200).json(
      new ApiResponse(200, transformedStory, "Story fetched successfully")
    );
  }
);

