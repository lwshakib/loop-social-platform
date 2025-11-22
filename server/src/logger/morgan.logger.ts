import morgan from "morgan";
import { envs } from "../config/envs.js";
import logger from "./winston.logger.js";

const stream = {
  // Use the http severity
  write: (message: string) => logger.http(message.trim()),
};

const skip = () => {
  return envs.NODE_ENV !== "development";
};

const morganMiddleware = morgan(
  ":remote-addr :method :url :status - :response-time ms",
  { stream, skip }
);

export default morganMiddleware;
