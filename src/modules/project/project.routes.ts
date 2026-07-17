import { Router } from "express";

import { requireAuth } from "../../middlewares/require-auth.middleware.js";
import {
  getProjectBySlug,
  getProjects,
  setProjectStatus,
} from "./project.controller.js";

export const projectRouter = Router();

projectRouter.use(requireAuth);
projectRouter.get("/", getProjects);
projectRouter.get("/:slug", getProjectBySlug);
projectRouter.patch("/:slug/status", setProjectStatus);
