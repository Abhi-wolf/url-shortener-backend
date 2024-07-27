import { Router } from "express";
import {
  createNewShortUrl,
  deleteShortUrl,
  getAnalytics,
  getAShorturl,
  getUserShortUrls,
} from "../controllers/url.controller.js";
import { decodedUser, verifyJWT } from "../middlewares/auth.middleware.js";
import { cachedData } from "../middlewares/redisMiddleware.js";
import { rateLimiter } from "../middlewares/rateLimit.js";

const router = Router();

/**
 * @route POST /newShortUrl
 * @access Public
 * @desc Create a new short url
 * @middleware decodeUser -- (to check if user is logged in)
 * @param {object} req.body - Url to short
 * @returns {object} 200 - Short url
 */
router.route("/newShortUrl").post(decodedUser, createNewShortUrl);

/**
 * @route GET /getUrls
 * @access Private
 * @desc Retrieve all the urls generate the user
 * @middleware verifyJWT
 * @param {object} req.body - User id
 * @returns {object} 200 - All the short urls generated by the user
 * @returns {object} 401 - Unauthorized
 */
router.route("/getUrls").get(verifyJWT, getUserShortUrls);

/**
 * @route GET /:url
 * @access Public
 * @desc Get the redirected url accross the shortened url
 * @middleware rateLimiter -- (for restricting large no of requests)
 * @middleware cachedData -- (redis cache server)
 * @param {object} req.body - Short url
 * @returns {object} 200 - Redirected url
 */
router.route("/:url").get(rateLimiter, cachedData, getAShorturl);

/**
 * @route GET /analytics/:url
 * @access Private
 * @desc Get the analytics of the requested url
 * @middleware verifyJWT
 * @param {object} req.body - User id and url
 * @returns {object} 200 - Analytics of the url
 * @returns {object} 401 - Unauthorized
 */
router.route("/analytics/:url").get(verifyJWT, getAnalytics);

/**
 * @route DELETE /:url
 * @access Private
 * @desc Delete the generated short url
 * @middleware verifyJWT
 * @param {object} req.body - User id and url
 * @returns {object} 200 - Empty object and successfull message
 * @returns {object} 401 - Unauthorized
 */
router.route("/:url").delete(verifyJWT, deleteShortUrl);

export default router;
