import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import logger from "../logger/winston.logger.js";
import Post from "../models/post.model.js";
import Like from "../models/like.model.js";
import Comment from "../models/comment.model.js";
import Saved from "../models/saved.model.js";
import Follow from "../models/follow.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createPostSchema,
  type CreatePostInput,
} from "../validators/post.validators.js";
import mongoose from "mongoose";
import { createNotification } from "./notification.controllers.js";

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

    // Send notifications to all followers
    try {
      // Find all users who follow the post creator
      const followers = await Follow.find({
        followingId: user._id,
      }).select("followerId");

      // Create notifications for each follower
      const notificationPromises = followers.map((follow: any) =>
        createNotification(
          follow.followerId,
          user._id,
          "post",
          post._id
        )
      );

      // Execute all notifications in parallel (don't wait for them to complete)
      Promise.all(notificationPromises).catch((error) => {
        // Log error but don't fail the post creation
        logger.error("Error creating post notifications:", error);
      });
    } catch (error) {
      // Log error but don't fail the post creation
      logger.error("Error fetching followers for post notification:", error);
    }

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
      .populate("userId", "firstName surName username profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Post.countDocuments();

    // Get post IDs for counting likes and comments
    const postIds = posts.map((post) => post._id);

    // Get likes and comments counts for each post
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

    // Get posts liked and saved by the current user
    let userLikedPosts: string[] = [];
    let userSavedPosts: string[] = [];

    const userLikes = await Like.find({
      userId: user._id,
      postId: { $in: postIds },
    }).select("postId");
    userLikedPosts = userLikes.map((like) => like.postId.toString());

    const userSaved = await Saved.find({
      userId: user._id,
      postId: { $in: postIds },
    }).select("postId");
    userSavedPosts = userSaved.map((saved) => saved.postId.toString());

    // Transform posts to include counts and user interaction status
    const transformedPosts = posts.map((post: any) => {
      const postId = post._id.toString();
      const userId = post.userId?._id || post.userId;
      
      // Ensure user data is properly populated
      let userData = undefined;
      if (post.userId) {
        // Check if userId is populated (object) or just an ObjectId
        if (typeof post.userId === 'object' && post.userId._id) {
          // Populated user object
          userData = {
            id: post.userId._id.toString(),
            firstName: post.userId.firstName || "",
            surName: post.userId.surName || "",
            username: post.userId.username || "unknown",
            profileImage: post.userId.profileImage || "",
          };
        } else if (typeof post.userId === 'object' && post.userId.username) {
          // Already populated as object
          userData = {
            id: userId?.toString() || post.userId._id?.toString() || "",
            firstName: post.userId.firstName || "",
            surName: post.userId.surName || "",
            username: post.userId.username || "unknown",
            profileImage: post.userId.profileImage || "",
          };
        }
      }
      
      return {
        id: postId,
        userId: userId?.toString() || post.userId?.toString() || "",
        user: userData,
        caption: post.caption || "",
        url: post.url || "",
        type: post.type,
        likesCount: likesMap.get(postId) || 0,
        commentsCount: commentsMap.get(postId) || 0,
        createdAt: post.createdAt,
        isLiked: userLikedPosts.includes(postId),
        isSaved: userSavedPosts.includes(postId),
      };
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          posts: transformedPosts,
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

/**
 * Get a single post by ID
 * GET /api/posts/:postId
 * Requires authentication
 */
export const getPostById = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    const { postId } = req.params;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      throw new ApiError(400, "Invalid post ID");
    }

    const post = await Post.findById(postId).populate(
      "userId",
      "firstName surName username profileImage"
    );

    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    const [likesCount, commentsCount, isLiked, isSaved] = await Promise.all([
      Like.countDocuments({ postId }),
      Comment.countDocuments({ postId }),
      Like.exists({ userId: user._id, postId }),
      Saved.exists({ userId: user._id, postId }),
    ]);

    const transformedPost = {
      id: post._id.toString(),
      userId: (post.userId as any)?._id?.toString() || post.userId?.toString(),
      user:
        typeof post.userId === "object"
          ? {
              id: (post.userId as any)?._id?.toString() || "",
              firstName: (post.userId as any)?.firstName || "",
              surName: (post.userId as any)?.surName || "",
              username: (post.userId as any)?.username || "unknown",
              profileImage: (post.userId as any)?.profileImage || "",
            }
          : undefined,
      caption: post.caption || "",
      url: post.url || "",
      type: post.type,
      likesCount,
      commentsCount,
      viewsCount: (post as any).viewsCount || 0,
      createdAt: post.createdAt,
      isLiked: Boolean(isLiked),
      isSaved: Boolean(isSaved),
    };

    res
      .status(200)
      .json(new ApiResponse(200, { post: transformedPost }, "Post fetched successfully"));
  }
);

