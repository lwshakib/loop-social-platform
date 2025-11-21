import authRoutes from "./auth.routes";
import express from "express";

const routes = express.Router();

routes.use("/auth", authRoutes);

export default routes;