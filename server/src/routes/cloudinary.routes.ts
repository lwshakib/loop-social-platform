import express from "express";
import { getCloudinarySignature } from "../controllers/cloudinary.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

// All cloudinary routes require authentication
router.use(verifyJWT);

// Get Cloudinary signature
router.get("/signature", getCloudinarySignature);

export default router;

