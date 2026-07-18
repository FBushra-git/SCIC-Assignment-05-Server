import { Router } from "express";

import {
  optionalAuth,
  requireAuth,
} from "../../middlewares/require-auth.middleware.js";
import {
  getProjectBySlug,
  getProjects,
  setProjectStatus,
} from "./project.controller.js";

export const projectRouter = Router();

projectRouter.get("/", optionalAuth, getProjects);
projectRouter.get("/:slug", optionalAuth, getProjectBySlug);
projectRouter.patch("/:slug/status", requireAuth, setProjectStatus);
