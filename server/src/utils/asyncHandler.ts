import { NextFunction, Request, Response } from "express";

/**
 * Wraps an async request handler to automatically catch and forward errors
 *
 * @param {(req: Request, res: Response, next: NextFunction) => Promise<void> | void} requestHandler
 * @returns {(req: Request, res: Response, next: NextFunction) => void}
 */
const asyncHandler = (
  requestHandler: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void> | void
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
