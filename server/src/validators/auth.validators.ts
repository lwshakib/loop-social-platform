import { z } from "zod";

// Sign In validation schema
export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Sign Up validation schema
export const signUpSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters"),
  surname: z
    .string()
    .min(2, "Surname must be at least 2 characters")
    .max(50, "Surname must be at most 50 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  gender: z.enum(["male", "female", "other"], {
    message: "Gender must be male, female, or other",
  }),
  dateOfBirth: z.string().refine(
    (dateString) => {
      const date = new Date(dateString);
      return !isNaN(date.getTime()) && date <= new Date();
    },
    {
      message: "Date of birth must be a valid date and cannot be in the future",
    }
  ),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Send OTP Email validation schema
export const sendOtpEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Type exports
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SendOtpEmailInput = z.infer<typeof sendOtpEmailSchema>;
