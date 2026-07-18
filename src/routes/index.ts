import { Router } from "express";

import { dashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { interviewRouter } from "../modules/interview/interview.routes.js";
import { itemRouter } from "../modules/item/item.routes.js";
import { mentorRouter } from "../modules/mentor/mentor.routes.js";
import { platformRouter } from "../modules/platform/platform.routes.js";
import { profileRouter } from "../modules/profile/profile.routes.js";
import { projectRouter } from "../modules/project/project.routes.js";
import { publicRoadmapRouter } from "../modules/public-roadmap/public-roadmap.routes.js";
import { recommendationRouter } from "../modules/recommendation/recommendation.routes.js";
import { resourceRouter } from "../modules/resource/resource.routes.js";
import { roadmapRouter } from "../modules/roadmap/roadmap.routes.js";
import { healthRouter } from "./health.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/interviews", interviewRouter);
apiRouter.use("/items", itemRouter);
apiRouter.use("/mentor", mentorRouter);
apiRouter.use("/platform", platformRouter);
apiRouter.use("/profiles", profileRouter);
apiRouter.use("/projects", projectRouter);
apiRouter.use("/public-roadmaps", publicRoadmapRouter);
apiRouter.use("/roadmaps", roadmapRouter);
apiRouter.use("/recommendations", recommendationRouter);
apiRouter.use("/resources", resourceRouter);
