import { Router } from "express";

import { requireAuth } from "../../middlewares/require-auth.middleware.js";
import {
  createSession,
  getDashboard,
  getSession,
  getSessions,
  updateQuestion,
} from "./interview.controller.js";

export const interviewRouter = Router();

interviewRouter.use(requireAuth);
interviewRouter.get("/dashboard", getDashboard);
interviewRouter.get("/sessions", getSessions);
interviewRouter.get("/sessions/:sessionId", getSession);
interviewRouter.post("/sessions", createSession);
interviewRouter.patch(
  "/sessions/:sessionId/questions/:questionId",
  updateQuestion,
);
