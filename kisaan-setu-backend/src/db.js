const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
  }

  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    console.log("[mongo] connected");
  });
  mongoose.connection.on("error", (err) => {
    console.error("[mongo] connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[mongo] disconnected");
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });

  return mongoose.connection;
}

module.exports = { connectDB, mongoose };
