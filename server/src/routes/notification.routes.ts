import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notification.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

// All notification routes require authentication
router.use(verifyJWT);

// Get notifications for the current user
router.get("/", getNotifications);

// Mark notification as read
router.patch("/:notificationId/read", markNotificationAsRead);

// Mark all notifications as read
router.patch("/read-all", markAllNotificationsAsRead);

export default router;

