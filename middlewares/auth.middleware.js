import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

/**
 * A middleware used to verify the token and send back the status code 401 with error 
 * message if the token is invalid or not provided
  @param {Request} req -- The request object
  @param {Response} res -- The response object
  @param {Function} next -- The next middleware function
*/

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // get token
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");

    // return Unauthorized if token not present
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // verify the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // get user from the database
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // if user not found return invalid access token
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    // store the fetched user in the request object
    req.user = user;

    // call the next middleware
    next();
  } catch (error) {
    // if error return error
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

/**
 * A middleware used to verify the token and store the decoded
 * user in the req object if the token is verified
  @param {Request} req -- The request object
  @param {Response} res -- The response object
  @param {Function} next -- The next middleware function
*/

export const decodedUser = asyncHandler(async (req, _, next) => {
  try {
    // get token
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");

    // if token present verify it and decode the user
    if (token) {
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      // fetch user from the database
      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );

      // if user is present store user in request object
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "No user present");
  }
});
