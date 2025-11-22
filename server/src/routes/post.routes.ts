import express from "express";
import {
  createPost,
  getPosts,
  likePost,
  unlikePost,
  getPostComments,
  createComment,
  getCommentReplies,
  savePost,
  unsavePost,
} from "../controllers/post.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createPostSchema } from "../validators/post.validators.js";
import { z } from "zod";

const router = express.Router();

// All post routes require authentication
router.use(verifyJWT);

// Create a new post
router.post("/", validate(createPostSchema), createPost);

// Get all posts
router.get("/", getPosts);

// Like a post
router.post("/:postId/like", likePost);

// Unlike a post
router.delete("/:postId/like", unlikePost);

// Save a post
router.post("/:postId/saved", savePost);

// Unsave a post
router.delete("/:postId/saved", unsavePost);

// Get comments for a post
router.get("/:postId/comments", getPostComments);

// Create a comment on a post
router.post(
  "/:postId/comments",
  validate(
    z.object({
      comment: z.string().min(1).max(500),
      parentId: z.string().optional(),
    })
  ),
  createComment
);

// Get replies for a specific comment
router.get("/:postId/comments/:commentId/replies", getCommentReplies);

export default router;

