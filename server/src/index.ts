import dotenv from "dotenv";
import httpServer from "./app.js";
import connectDB from "./db";
import logger from "./logger/winston.logger.js";
dotenv.config();

const port = process.env.PORT || 3000;
const majorNodeVersion = +(process.env.NODE_VERSION?.split(".")[0] || 0);

async function startServer() {
  httpServer.listen(port, () => {
    logger.info(`📑 Visit the api at: http://localhost:${port}/api`);
    logger.info("⚙️  Server is running on port: " + port);
  });
}

(async () => {
  if (majorNodeVersion >= 14) {
    try {
      await connectDB();
      startServer();
    } catch (err) {
      logger.error("Mongo db connect error: ", err);
    }
  } else {
    connectDB()
      .then(() => {
        startServer();
      })
      .catch((err) => {
        logger.error("Mongo db connect error: ", err);
      });
  }
})();
