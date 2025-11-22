import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { envs } from "../config/envs.js";
import logger from "../logger/winston.logger.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * @param {Error | ApiError} err
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 *
 * @description This middleware is responsible to catch the errors from any request handler wrapped inside the {@link asyncHandler}
 */
const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Check if the error is an instance of an ApiError class which extends native Error class
  if (!(error instanceof ApiError)) {
    // if not
    // create a new ApiError instance to keep the consistency
    // assign an appropriate status code
    const statusCode =
      (error as any).statusCode || error instanceof mongoose.Error ? 400 : 500;

    // set a message from native Error instance or a custom one
    const message = error.message || "Something went wrong";

    error = new ApiError(
      statusCode,
      message,
      (error as any)?.errors || [],
      error.stack || ""
    );
  }

  // Now we are sure that the `error` variable will be an instance of ApiError class
  const apiError = error as ApiError;
  const response = {
    statusCode: apiError.statusCode,
    success: apiError.success,
    message: apiError.message,
    data: apiError.data,
    errors: apiError.errors,
    ...(envs.NODE_ENV === "development"
      ? { stack: apiError.stack }
      : {}), // Error stack traces should be visible in development for debugging
  };

  logger.error(`${apiError.message}`);

  // Send error response
  return res.status(apiError.statusCode).json(response);
};

export { errorHandler };

