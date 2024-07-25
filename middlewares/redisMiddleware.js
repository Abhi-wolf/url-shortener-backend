import { updateTimeStampOfShortUrl } from "../controllers/url.controller.js";
import redisClient from "../db/redisClient.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const cachedData = asyncHandler(async (req, res, next) => {
  try {
    // Check Redis connection status
    const pong = await redisClient.ping();
    if (pong !== "PONG") {
      console.error("Redis is not active");
      return res
        .status(500)
        .json(new ApiResponse(500, { message: "Redis is not active" }));
    }

    const { url } = req.params;

    const cachedData = await redisClient.get(url);

    if (cachedData) {
      console.log("Cache HIT");
      const rediKey = `url:${url}:history`;
      await redisClient.lPush(rediKey, JSON.stringify(Date.now()));

      const visitHistory = await redisClient.lRange(rediKey, 0, -1);

      if (visitHistory.length > 10) {
        await updateTimeStampOfShortUrl(url);
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            201,
            { originalUrl: cachedData },
            "Redirect url fetched successfully from redis server"
          )
        );
    } else {
      console.log("Cache MISS");
      next();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});
