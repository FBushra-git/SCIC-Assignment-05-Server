import { createServer } from "node:http";

import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

const server = createServer(app);

async function startServer() {
  await connectDatabase();
  server.listen(env.PORT, () => {
    console.log(`SkillForge API listening on http://localhost:${env.PORT}`);
  });
}

function shutdown(signal: string) {
  console.log(`${signal} received. Closing HTTP server.`);
  server.close(async (error) => {
    await disconnectDatabase();
    if (error) {
      console.error("Failed to close HTTP server", error);
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer().catch((error: unknown) => {
  console.error("Failed to start SkillForge API", error);
  process.exit(1);
});