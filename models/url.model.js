import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
  {
    shortUrl: {
      type: "String",
      unique: true,
      required: true,
      index: true,
    },
    redirectUrl: {
      type: "String",
      required: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
    },
    visitHistory: [{ timestamp: { type: Number } }],
  },
  { timestamp: true }
);

export const Url = mongoose.model("Url", urlSchema);
