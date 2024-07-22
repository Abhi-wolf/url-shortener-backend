import { nanoid } from "nanoid";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Url } from "../models/url.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

const createNewShortUrl = asyncHandler(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    throw new ApiError(400, "Url is required");
  }

  const shortUrl = nanoid(10);

  const newUrlData = {
    shortUrl,
    redirectUrl: url,
    visitHistory: [],
  };

  if (req.user) {
    newUrlData.userId = req.user?._id;
  }

  const newShorturl = await Url.create(newUrlData);
  return res
    .status(200)
    .json(new ApiResponse(201, newShorturl, "Url created successfully"));
});

const getUserShortUrls = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  console.log("user = ", req.user);
  let urls = [];
  if (userId) {
    urls = await Url.find({ userId });
  }

  return res.status(200).json(new ApiResponse(201, urls, "All urls"));
});

const getAShorturl = asyncHandler(async (req, res) => {
  const { url } = req.params;

  if (!url) {
    return res
      .status(400)
      .json(new ApiError(400, "Please provide a short url"));
  }

  const entry = await Url.findOneAndUpdate(
    { shortUrl: url },
    {
      $push: {
        visitHistory: {
          timestamp: Date.now(),
        },
      },
    }
  );

  if (!entry) {
    return res.status(404).json(new ApiError(404, "Redirect url not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(201, entry, "Redirect url fetched successfully"));
});

const getAnalytics = asyncHandler(async (req, res) => {
  const { url } = req.params;

  if (!url) {
    return res
      .status(400)
      .json(new ApiError(400, "Please provide a short url"));
  }

  const result = await Url.findOne({ shortUrl: url });

  return res.status(200).json(
    new ApiResponse(
      201,
      {
        totalClicks: result.visitHistory.length,
        analytics: result.visitHistory,
      },
      "Analytics fetched successfully"
    )
  );
});

export { createNewShortUrl, getUserShortUrls, getAShorturl, getAnalytics };
