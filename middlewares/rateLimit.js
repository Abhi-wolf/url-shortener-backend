import redisClient from "../db/redisClient.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * A middleware to implement rate limit
  @param {Request} req -- The request object
  @param {Response} res -- The response object
  @param {Function} next -- The next middleware function
*/
export const rateLimiter = async (req, res, next) => {
  try {
    // get ip of the request
    const ipAddress = req.ip;

    // create the redis key
    const redisId = `${process.env.URL}/${ipAddress}`;

    // increment the no of the requests from the ip address
    const requests = await redisClient.incr(redisId);

    // if the this is the first request from the ip set the expiry time
    if (requests === 1) {
      await redisClient.expire(redisId, process.env.EXPIRY_TIME_RATE_LIMIT);
    }

    // if the no of request exceeds from an ip address then send a response with status code 429
    if (requests > process.env.RATE_LIMIT) {
      return res.status(429).json(new ApiResponse(429, {}, "To many requests"));
    }

    // call next middleware
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json(new ApiError(500, "Internal Error"));
  }
};
