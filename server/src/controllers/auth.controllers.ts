import User from "../models/user.model";
import { Request, Response } from "express";
import logger from "../logger/winston.logger.js";

export const signIn = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
        const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }


    res.status(200).json({  });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const signUp = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.create({ email, password });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};