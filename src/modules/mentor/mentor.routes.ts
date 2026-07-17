import { Router } from "express";

import { requireAuth } from "../../middlewares/require-auth.middleware.js";
import {
  createMentorMessage,
  getMentorConversation,
  getMentorConversations,
} from "./mentor.controller.js";

export const mentorRouter = Router();

mentorRouter.use(requireAuth);
mentorRouter.get("/conversations", getMentorConversations);
mentorRouter.get("/conversations/:conversationId", getMentorConversation);
mentorRouter.post("/messages", createMentorMessage);
