import type { NextFunction, Request, Response } from "express";

import {
  getAuthenticatedUser,
  getOptionalAuthenticatedUser,
} from "../../middlewares/require-auth.middleware.js";
import { updateProjectStatusSchema } from "./project.schema.js";
import {
  getProject,
  listProjects,
  updateProjectStatus,
} from "./project.service.js";

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

export async function getProjects(request: Request, response: Response, next: NextFunction) {
  try {
    const user = getOptionalAuthenticatedUser(response);
    response.status(200).json({
      success: true,
      data: await listProjects(user?.id, {
        search: value(request.query.search as string | string[] | undefined),
        difficulty: value(request.query.difficulty as string | string[] | undefined),
        technology: value(request.query.technology as string | string[] | undefined),
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectBySlug(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getOptionalAuthenticatedUser(response);
    response.status(200).json({
      success: true,
      data: await getProject(user?.id, value(request.params.slug) ?? ""),
    });
  } catch (error) {
    next(error);
  }
}

export async function setProjectStatus(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    const { status } = updateProjectStatusSchema.parse(request.body);
    response.status(200).json({
      success: true,
      message: "Project progress updated.",
      data: await updateProjectStatus(
        user.id,
        value(request.params.slug) ?? "",
        status,
      ),
    });
  } catch (error) {
    next(error);
  }
}
