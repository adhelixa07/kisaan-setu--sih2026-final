require("dotenv").config();

const app = require("./app");
const { connectDB } = require("./db");

const PORT = process.env.PORT || 5000;

async function main() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] Kisaan Setu API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("[server] failed to start:", err.message);
  process.exit(1);
});
