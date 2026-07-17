import type { NextFunction, Request, Response } from "express";

import {
  getPublicRoadmap,
  listPublicRoadmaps,
} from "./public-roadmap.service.js";

function value(input: unknown) {
  if (Array.isArray(input)) return String(input[0] ?? "");
  return typeof input === "string" ? input : undefined;
}

function positiveInteger(input: unknown) {
  const parsed = Number(value(input));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function getPublicRoadmaps(request: Request, response: Response) {
  response.status(200).json({
    success: true,
    data: listPublicRoadmaps({
      search: value(request.query.search),
      career: value(request.query.career),
      category: value(request.query.category),
      difficulty: value(request.query.difficulty),
      duration: value(request.query.duration),
      technology: value(request.query.technology),
      popularity: value(request.query.popularity),
      sort: value(request.query.sort),
      page: positiveInteger(request.query.page),
      limit: positiveInteger(request.query.limit),
    }),
  });
}

export function getPublicRoadmapBySlug(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({
      success: true,
      data: getPublicRoadmap(value(request.params.slug) ?? ""),
    });
  } catch (error) {
    next(error);
  }
}
