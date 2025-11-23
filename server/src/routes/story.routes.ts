import express from "express";
import {
  createStory,
  getStories,
  getStoriesByUsername,
  getStoryById,
} from "../controllers/story.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createStorySchema } from "../validators/story.validators.js";

const router = express.Router();

// All story routes require authentication
router.use(verifyJWT);

// Create a new story
router.post("/", validate(createStorySchema), createStory);

// Get all stories grouped by user
router.get("/", getStories);

// Get stories by username
router.get("/user/:username", getStoriesByUsername);

// Get a single story by ID
router.get("/:storyId", getStoryById);

export default router;

