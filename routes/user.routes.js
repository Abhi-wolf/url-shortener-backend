import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
} from "./../controllers/user.controller.js";
import { loginValidator, registerValidator } from "../utils/validateInputs.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route POST /register
 * @access Public
 * @desc Register a new user
 * @param {object} req.body - User registration details
 * @returns {object} 201 - Created
 * @returns {object} 400 - Bad Request
 */
router.route("/register").post(registerValidator, registerUser);

/**
 * @route POST /refresh-token
 * @access Public
 * @desc Refresh access token
 * @param {object} req.body - Refresh token
 * @returns {object} 200 - Token
 * @returns {object} 401 - Unauthorized
 */
router.route("/refresh-token").post(refreshAccessToken);

/**
 * @route POST /login
 * @access Public
 * @desc Authenticate user and login
 * @param {object} req.body - User credentials
 * @returns {object} 200 - Authentication token
 * @returns {object} 400 - Bad Request
 */
router.route("/login").post(loginValidator, loginUser);

/**
 * @route POST /logout
 * @access Private
 * @desc Logout user
 * @middleware verifyJWT
 * @returns {object} 200 - Success
 * @returns {object} 401 - Unauthorized
 */
router.route("/logout").post(verifyJWT, logoutUser);

/**
 * @route GET /current-user
 * @access Private
 * @desc Get currently authenticated user
 * @middleware verifyJWT
 * @returns {object} 200 - User details
 * @returns {object} 401 - Unauthorized
 */
router.route("/current-user").get(verifyJWT, getCurrentUser);

/**
 * @route POST /change-password
 * @access Private
 * @desc Change user password
 * @middleware verifyJWT
 * @param {object} req.body - New password details
 * @returns {object} 200 - Success
 * @returns {object} 401 - Unauthorized
 */
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

/**
 * @route PATCH /update-account
 * @access Private
 * @desc Update user account details (only name can be updated)
 * @middleware verifyJWT
 * @param {object} req.body - Updated account details
 * @returns {object} 200 - Updated user details
 * @returns {object} 401 - Unauthorized
 */
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

export default router;
