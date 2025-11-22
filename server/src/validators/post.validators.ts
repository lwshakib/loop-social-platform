import { z } from "zod";

/**
 * Schema for creating a post
 * - caption: optional for all types, but required for text posts if no url
 * - type: must be "text", "image", or "video"
 * - url: required for image and video types, optional for text
 */
export const createPostSchema = z.object({
  caption: z.string().optional(),
  url: z.string().url().optional(),
  type: z.enum(["text", "image", "video"]).default("text"),
}).refine(
  (data) => {
    // If type is image or video, url is required
    if ((data.type === "image" || data.type === "video") && !data.url) {
      return false;
    }
    return true;
  },
  {
    message: "URL is required for image and video posts",
    path: ["url"],
  }
).refine(
  (data) => {
    // For text posts, caption is required if no url
    // For image/video posts, url is already required above, so caption is optional
    if (data.type === "text" && !data.caption && !data.url) {
      return false;
    }
    return true;
  },
  {
    message: "Caption is required for text posts",
    path: ["caption"],
  }
);

export type CreatePostInput = z.infer<typeof createPostSchema>;

