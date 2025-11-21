import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import morganMiddleware from "./logger/morgan.logger.js";
import http from "http";
dotenv.config();

const app = express();

app.use(cors({
  origin: ["*"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morganMiddleware);

const httpServer = http.createServer(app);

export default httpServer;