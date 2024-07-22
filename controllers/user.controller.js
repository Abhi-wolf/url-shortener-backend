import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findOne(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  console.log("REGISTER USER");

  const { name, email, password } = req.body;

  if ([name, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  console.log("body = ", req.body);

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "User with email already exists");
  }

  console.log("existingUser = ", existingUser);

  let user = {};
  try {
    user = await User.create({
      name,
      email,
      password,
    });
  } catch (error) {
    console.log("ERROR = ", error);
  }

  console.log("new user = ", user);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  console.log("Created user = ", createdUser);

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password both are required");
  }

  const existinguser = await User.findOne({ email });

  if (!existinguser) {
    throw new ApiError(404, "User does not exits");
  }

  const isPasswordCorrect = await existinguser.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    existinguser._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

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

const logoutUser = asyncHandler(async (req, res) => {
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

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?._id;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old and new passwords required");
  }

  const existingUser = await User.findById(userId).select("-refreshToken");

  if (!existingUser) {
    throw new ApiError(404, "User does not exist");
  }

  const passwordCorrect = await existingUser.isPasswordCorrect(oldPassword);

  if (!passwordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  existingUser.password = newPassword;

  await existingUser.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

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

export {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
  updateAccountDetails,
  changeCurrentPassword,
};
