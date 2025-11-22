import { NextFunction, Request, Response } from "express";
import { cloudinaryClient } from "../config/cloudinary.config.js";
import { envs } from "../config/envs.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Get Cloudinary signature for direct uploads
 * GET /api/cloudinary/signature
 * Requires authentication
 */
export const getCloudinarySignature = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = (req.query.folder as string) || "loop-social-platform";

    const signature = cloudinaryClient.utils.api_sign_request(
      { timestamp, folder },
      envs.CLOUDINARY_API_SECRET
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          signature,
          cloudName: envs.CLOUDINARY_CLOUD_NAME,
          timestamp,
          folder,
          apiKey: envs.CLOUDINARY_API_KEY,
        },
        "Cloudinary signature generated successfully"
      )
    );
  }
);
