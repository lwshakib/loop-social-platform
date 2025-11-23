import express from "express";
import { verifyJWT, optionalVerifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getUserByUsername,
  getPostsByUsername,
  updateProfile,
  followUser,
  unfollowUser,
  getSuggestedUsers,
} from "../controllers/user.controllers.js";
import { updateProfileSchema } from "../validators/user.validators.js";

const router = express.Router();

// Update profile (requires authentication)
router.patch(
  "/profile",
  verifyJWT,
  validate(updateProfileSchema),
  updateProfile
);

// Get suggested users (requires authentication)
router.get("/suggestions", verifyJWT, getSuggestedUsers);

// Get user by username (optional authentication to get following status)
router.get("/:username", optionalVerifyJWT, getUserByUsername);

// Get posts by username (optional authentication to get like status)
router.get("/:username/posts", optionalVerifyJWT, getPostsByUsername);

// Follow a user (requires authentication)
router.post("/:username/follow", verifyJWT, followUser);

// Unfollow a user (requires authentication)
router.delete("/:username/follow", verifyJWT, unfollowUser);

export default router;

