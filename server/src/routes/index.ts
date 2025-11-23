import authRoutes from "./auth.routes";
import express from "express";
import postRoutes from "./post.routes.js";
import cloudinaryRoutes from "./cloudinary.routes.js";
import userRoutes from "./user.routes.js";
import storyRoutes from "./story.routes.js";
import notificationRoutes from "./notification.routes.js";
import healthRoutes from "./health.routes.js";

const routes = express.Router();

routes.use("/health", healthRoutes);
routes.use("/auth", authRoutes);
routes.use("/posts", postRoutes);
routes.use("/cloudinary", cloudinaryRoutes);
routes.use("/users", userRoutes);
routes.use("/stories", storyRoutes);
routes.use("/notifications", notificationRoutes);

export default routes;