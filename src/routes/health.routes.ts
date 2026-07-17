import { Router } from "express";

import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.status(200).json({
    success: true,
    data: {
      service: "skillforge-api",
      status: "healthy",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});