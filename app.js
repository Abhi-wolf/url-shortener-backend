import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "morgan";
import userRouter from "./routes/user.routes.js";
import urlRouter from "./routes/url.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// used to specifies the maximum size of the JSON payload
app.use(express.json({ limit: "16kb" }));

// used for data that is being passed in the url (extended is used for nested objects in the urlencoded data)
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(cookieParser());
app.use(logger("dev"));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/urls", urlRouter);

export { app };
