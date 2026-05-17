require("dotenv").config();

const os = require("os");
const app = require("./app");
const connectDB = require("./config/database");

const PORT = process.env.PORT || 5000;

/**
 * Get local network IP address
 */
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();

  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];

    for (const network of networkInterface) {
      if (network.family === "IPv4" && !network.internal) {
        return network.address;
      }
    }
  }

  return "127.0.0.1";
}

async function startServer() {
  try {
    // Connect MongoDB
    await connectDB();
    console.log("MongoDB connected successfully.");

    // Start Express Server
    app.listen(PORT, "0.0.0.0", () => {
      const localIP = getLocalIPAddress();

      console.log("======================================");
      console.log(`Server is running on port ${PORT}`);
      console.log(`Local   : http://localhost:${PORT}`);
      console.log(`Network : http://${localIP}:${PORT}`);
      console.log("======================================");
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
}

startServer();
