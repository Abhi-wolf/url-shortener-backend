import { Router } from "express";
import {
  createNewShortUrl,
  getAnalytics,
  getAShorturl,
  getUserShortUrls,
} from "../controllers/url.controller.js";
import { decodedUser, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/newShortUrl").post(decodedUser, createNewShortUrl);
router.route("/getUrls").get(verifyJWT, getUserShortUrls);
router.route("/:url").get(getAShorturl);
router.route("/analytics/:url").get(verifyJWT, getAnalytics);

export default router;
