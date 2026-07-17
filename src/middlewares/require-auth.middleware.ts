import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../config/auth.js";
import { AppError } from "../utils/app-error.js";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

/** Resolve the Better Auth session and scope application routes to its user id. */
export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session?.user) {
      throw new AppError(401, "Please sign in to continue.");
    }

    response.locals.authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image ?? null,
    } satisfies AuthenticatedUser;

    next();
  } catch (error) {
    next(error);
  }
}

export function getAuthenticatedUser(response: Response) {
  const user = response.locals.authUser as AuthenticatedUser | undefined;

  if (!user) {
    throw new AppError(401, "Please sign in to continue.");
  }

  return user;
}
