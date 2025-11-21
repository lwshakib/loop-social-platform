import { NextFunction, Request, Response } from "express";
import logger from "../logger/winston.logger.js";
import { Otp } from "../models/otp.model";
import User from "../models/user.model";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendOTPEmail } from "../utils/mail";

export const signIn = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Compare password
    const isPasswordValid = await (user as any).comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Generate tokens
    const accessToken = (user as any).generateAccessToken();
    const refreshToken = (user as any).generateRefreshToken();

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Return user data without sensitive information
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      surName: user.surName,
      username: user.username,
      email: user.email,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      accessToken,
      refreshToken,
    };

    res
      .status(200)
      .json(new ApiResponse(200, userResponse, "Sign in successful"));
  }
);

export const signUp = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      firstName,
      surname,
      username,
      gender,
      dateOfBirth,
      email,
      password,
      otp,
    } = req.body;

    // Validate required fields
    if (!firstName || !surname || !username || !email || !password || !otp) {
      throw new ApiError(400, "All fields are required");
    }

    // Check if user with email already exists
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      throw new ApiError(400, "User with this email already exists");
    }

    // Check if username already exists
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      throw new ApiError(400, "Username already taken");
    }

    // Validate OTP
    const existingOtp = await Otp.findOne({ email, otp: otp.toString() });
    if (!existingOtp) {
      throw new ApiError(400, "Invalid OTP");
    }

    // Check if OTP has expired
    if (new Date() > existingOtp.expiresAt) {
      await Otp.deleteOne({ email, otp: otp.toString() });
      throw new ApiError(400, "OTP has expired. Please request a new one");
    }

    // Delete the used OTP
    await Otp.deleteOne({ email, otp: otp.toString() });

    // Create user (password will be hashed by pre-save hook)
    let user;
    try {
      user = await User.create({
        firstName,
        surName: surname, // Map surname to surName as per model
        username,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        email,
        password,
        isVerified: true, // Mark as verified since OTP was validated
      });
    } catch (error: any) {
      // Handle mongoose validation errors
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new ApiError(400, errors.join(", "), errors);
      }

      // Handle duplicate key errors (MongoDB unique constraint violation)
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0];
        if (field === "username") {
          throw new ApiError(400, "Username already taken");
        }
        if (field === "email") {
          throw new ApiError(400, "User with this email already exists");
        }
        if (field) {
          throw new ApiError(
            400,
            `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
          );
        }
        throw new ApiError(400, "Duplicate entry. This record already exists");
      }

      // Re-throw as ApiError for other errors
      logger.error(error);
      throw new ApiError(500, "Internal server error");
    }

    // Return user data without sensitive information
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      surName: user.surName,
      username: user.username,
      email: user.email,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };

    res
      .status(201)
      .json(new ApiResponse(201, userResponse, "User created successfully"));
  }
);

export const sendOtpEmail = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP for this email
    await Otp.deleteMany({ email });

    // Create new OTP
    await Otp.create({ email, otp });

    // Send OTP via email
    await sendOTPEmail(email, otp);

    res.status(200).json(new ApiResponse(200, {}, "OTP sent to email"));
  }
);
