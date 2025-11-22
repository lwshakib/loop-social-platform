import express from "express";
import { verifyJWT, optionalVerifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getUserByUsername,
  getPostsByUsername,
  updateProfile,
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

// Get user by username
router.get("/:username", getUserByUsername);

// Get posts by username (optional authentication to get like status)
router.get("/:username/posts", optionalVerifyJWT, getPostsByUsername);

export default router;

