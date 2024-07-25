import { nanoid } from "nanoid";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Url } from "../models/url.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import redisClient from "../db/redisClient.js";

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
    throw new ApiError(400, "Please provide a short url");
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
    console.log("ENTRY NOT FOUND");
    throw new ApiError(404, "Redirect url not found");
  }

  redisClient.set(url, entry.redirectUrl);

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        { originalUrl: entry.redirectUrl },
        "Redirect url fetched successfully"
      )
    );
});

const updateTimeStampOfShortUrl = async (url) => {
  console.log("url = ", url);
  try {
    // get the key
    const rediKey = `url:${url}:history`;

    // get visited history from redis
    const visitHistory = await redisClient.lRange(rediKey, 0, -1);

    if (!visitHistory) return;

    // parse the data
    const parsedUpdatedHistory = visitHistory.map((item) => JSON.parse(item));

    console.log(parsedUpdatedHistory);

    // update the data from redis to mongodb
    const updatePromises = parsedUpdatedHistory.map(async (item) => {
      await Url.findOneAndUpdate(
        { url },
        {
          $push: {
            visitHistory: {
              timestamp: Number(item),
            },
          },
        },
        { new: true } // Option to return the updated document
      );
    });

    await Promise.all(updatePromises);

    // delete the data from redis cache
    await redisClient.del(rediKey);
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal Error");
  }
};

const getAnalytics = asyncHandler(async (req, res) => {
  const { url } = req.params;

  if (!url) {
    throw new ApiError(400, "Please provide a short url");
  }

  // update time stamp of url from the redis client
  await updateTimeStampOfShortUrl(url);

  const result = await Url.findOne({ shortUrl: url });

  if (!result) {
    return res.status(400).json(new ApiResponse(400, {}, "Url not found"));
  }

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

const deleteShortUrl = asyncHandler(async (req, res) => {
  const { url } = req.params;
  const userId = req.user?._id;

  const data = await Url.findOne({ shortUrl: url });

  if (!data) {
    throw new ApiError(400, "Url not found");
  }

  console.log("data = ", data);
  if (!userId.equals(data.userId)) {
    console.log(data.userId, " ---> ", userId);

    throw new ApiError(404, "Url cannot be deleted");
  }

  await Url.findOneAndDelete({ shortUrl: url });
  redisClient.del(url);

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Url deleted successfully"));
});

const getAllRedisData = async () => {
  try {
    // get all keys
    const keys = await redisClient.keys("*");
    console.log("keys = ", keys);
    const data = {};

    // fetch values for each keys
    for (const key of keys) {
      const value = await redisClient.get(key);
      data[key] = value;
    }

    console.log(data);
  } catch (error) {
    console.log("Error while fetching redis data = ", error);
  }
};

export {
  createNewShortUrl,
  getUserShortUrls,
  getAShorturl,
  getAnalytics,
  deleteShortUrl,
  updateTimeStampOfShortUrl,
  getAllRedisData,
};