/**
 * Like a post
 * POST /api/posts/:postId/like
 * Requires authentication
 */
export const likePost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    const { postId } = req.params;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      throw new ApiError(400, "Invalid post ID");
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      userId: user._id,
      postId: postId,
    });

    if (existingLike) {
      throw new ApiError(400, "Post already liked");
    }

    // Create like
    const like = await Like.create({
      userId: user._id,
      postId: postId,
    });

    // Create notification for the post owner (if not liking own post)
    if (post.userId.toString() !== user._id.toString()) {
      await createNotification(
        post.userId,
        user._id,
        "like",
        postId
      );
    }

    res
      .status(201)
      .json(new ApiResponse(201, like, "Post liked successfully"));
  }
);

/**
 * Unlike a post
 * DELETE /api/posts/:postId/like
 * Requires authentication
 */
export const unlikePost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    const { postId } = req.params;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      throw new ApiError(400, "Invalid post ID");
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    // Remove like
    const deletedLike = await Like.findOneAndDelete({
      userId: user._id,
      postId: postId,
    });

    if (!deletedLike) {
      throw new ApiError(404, "Like not found");
    }

    res.status(200).json(new ApiResponse(200, null, "Post unliked successfully"));
  }
);

/**
 * Get comments for a post
 * GET /api/posts/:postId/comments
 * Requires authentication
 */
export const getPostComments = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    const { postId } = req.params;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      throw new ApiError(400, "Invalid post ID");
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Fetch comments (only top-level comments)
    const comments = await Comment.find({
      postId: postId,
      parentId: { $exists: false },
    })
      .populate("userId", "firstName surName username profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Transform comments to match frontend expectations
    // Only return reply count, not the actual replies (for performance)
    const transformedComments = await Promise.all(
      comments.map(async (comment: any) => {
        const populatedUser = comment.userId as any;
        
        // Get reply count (only direct replies, not nested)
        const replyCount = await Comment.countDocuments({
          postId: postId,
          parentId: comment._id,
        });

        return {
          id: comment._id.toString(),
          userId: populatedUser?._id?.toString() || "",
          user: {
            id: populatedUser?._id?.toString() || "",
            firstName: populatedUser?.firstName || "",
            surName: populatedUser?.surName || "",
            username: populatedUser?.username || "",
            profileImage: populatedUser?.profileImage || "",
          },
          comment: comment.comment,
          postId: comment.postId.toString(),
          parentId: comment.parentId ? comment.parentId.toString() : undefined,
          createdAt: comment.createdAt.toISOString(),
          replyCount: replyCount,
        };
      })
    );

    // Get total count
    const total = await Comment.countDocuments({
      postId: postId,
      parentId: { $exists: false },
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          comments: transformedComments,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        "Comments fetched successfully"
      )
    );
  }
);

/**
 * Create a comment on a post
 * POST /api/posts/:postId/comments
 * Requires authentication
 */
export const createComment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    const { postId } = req.params;
    const { comment, parentId } = req.body;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      throw new ApiError(400, "Invalid post ID");
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    // If parentId is provided, validate it
    if (parentId && typeof parentId === "string") {
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        throw new ApiError(400, "Invalid parent comment ID");
      }
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        throw new ApiError(404, "Parent comment not found");
      }
    }

    // Create comment
    const newComment = await Comment.create({
      userId: user._id,
      postId: postId,
      comment: comment,
      ...(parentId && typeof parentId === "string" ? { parentId } : {}),
    });

    // Create notification for the post owner (if not commenting on own post)
    if (post.userId.toString() !== user._id.toString()) {
      await createNotification(
        post.userId,
        user._id,
        "comment",
        postId,
        newComment._id
      );
    }

    // Populate user data
    await newComment.populate("userId", "firstName surName username profileImage");

    // Transform comment to match frontend expectations
    const populatedUser = newComment.userId as any;
    const transformedComment = {
      id: newComment._id.toString(),
      userId: populatedUser._id.toString(),
      user: {
        id: populatedUser._id.toString(),
        firstName: populatedUser.firstName || "",
        surName: populatedUser.surName || "",
        username: populatedUser.username || "",
        profileImage: populatedUser.profileImage || "",
      },
      comment: newComment.comment,
      postId: newComment.postId.toString(),
      parentId: newComment.parentId ? newComment.parentId.toString() : undefined,
      createdAt: newComment.createdAt.toISOString(),
    };

    res
      .status(201)
      .json(new ApiResponse(201, transformedComment, "Comment created successfully"));
  }
);

