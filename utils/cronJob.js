import cron from "node-cron";
import redisClient from "../db/redisClient.js";
import { updateTimeStampOfShortUrl } from "../controllers/url.controller.js";

cron.schedule("*/5 * * * *", async () => {
  const keys = await redisClient.keys("url:*:history");

  for (const key of keys) {
    const url = key.split(":")[1];

    await updateTimeStampOfShortUrl(url);
  }
});
