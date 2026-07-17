import type { NextFunction, Request, Response } from "express";

import { getAuthenticatedUser } from "../../middlewares/require-auth.middleware.js";
import { generateRoadmapSchema, updateRoadmapStepSchema } from "./roadmap.schema.js";
import {
  generateRoadmap,
  getActiveRoadmap,
  getRoadmap,
  listRoadmaps,
  updateRoadmapStep,
} from "./roadmap.service.js";

function param(request: Request, key: string) {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export async function createRoadmap(request: Request, response: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(response);
    const roadmap = await generateRoadmap(user, generateRoadmapSchema.parse(request.body));
    response.status(201).json({
      success: true,
      message: "Your AI roadmap is ready.",
      data: roadmap,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoadmaps(_request: Request, response: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(200).json({ success: true, data: await listRoadmaps(user.id) });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentRoadmap(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(200).json({ success: true, data: await getActiveRoadmap(user.id) });
  } catch (error) {
    next(error);
  }
}

export async function getRoadmapById(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(200).json({
      success: true,
      data: await getRoadmap(user.id, param(request, "roadmapId")),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStep(request: Request, response: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(response);
    const roadmap = await updateRoadmapStep(
      user.id,
      param(request, "roadmapId"),
      param(request, "stepId"),
      updateRoadmapStepSchema.parse(request.body),
    );
    response.status(200).json({
      success: true,
      message: "Learning progress updated.",
      data: roadmap,
    });
  } catch (error) {
    next(error);
  }
}
