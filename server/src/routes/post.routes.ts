import express from "express";
import { createPost, getPosts } from "../controllers/post.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createPostSchema } from "../validators/post.validators.js";

const router = express.Router();

// All post routes require authentication
router.use(verifyJWT);

// Create a new post
router.post("/", validate(createPostSchema), createPost);

// Get all posts
router.get("/", getPosts);

export default router;

