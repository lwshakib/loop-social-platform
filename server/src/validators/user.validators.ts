import { z } from "zod";

// Update profile validation schema
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters")
    .optional(),
  surName: z
    .string()
    .min(2, "Surname must be at least 2 characters")
    .max(50, "Surname must be at most 50 characters")
    .optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .optional(),
  bio: z
    .string()
    .max(160, "Bio must be at most 160 characters")
    .optional(),
  profileImage: z.string().url("Profile image must be a valid URL").optional(),
  coverImage: z.string().url("Cover image must be a valid URL").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

