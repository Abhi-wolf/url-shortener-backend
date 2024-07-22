import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      process.env.CONNECTION_STRING
    );

    console.log("Mongodb connected");
  } catch (error) {
    console.log("Database connection error : ", error);
    process.exit(1);
  }
};

export default connectDB;
