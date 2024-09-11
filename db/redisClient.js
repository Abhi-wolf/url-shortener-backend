import redis from "redis";

/**
 * A function to connect to redis server
 */

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
});

redisClient.on("error", (err) => {
  console.log("Redis connection error : ", err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log("SUCCESSFULLY connectED TO REDIS");
  } catch (err) {
    console.log("ERROR IN connect TO REDIS");
  }
})();

export default redisClient;
