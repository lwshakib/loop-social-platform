import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { envs } from "../config/envs.js";
import logger from "../logger/winston.logger.js";
import { Otp } from "../models/otp.model";
import User from "../models/user.model";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendOTPEmail } from "../utils/mail";
import {
  sendOtpEmailSchema,
  signInSchema,
  signUpSchema,
  type SendOtpEmailInput,
  type SignInInput,
  type SignUpInput,
} from "../validators/auth.validators.js";

export const signIn = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate request body
    let validatedData: SignInInput;
    try {
      validatedData = signInSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw new ApiError(400, "Validation failed", errors);
      }
      throw new ApiError(400, "Invalid request data");
    }

    const { email, password } = validatedData;

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
    // Validate request body
    let validatedData: SignUpInput;
    try {
      validatedData = signUpSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw new ApiError(400, "Validation failed", errors);
      }
      throw new ApiError(400, "Invalid request data");
    }

    const {
      firstName,
      surname,
      username,
      gender,
      dateOfBirth,
      email,
      password,
      otp,
    } = validatedData;

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
    // Validate request body
    let validatedData: SendOtpEmailInput;
    try {
      validatedData = sendOtpEmailSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw new ApiError(400, "Validation failed", errors);
      }
      throw new ApiError(400, "Invalid request data");
    }

    const { email } = validatedData;

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

export const validateAccessToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Try to get token from Authorization header first, then from cookies
    const accessToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.accessToken;

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized");
    }

    try {
      const decoded = jwt.verify(accessToken, envs.ACCESS_TOKEN_SECRET) as {
        id: string;
      };

      const user = await User.findById(decoded.id).select(
        "-password -refreshToken"
      );

      if (!user) {
        throw new ApiError(401, "Unauthorized");
      }

      // Return user data
      const userResponse = {
        id: user._id,
        firstName: user.firstName,
        surName: user.surName,
        username: user.username,
        email: user.email,
        bio: user.bio,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        profileImage: user.profileImage,
        coverImage: user.coverImage,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      };

      res
        .status(200)
        .json(new ApiResponse(200, userResponse, "Access token is valid"));
    } catch (error) {
      throw new ApiError(401, "Unauthorized");
    }
  }
);

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Try to get refresh token from Authorization header first, then from cookies
    const refreshToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.refreshToken;

    if (!refreshToken) {
      throw new ApiError(401, "Unauthorized");
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, envs.REFRESH_TOKEN_SECRET);
    } catch (error) {
      throw new ApiError(401, "Unauthorized");
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    // Check if the refresh token matches the one stored in the database
    if (user.refreshToken !== refreshToken) {
      throw new ApiError(401, "Unauthorized");
    }

    // Generate new access token
    const accessToken = (user as any).generateAccessToken();

    // Return the new access token
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken },
          "Access token refreshed successfully"
        )
      );
  }
);
