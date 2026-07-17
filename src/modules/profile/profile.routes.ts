import { Router } from "express";

import { requireAuth } from "../../middlewares/require-auth.middleware.js";
import { getMyProfile, updateMyProfile } from "./profile.controller.js";

export const profileRouter = Router();

profileRouter.get("/me", requireAuth, getMyProfile);
profileRouter.put("/me", requireAuth, updateMyProfile);