// Get replies for a specific comment
export const getCommentReplies = asyncHandler(
  async (req: Request, res: Response) => {
    const { postId, commentId } = req.params;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      throw new ApiError(400, "Invalid post ID");
    }

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      throw new ApiError(400, "Invalid comment ID");
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    // Check if parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      throw new ApiError(404, "Parent comment not found");
    }

    // Get pagination parameters
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    // Helper function to recursively fetch replies
    const fetchRepliesRecursively = async (
      parentId: any,
      depth: number = 0,
      maxDepth: number = 10,
      replyLimit: number = 50,
      replySkip: number = 0
    ): Promise<{ replies: any[]; hasMore: boolean; total: number }> => {
      if (depth >= maxDepth) {
        return { replies: [], hasMore: false, total: 0 };
      }

      // Get total count first
      const total = await Comment.countDocuments({
        postId: postId,
        parentId: parentId,
      });

      const replies = await Comment.find({
        postId: postId,
        parentId: parentId,
      })
        .populate("userId", "firstName surName username profileImage")
        .sort({ createdAt: 1 })
        .skip(replySkip)
        .limit(replyLimit);

      const transformedReplies = await Promise.all(
        replies.map(async (reply: any) => {
          const replyUser = reply.userId as any;
          const nestedRepliesResult = await fetchRepliesRecursively(
            reply._id,
            depth + 1,
            maxDepth,
            50,
            0
          );

          // Get reply count for nested replies
          const nestedReplyCount = await Comment.countDocuments({
            postId: postId,
            parentId: reply._id,
          });

          return {
            id: reply._id.toString(),
            userId: replyUser?._id?.toString() || "",
            user: {
              id: replyUser?._id?.toString() || "",
              firstName: replyUser?.firstName || "",
              surName: replyUser?.surName || "",
              username: replyUser?.username || "",
              profileImage: replyUser?.profileImage || "",
            },
            comment: reply.comment,
            postId: reply.postId.toString(),
            parentId: reply.parentId ? reply.parentId.toString() : undefined,
            createdAt: reply.createdAt.toISOString(),
            replies: nestedRepliesResult.replies,
            replyCount: nestedReplyCount,
          };
        })
      );

      const hasMore = replySkip + replyLimit < total;
      return {
        replies: transformedReplies,
        hasMore,
        total,
      };
    };

    // Fetch replies recursively (only for top level, use limit and skip)
    const repliesResult = await fetchRepliesRecursively(
      commentId,
      0,
      10,
      limit,
      skip
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          replies: repliesResult.replies,
          hasMore: repliesResult.hasMore,
          total: repliesResult.total,
        },
        "Replies fetched successfully"
      )
    );
  }
);

/**
 * Save a post
 * POST /api/posts/:postId/saved
 * Requires authentication
 */
export const savePost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    const { postId } = req.params;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      throw new ApiError(400, "Invalid post ID");
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    // Check if already saved
    const existingSaved = await Saved.findOne({
      userId: user._id,
      postId: postId,
    });

    if (existingSaved) {
      throw new ApiError(400, "Post already saved");
    }

    // Create saved
    const saved = await Saved.create({
      userId: user._id,
      postId: postId,
    });

    res
      .status(201)
      .json(new ApiResponse(201, saved, "Post saved successfully"));
  }
);

/**
 * Unsave a post
 * DELETE /api/posts/:postId/saved
 * Requires authentication
 */
export const unsavePost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    const { postId } = req.params;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      throw new ApiError(400, "Invalid post ID");
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    // Remove saved
    const deletedSaved = await Saved.findOneAndDelete({
      userId: user._id,
      postId: postId,
    });

    if (!deletedSaved) {
      throw new ApiError(404, "Saved post not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Post unsaved successfully"));
  }
);
