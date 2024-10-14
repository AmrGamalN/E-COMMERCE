const { createClient } = require("redis");
const client = createClient({
  password: process.env.PASSWORDREDIS,
  socket: {
    host: process.env.HOSTREDIS,
    port: process.env.PORTREDIS,
  },
});

client
  .connect()
  .then(() => {
    console.log("Redis connected");
  })
  .catch((err) => {
    console.error("Failed to connect to Redis:", err);
  })
  .finally(console.log("connected is done"));

async function authenticate() {
  try {
    const token = await client.get("auth_token");
    if (token) {
      return token;
    } else {
      const authResponse = await axios.post(paymobAuthUrl, { api_key: apiKey });
      const auth_token = authResponse.data.token;
      await client.set("auth_token", auth_token, "EX", 3600);
      return auth_token; // Return the new token and updat after 1 hours
    }
  } catch (err) {
    throw new Error("Authentication failed");
  }
}

module.exports = client;
