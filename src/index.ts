import { createServer } from "node:http";

import { app } from "./app.js";
import { env } from "./config/env.js";

const server = createServer(app);

server.listen(env.PORT, () => {
  console.log(`SkillForge API listening on http://localhost:${env.PORT}`);
});

const shutdown = (signal: string) => {
  console.log(`${signal} received. Closing HTTP server.`);
  server.close((error) => {
    if (error) {
      console.error("Failed to close HTTP server", error);
      process.exit(1);
    }

    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));