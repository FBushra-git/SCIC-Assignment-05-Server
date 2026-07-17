import { Router } from "express";

import { requireAuth } from "../../middlewares/require-auth.middleware.js";
import { getMyDashboard } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, getMyDashboard);
