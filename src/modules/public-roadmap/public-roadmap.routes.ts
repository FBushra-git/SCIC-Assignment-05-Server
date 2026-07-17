import { Router } from "express";

import {
  getPublicRoadmapBySlug,
  getPublicRoadmaps,
} from "./public-roadmap.controller.js";

export const publicRoadmapRouter = Router();

publicRoadmapRouter.get("/", getPublicRoadmaps);
publicRoadmapRouter.get("/:slug", getPublicRoadmapBySlug);
