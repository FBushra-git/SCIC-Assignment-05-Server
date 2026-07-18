import type { NextFunction, Request, Response } from "express";

import { contactInputSchema, newsletterInputSchema } from "./platform.schema.js";
import {
  createContactRequest,
  getPlatformStats,
  subscribeToNewsletter,
} from "./platform.service.js";

export async function getStats(_request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ success: true, data: await getPlatformStats() });
  } catch (error) {
    next(error);
  }
}

export async function postNewsletter(request: Request, response: Response, next: NextFunction) {
  try {
    await subscribeToNewsletter(newsletterInputSchema.parse(request.body));
    response.status(200).json({
      success: true,
      message: "Subscription saved successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function postContact(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(201).json({
      success: true,
      message: "Your request has been received.",
      data: await createContactRequest(contactInputSchema.parse(request.body)),
    });
  } catch (error) {
    next(error);
  }
}
