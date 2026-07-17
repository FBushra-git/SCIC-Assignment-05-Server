import type { NextFunction, Request, Response } from "express";

import {
  getLearningResource,
  listLearningResources,
} from "./resource.service.js";

function value(input: unknown) {
  if (Array.isArray(input)) return String(input[0] ?? "");
  return typeof input === "string" ? input : undefined;
}

function positiveInteger(input: unknown) {
  const parsed = Number(value(input));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function getResources(request: Request, response: Response) {
  response.status(200).json({
    success: true,
    data: listLearningResources({
      search: value(request.query.search),
      type: value(request.query.type),
      difficulty: value(request.query.difficulty),
      technology: value(request.query.technology),
      page: positiveInteger(request.query.page),
      limit: positiveInteger(request.query.limit),
    }),
  });
}

export function getResourceById(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const resourceId = value(request.params.resourceId) ?? "";
    response.status(200).json({
      success: true,
      data: getLearningResource(resourceId),
    });
  } catch (error) {
    next(error);
  }
}
