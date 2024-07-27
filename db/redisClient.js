import redis from "redis";

/**
 * A function to connect to redis server
 */
const redisClient = redis.createClient({
  host: process.env.REDIS_URL,
  port: process.env.REDIS_PORT,
});

redisClient.on("error", (err) => {
  console.log("Redis connection error : ", err);
});

(async () => {
  await redisClient.connect();
})();

export default redisClient;
