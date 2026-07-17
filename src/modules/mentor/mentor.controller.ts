import type { NextFunction, Request, Response } from "express";

import { getAuthenticatedUser } from "../../middlewares/require-auth.middleware.js";
import { sendMentorMessageSchema } from "./mentor.schema.js";
import {
  getConversation,
  listConversations,
  sendMentorMessage,
} from "./mentor.service.js";

function param(request: Request, key: string) {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export async function getMentorConversations(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(200).json({
      success: true,
      data: await listConversations(user.id),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMentorConversation(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(200).json({
      success: true,
      data: await getConversation(user.id, param(request, "conversationId")),
    });
  } catch (error) {
    next(error);
  }
}

export async function createMentorMessage(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(201).json({
      success: true,
      message: "Your mentor replied.",
      data: await sendMentorMessage(user, sendMentorMessageSchema.parse(request.body)),
    });
  } catch (error) {
    next(error);
  }
}
