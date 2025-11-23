import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Get notifications for the current user
 * GET /api/notifications
 * Requires authentication
 */
export const getNotifications = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get user from request (set by verifyJWT middleware)
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Fetch notifications for the current user
    const notifications = await Notification.find({ userId: user._id })
      .populate("actorId", "firstName surName username profileImage")
      .populate("postId", "url type _id")
      .populate("commentId", "comment")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Notification.countDocuments({ userId: user._id });

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId: user._id,
      isRead: false,
    });

    // Transform notifications to match frontend expectations
    const transformedNotifications = notifications.map((notification: any) => {
      const actor = notification.actorId as any;
      const post = notification.postId as any;
      const comment = notification.commentId as any;

      let action = "";
      if (notification.type === "like") {
        action = "liked your post";
      } else if (notification.type === "comment") {
        action = "commented on your post";
      } else if (notification.type === "follow") {
        action = "started following you";
      } else if (notification.type === "post") {
        action = "shared a new post";
      }

      return {
        id: notification._id.toString(),
        type: notification.type,
        username: actor?.username || "unknown",
        fullName: actor
          ? `${actor.firstName || ""} ${actor.surName || ""}`.trim() ||
            actor.username
          : "Unknown User",
        avatar: actor?.profileImage || "",
        action,
        comment: comment?.comment || undefined,
        time: notification.createdAt,
        postImage: post?.url && (post?.type === "image" || post?.type === "video") ? post.url : undefined,
        postId: post?._id ? post._id.toString() : undefined,
        postType: post?.type || undefined,
        isRead: notification.isRead,
      };
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          notifications: transformedNotifications,
          unreadCount,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        "Notifications fetched successfully"
      )
    );
  }
);

/**
 * Mark notification as read
 * PATCH /api/notifications/:notificationId/read
 * Requires authentication
 */
export const markNotificationAsRead = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get user from request (set by verifyJWT middleware)
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    const { notificationId } = req.params;

    // Update notification
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: user._id, // Ensure user can only mark their own notifications as read
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, notification, "Notification marked as read")
      );
  }
);

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 * Requires authentication
 */
export const markAllNotificationsAsRead = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get user from request (set by verifyJWT middleware)
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    // Update all notifications for the user
    const result = await Notification.updateMany(
      { userId: user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json(
      new ApiResponse(
        200,
        { updatedCount: result.modifiedCount },
        "All notifications marked as read"
      )
    );
  }
);

/**
 * Helper function to create a notification
 * This is used by other controllers (like, comment, follow)
 */
export const createNotification = async (
  userId: string | mongoose.Types.ObjectId,
  actorId: string | mongoose.Types.ObjectId,
  type: "like" | "comment" | "follow" | "post",
  postId?: string | mongoose.Types.ObjectId,
  commentId?: string | mongoose.Types.ObjectId
) => {
  try {
    // Convert to ObjectId if needed
    const userIdObj = typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
    const actorIdObj = typeof actorId === "string" ? new mongoose.Types.ObjectId(actorId) : actorId;
    const postIdObj = postId ? (typeof postId === "string" ? new mongoose.Types.ObjectId(postId) : postId) : undefined;
    const commentIdObj = commentId ? (typeof commentId === "string" ? new mongoose.Types.ObjectId(commentId) : commentId) : undefined;

    // Don't create notification if user is acting on their own content
    if (userIdObj.toString() === actorIdObj.toString()) {
      return;
    }

    // Check if notification already exists (to avoid duplicates)
    const existingNotification = await Notification.findOne({
      userId: userIdObj,
      actorId: actorIdObj,
      type,
      ...(postIdObj && { postId: postIdObj }),
      ...(commentIdObj && { commentId: commentIdObj }),
    });

    if (existingNotification) {
      // Update the existing notification timestamp
      existingNotification.createdAt = new Date();
      await existingNotification.save();
      return;
    }

    // Create new notification
    await Notification.create({
      userId: userIdObj,
      actorId: actorIdObj,
      type,
      ...(postIdObj && { postId: postIdObj }),
      ...(commentIdObj && { commentId: commentIdObj }),
    });
  } catch (error) {
    // Log error but don't throw - notifications shouldn't break the main flow
    console.error("Error creating notification:", error);
  }
};

