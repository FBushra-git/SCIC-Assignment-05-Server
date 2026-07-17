import { Router } from "express";

import { requireAuth } from "../../middlewares/require-auth.middleware.js";
import {
  createRecommendations,
  getRecommendations,
} from "./recommendation.controller.js";

export const recommendationRouter = Router();

recommendationRouter.use(requireAuth);
recommendationRouter.get("/", getRecommendations);
recommendationRouter.post("/refresh", createRecommendations);
