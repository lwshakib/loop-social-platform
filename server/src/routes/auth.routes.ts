import express from "express";
import {
  signIn,
  signUp,
  sendOtpEmail,
} from "../controllers/auth.controllers.js";

const router = express.Router();

router.post("/sign-in", signIn);
router.post("/sign-up", signUp);
router.post("/send-otp-email", sendOtpEmail);

export default router;
