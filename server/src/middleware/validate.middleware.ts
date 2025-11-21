import { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Validation middleware that validates request body against a Zod schema
 * @param schema - Zod schema to validate against
 */
export const validate = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
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
  };
};
