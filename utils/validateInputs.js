import { body } from "express-validator";

export const registerValidator = [
  body("email", "Invalid email").isEmail().isEmpty(),
  body("name", "Name is required").isEmpty(),
  body("password", "The minimum password length is 6 characters").isLength({
    min: 6,
  }),
];

export const loginValidator = [
  body("email", "Invalid email").isEmail().isEmpty(),
  body("password", "Password cannot be empty").isEmpty(),
];
