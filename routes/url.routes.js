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

const router = Router();

router.route("/newShortUrl").post(decodedUser, createNewShortUrl);
router.route("/getUrls").get(verifyJWT, getUserShortUrls);
router.route("/:url").get(cachedData, getAShorturl);
router.route("/:url").delete(verifyJWT, deleteShortUrl);
router.route("/analytics/:url").get(verifyJWT, getAnalytics);

export default router;
