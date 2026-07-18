import { toNodeHandler } from "better-auth/node";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import * as helmetModule from "helmet";
import { pinoHttp } from "pino-http";

import { auth } from "./config/auth.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";
import { apiRouter } from "./routes/index.js";

// Helmet exposes its callable middleware as an ESM default export. Keeping the
// extraction explicit works with both local TypeScript and Vercel's builder.
const helmet = helmetModule.default as unknown as () => RequestHandler;

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: env.CLIENT_URL.split(",").map((origin) => origin.trim()),
    credentials: true,
  }),
);
app.use(cookieParser());

// Better Auth needs the untouched request body, so its handler runs before JSON parsing.
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(
  pinoHttp({
    autoLogging: env.NODE_ENV !== "test",
    ...(env.NODE_ENV === "development" && !process.env.VERCEL
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true },
          },
        }
      : {}),
  }),
);
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

app.get("/", (_request, response) => {
  response.json({
    success: true,
    message: "SkillForge AI API",
    health: "/api/v1/health",
    authentication: "/api/auth",
  });
});

app.use("/api/v1", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

// Vercel detects this default Express export and wraps it in one serverless
// function. The named export remains available to the local HTTP server.
export default app;
