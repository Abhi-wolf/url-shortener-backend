import redis from "redis";

/**
 * A function to connect to redis server
 */
const redisClient = redis.createClient({
  host: "127.0.0.1",
  port: 6379,
});

redisClient.on("error", (err) => {
  console.log("Redis connection error : ", err);
});

(async () => {
  await redisClient.connect();
})();

export default redisClient;
