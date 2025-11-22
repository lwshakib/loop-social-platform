/**
 * Centralized environment variables configuration
 * All environment variables should be imported from this file
 */

export const envs = {
  // Node Environment
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  NODE_VERSION: process.env.NODE_VERSION || "",

  // Database
  MONGODB_URI: process.env.MONGODB_URI || "",

  // JWT Secrets
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  // Email Configuration
  MAILHOG_SMTP_HOST: process.env.MAILHOG_SMTP_HOST || "localhost",
  MAILHOG_SMTP_PORT: Number(process.env.MAILHOG_SMTP_PORT) || 1025,
  GMAIL_USER: process.env.GMAIL_USER || "",
  GMAIL_PASS: process.env.GMAIL_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "Loop <noreply@loop.com>",
} as const;

