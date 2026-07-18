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

async function resolveAuthenticatedUser(
  request: Request,
): Promise<AuthenticatedUser | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image ?? null,
  };
}

/** Add session context when available without blocking public catalog reads. */
export async function optionalAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = await resolveAuthenticatedUser(request);
    if (user) response.locals.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

/** Resolve the Better Auth session and scope application routes to its user id. */
export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = await resolveAuthenticatedUser(request);
    if (!user) throw new AppError(401, "Please sign in to continue.");

    response.locals.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function getAuthenticatedUser(response: Response) {
  const user = getOptionalAuthenticatedUser(response);

  if (!user) {
    throw new AppError(401, "Please sign in to continue.");
  }

  return user;
}

export function getOptionalAuthenticatedUser(response: Response) {
  return response.locals.authUser as AuthenticatedUser | undefined;
}
