import type { NextFunction, Request, Response } from "express";

import { getAuthenticatedUser } from "../../middlewares/require-auth.middleware.js";
import {
  getLatestRecommendations,
  refreshRecommendations,
} from "./recommendation.service.js";

export async function getRecommendations(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(200).json({
      success: true,
      data: await getLatestRecommendations(user.id),
    });
  } catch (error) {
    next(error);
  }
}

export async function createRecommendations(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(201).json({
      success: true,
      message: "Your AI recommendations have been refreshed.",
      data: await refreshRecommendations(user),
    });
  } catch (error) {
    next(error);
  }
}
