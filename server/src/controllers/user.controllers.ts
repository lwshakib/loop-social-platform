import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import Comment from "../models/comment.model.js";
import Like from "../models/like.model.js";
import Saved from "../models/saved.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "../validators/user.validators.js";

/**
 * Get user by username
 * GET /api/users/:username
 * Public endpoint (no authentication required)
 */
export const getUserByUsername = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;

    if (!username) {
      throw new ApiError(400, "Username is required");
    }

    // Remove @ symbol if present
    const cleanUsername = username.startsWith("@")
      ? username.slice(1)
      : username;

    // Find user by username
    const user = await User.findOne({ username: cleanUsername }).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Get user stats
    const postsCount = await Post.countDocuments({ userId: user._id });

    // Get followers and following count (if you have a follow model)
    // For now, we'll set them to 0
    const followers = 0;
    const following = 0;

    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      surName: user.surName,
      username: user.username,
      email: user.email,
      bio: user.bio || "",
      gender: user.gender || "",
      dateOfBirth: user.dateOfBirth,
      profileImage: user.profileImage || "",
      coverImage: user.coverImage || "",
      isVerified: user.isVerified || false,
      createdAt: user.createdAt,
      postsCount,
      followers,
      following,
    };

    res
      .status(200)
      .json(new ApiResponse(200, userResponse, "User fetched successfully"));
  }
);

/**
 * Get posts by username
 * GET /api/users/:username/posts
 * Public endpoint (no authentication required)
 */
export const getPostsByUsername = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;
    const { type, page = "1", limit = "10" } = req.query;

    if (!username) {
      throw new ApiError(400, "Username is required");
    }

    // Remove @ symbol if present
    const cleanUsername = username.startsWith("@")
      ? username.slice(1)
      : username;

    // Find user by username
    const user = await User.findOne({ username: cleanUsername }).select("_id");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Build query
    const query: any = { userId: user._id };

    // Filter by type if provided (posts, reels, liked)
    if (type === "reels") {
      query.type = "video";
    } else if (type === "posts") {
      // For posts, we can include text and image types
      query.type = { $in: ["text", "image"] };
    } else if (type === "liked") {
      // For liked posts, we need to get posts that the user has liked
      // This requires checking the Like model
      const likedPostIds = await Like.find({ userId: user._id }).distinct(
        "postId"
      );
      if (likedPostIds.length === 0) {
        // Return empty result if no liked posts
        query._id = { $in: [] };
      } else {
        query._id = { $in: likedPostIds };
      }
    } else if (type === "saved" || type === "favorites") {
      // For saved posts, we need to get posts that the user has saved
      const savedPostIds = await Saved.find({ userId: user._id }).distinct(
        "postId"
      );
      if (savedPostIds.length === 0) {
        // Return empty result if no saved posts
        query._id = { $in: [] };
      } else {
        query._id = { $in: savedPostIds };
      }
    }

    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Fetch posts
    const posts = await Post.find(query)
      .populate("userId", "firstName surName username profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Post.countDocuments(query);

    // Get likes and comments counts for each post
    const postIds = posts.map((post) => post._id);
    const likesCounts = await Like.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);
    const commentsCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    // Create maps for quick lookup
    const likesMap = new Map(
      likesCounts.map((item) => [item._id.toString(), item.count])
    );
    const commentsMap = new Map(
      commentsCounts.map((item) => [item._id.toString(), item.count])
    );

    // Get current user from request (if authenticated)
    const currentUser = (req as any).user;
    let userLikedPosts: string[] = [];
    let userSavedPosts: string[] = [];
    
    if (currentUser) {
      // Get all posts liked by the current user
      const userLikes = await Like.find({
        userId: currentUser._id,
        postId: { $in: postIds },
      }).select("postId");
      userLikedPosts = userLikes.map((like) => like.postId.toString());
      
      // Get all posts saved by the current user
      const userSaved = await Saved.find({
        userId: currentUser._id,
        postId: { $in: postIds },
      }).select("postId");
      userSavedPosts = userSaved.map((saved) => saved.postId.toString());
    }

    // Format posts for response
    const formattedPosts = posts.map((post: any) => ({
      id: post._id,
      userId: post.userId._id,
      user: {
        id: post.userId._id,
        firstName: post.userId.firstName,
        surName: post.userId.surName,
        username: post.userId.username,
        profileImage: post.userId.profileImage || "",
      },
      caption: post.caption || "",
      url: post.url || "",
      type: post.type,
      likesCount: likesMap.get(post._id.toString()) || 0,
      commentsCount: commentsMap.get(post._id.toString()) || 0,
      createdAt: post.createdAt,
      isLiked: userLikedPosts.includes(post._id.toString()),
      isSaved: userSavedPosts.includes(post._id.toString()),
    }));

    res.status(200).json(
      new ApiResponse(
        200,
        {
          posts: formattedPosts,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
        "Posts fetched successfully"
      )
    );
  }
);

/**
 * Update user profile
 * PATCH /api/users/profile
 * Requires authentication
 */
export const updateProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get user from request (set by verifyJWT middleware)
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    // Validate request body
    let validatedData: UpdateProfileInput;
    try {
      validatedData = updateProfileSchema.parse(req.body);
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

    // Check if username is being changed and if it's already taken
    if (validatedData.username && validatedData.username !== user.username) {
      const existingUser = await User.findOne({
        username: validatedData.username,
      });
      if (existingUser) {
        throw new ApiError(400, "Username already taken");
      }
    }

    // Update user fields
    const updateFields: any = {};
    if (validatedData.firstName !== undefined)
      updateFields.firstName = validatedData.firstName;
    if (validatedData.surName !== undefined)
      updateFields.surName = validatedData.surName;
    if (validatedData.username !== undefined)
      updateFields.username = validatedData.username;
    if (validatedData.bio !== undefined) updateFields.bio = validatedData.bio;
    if (validatedData.profileImage !== undefined)
      updateFields.profileImage = validatedData.profileImage;
    if (validatedData.coverImage !== undefined)
      updateFields.coverImage = validatedData.coverImage;

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    // Get updated stats
    const postsCount = await Post.countDocuments({ userId: updatedUser._id });
    const followers = 0; // TODO: Implement followers count
    const following = 0; // TODO: Implement following count

    const userResponse = {
      id: updatedUser._id,
      firstName: updatedUser.firstName,
      surName: updatedUser.surName,
      username: updatedUser.username,
      email: updatedUser.email,
      bio: updatedUser.bio || "",
      gender: updatedUser.gender || "",
      dateOfBirth: updatedUser.dateOfBirth,
      profileImage: updatedUser.profileImage || "",
      coverImage: updatedUser.coverImage || "",
      isVerified: updatedUser.isVerified || false,
      createdAt: updatedUser.createdAt,
      postsCount,
      followers,
      following,
    };

    res
      .status(200)
      .json(new ApiResponse(200, userResponse, "Profile updated successfully"));
  }
);
