import redis from "redis";

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

// redisClient.on("connect", () => {
//   console.log("Connected to redis db");
// });

export default redisClient;
