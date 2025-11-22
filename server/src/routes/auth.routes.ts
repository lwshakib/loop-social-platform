import express from "express";
import {
  signIn,
  signUp,
  sendOtpEmail,
  refreshAccessToken,
  validateAccessToken,
} from "../controllers/auth.controllers.js";

const router = express.Router();

router.post("/sign-in", signIn);
router.post("/sign-up", signUp);
router.post("/send-otp-email", sendOtpEmail);
router.post("/refresh-token", refreshAccessToken);
router.get("/validate-token", validateAccessToken);

export default router;
