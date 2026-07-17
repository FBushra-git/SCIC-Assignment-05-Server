import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../../config/auth.js";
import { getAuthenticatedUser } from "../../middlewares/require-auth.middleware.js";
import { updateProfileSchema } from "./profile.schema.js";
import { getProfile, updateProfile } from "./profile.service.js";

export async function getMyProfile(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    const profile = await getProfile(user);

    response.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = getAuthenticatedUser(response);
    const input = updateProfileSchema.parse(request.body);

    // Keep display identity in Better Auth so the navbar and session stay in sync.
    await auth.api.updateUser({
      body: {
        name: input.fullName,
        image: input.profilePhoto,
      },
      headers: fromNodeHeaders(request.headers),
    });

    const result = await updateProfile(user, input);

    response.status(200).json({
      success: true,
      message: result.recommendationRefreshQueued
        ? "Profile saved. Your AI recommendations are queued for refresh."
        : "Profile saved successfully.",
      data: result.profile,
      meta: {
        recommendationRefreshQueued: result.recommendationRefreshQueued,
      },
    });
  } catch (error) {
    next(error);
  }
}
