import redisClient from "../db/redisClient.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const rateLimiter = async (req, res, next) => {
  try {
    const ipAddress = req.ip;

    const redisId = `$${process.env.URL}/${ipAddress}`;

    const requests = await redisClient.incr(redisId);

    // set the expiry time
    if (requests === 1) {
      await redisClient.expire(redisId, process.env.EXPIRY_TIME_RATE_LIMIT);
    }

    if (requests > process.env.RATE_LIMIT) {
      return res.status(429).json(new ApiResponse(429, {}, "To many requests"));
    }

    next();
  } catch (error) {
    console.log(error);
  }
};
