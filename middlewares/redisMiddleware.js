import { updateTimeStampOfShortUrl } from "../controllers/url.controller.js";
import redisClient from "../db/redisClient.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * A middleware to query the redis cache for the requested url
  @param {Request} req -- The request object
  @param {Response} res -- The response object
  @param {Function} next -- The next middleware function
*/

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

    // get requested url from the params
    const { url } = req.params;

    // check redis cache for the data
    const cachedData = await redisClient.get(url);

    // if there is cache hit
    if (cachedData) {
      // redis key to store the time stamp of the request
      const rediKey = `url:${url}:history`;

      // store the timestamp in the redis cache
      await redisClient.lPush(rediKey, JSON.stringify(Date.now()));

      // count the number of timestamps for the particular key
      const visitHistory = await redisClient.lRange(rediKey, 0, -1);

      // if the count if greater than 9 then push these data from redis cache to the mongodb database for persistence
      if (visitHistory.length > 10) {
        await updateTimeStampOfShortUrl(url);
      }

      // return the original url from the cache
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
      // cahe miss
      console.log("Cache MISS");

      // call next middleware
      next();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});
