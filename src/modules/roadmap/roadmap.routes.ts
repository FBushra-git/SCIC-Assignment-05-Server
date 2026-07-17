import { Router } from "express";

import { requireAuth } from "../../middlewares/require-auth.middleware.js";
import {
  createRoadmap,
  getCurrentRoadmap,
  getRoadmapById,
  getRoadmaps,
  updateStep,
} from "./roadmap.controller.js";

export const roadmapRouter = Router();

roadmapRouter.use(requireAuth);
roadmapRouter.get("/", getRoadmaps);
roadmapRouter.get("/active", getCurrentRoadmap);
roadmapRouter.get("/:roadmapId", getRoadmapById);
roadmapRouter.post("/generate", createRoadmap);
roadmapRouter.patch("/:roadmapId/steps/:stepId", updateStep);
