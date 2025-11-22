import authRoutes from "./auth.routes";
import express from "express";
import postRoutes from "./post.routes.js";
import cloudinaryRoutes from "./cloudinary.routes.js";

const routes = express.Router();

routes.use("/auth", authRoutes);
routes.use("/posts", postRoutes);
routes.use("/cloudinary", cloudinaryRoutes);

export default routes;