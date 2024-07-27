import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

/**
 * @desc Generate new access token and refresh token
 * @param {string} userId - userId of the user
 * @returns {Object} The newly generated access token and refresh token
 * @access Public
 */
const generateAccessAndRefreshToken = async (userId) => {
  try {
    // fetch user from database
    const user = await User.findOne(userId);

    // generate access token
    const accessToken = user.generateAccessToken();

    // generate refresh token
    const refreshToken = user.generateRefreshToken();

    // save refresh token in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // return access token and refresh token
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating token");
  }
};

/**
 * @route POST /api/v1/users/register
 * @desc Create a new user
 * @param {string} name - Name of the user
 * @param {string} email - Email of the user
 * @param {string} password - Password of the user
 * @returns {Object} The created user
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
  // destructure name,email and password from the request body
  const { name, email, password } = req.body;

  // check if all the fields are present
  if ([name, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // check if the user already exist with the same email
  const existingUser = await User.findOne({ email });

  // if the user already exist throw a new error with status code 409
  if (existingUser) {
    throw new ApiError(409, "User with email already exists");
  }

  // craete new user
  let user = {};
  try {
    user = await User.create({
      name,
      email,
      password,
    });
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal error"));
  }

  // fetch the newly created user
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check if the user is created or not if not then return new error with status code 500
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return the newly created user
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

/**
 * @route POST /api/v1/users/login
 * @desc Login user
 * @param {string} email - Email of the user
 * @param {string} password - Password of the user
 * @returns {Object} The logged in user and set the cookies
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
  // destructure email and password from the request body
  const { email, password } = req.body;

  // return a new error with status code 400 if email or password is not found in the request body
  if (!email || !password) {
    throw new ApiError(400, "Email and password both are required");
  }

  // fetch the user from the database using email
  const existinguser = await User.findOne({ email });

  // if user does not exist return new error with status code 404
  if (!existinguser) {
    throw new ApiError(404, "User does not exits");
  }

  // verify the emtered password
  const isPasswordCorrect = await existinguser.isPasswordCorrect(password);

  // if password is not correct return a new error with status code 401
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // destructure access and refresh token from the function
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    existinguser._id
  );

  // define options for cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  // set the cookies and return email and name with the response object
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: {
            email: existinguser.email,
            name: existinguser.name,
          },
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

/**
 * @route POST /api/v1/users/logout
 * @desc Logout user
 * @returns {Object} The empty object and clear the cookies
 * @access Private
 */
const logoutUser = asyncHandler(async (req, res) => {
  // find the user and remove the refresh token field from the document
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  // define options for the cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  // clear cookies and return the empty object with status code 200
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/**
 * @route GET /api/v1/users/current-user
 * @desc Get current user
 * @returns {Object} The current logged in user
 * @access Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

/**
 * @route POST /api/v1/users/change-password
 * @desc Change the password
 * @param {string} oldPassword - oldPassword of the user
 * @param {string} newPassword - new password of the user
 * @returns {Object} The empty object with status code 200 and the successfull message of updation
 * @access Public
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // destructure old and new passwords from the request body
  const { oldPassword, newPassword } = req.body;

  // get the user id from the request object
  const userId = req.user?._id;

  // throw error with status code 400 if old and new passwords not present in request body
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old and new passwords required");
  }

  // fetch the user from the database
  const existingUser = await User.findById(userId).select("-refreshToken");

  // if user does exist throw new error with status code 404
  if (!existingUser) {
    throw new ApiError(404, "User does not exist");
  }

  // verify the old password
  const passwordCorrect = await existingUser.isPasswordCorrect(oldPassword);

  // if the old password is incorrect throw new error with status code 400
  if (!passwordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  // save the new password
  existingUser.password = newPassword;

  await existingUser.save({ validateBeforeSave: false });

  // return response with the status code and successfull message
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

/**
 * @route PATCH /api/v1/users/update-account
 * @desc Update the account details in this case only name can be updated
 * @param {string} name - Name of the user
 * @returns {Object} The updated user
 * @access Private
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, "Name is required");
  }

  const existingUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        name,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, existingUser, "Account details updated successfully")
    );
});

/**
 * @route PATCH /api/v1/users/refresh-token
 * @desc Refresh the access token in case the access token is expired
 * @param {string} name - Name of the user
 * @returns {Object} The updated user
 * @access Private
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  // retrieve the refresh token from the request object
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  // if refresh token not found return Unauthorized error with status code 401
  if (!incomingRefreshToken || incomingRefreshToken === "undefined") {
    throw new ApiError(401, "Unauthorized error");
  }

  try {
    // verify the refresh token
    const decodedUser = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // fetch user from the database
    const user = await User.findById(decodedUser?._id);

    // if user does not exist return invalid refresh token with status code 401
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // compare the refresh token coming from request object and the one fetched from the database
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // set options for cookies
    const options = {
      httpOnly: true,
      secure: true,
    };

    // generate new access token and refresh token
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    // set the cookie and return access and refresh token along with the request
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// export all the methods
export {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
  updateAccountDetails,
  changeCurrentPassword,
};
