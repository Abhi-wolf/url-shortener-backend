import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: "String",
      required: [true, "Email is required"],
      unique: true,
      index: true,
    },
    name: {
      type: "String",
      required: true,
    },
    password: {
      type: "String",
      min: [6, "Must be at least 6 characters long"],
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: "String",
    },
  },
  {
    timestamps: true,
  }
);

// ENCRYPT PASSWORD BEFORE SAVING PASSWORD IN THE DATABSE
userSchema.pre("save", async function (next) {
  // is the password is not changed
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// METHOD TO COMPARE THE PASSWORD PROVIDED BY THE USER AND THE PASSWORD IN THE DATABASE
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//GENERATE AND RETURNS ACCESS TOKEN
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// GENERATES AND RETURNS REFRESH TOKEN
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
export const User = mongoose.model("User", userSchema);
