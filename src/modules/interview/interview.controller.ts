import type { NextFunction, Request, Response } from "express";

import { getAuthenticatedUser } from "../../middlewares/require-auth.middleware.js";
import {
  generateInterviewSchema,
  updateInterviewQuestionSchema,
} from "./interview.schema.js";
import {
  generateInterviewSession,
  getInterviewDashboard,
  getInterviewSession,
  listInterviewSessions,
  updateInterviewQuestion,
} from "./interview.service.js";

function param(request: Request, key: string) {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export async function getDashboard(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(200).json({
      success: true,
      data: await getInterviewDashboard(user.id),
    });
  } catch (error) {
    next(error);
  }
}

export async function getSessions(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(200).json({
      success: true,
      data: await listInterviewSessions(user.id),
    });
  } catch (error) {
    next(error);
  }
}

export async function getSession(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(200).json({
      success: true,
      data: await getInterviewSession(user.id, param(request, "sessionId")),
    });
  } catch (error) {
    next(error);
  }
}

export async function createSession(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(201).json({
      success: true,
      message: "Your personalized interview session is ready.",
      data: await generateInterviewSession(
        user,
        generateInterviewSchema.parse(request.body),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateQuestion(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(200).json({
      success: true,
      message: "Interview question updated.",
      data: await updateInterviewQuestion(
        user.id,
        param(request, "sessionId"),
        param(request, "questionId"),
        updateInterviewQuestionSchema.parse(request.body),
      ),
    });
  } catch (error) {
    next(error);
  }
}
