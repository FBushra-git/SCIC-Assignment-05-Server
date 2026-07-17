import type { NextFunction, Request, Response } from "express";

import { getAuthenticatedUser } from "../../middlewares/require-auth.middleware.js";
import { getDashboard } from "./dashboard.service.js";

export async function getMyDashboard(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    const dashboard = await getDashboard(user);
    response.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
}
