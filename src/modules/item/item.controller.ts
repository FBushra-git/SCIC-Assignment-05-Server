import type { NextFunction, Request, Response } from "express";

import { getAuthenticatedUser } from "../../middlewares/require-auth.middleware.js";
import { itemInputSchema } from "./item.schema.js";
import {
  createItem,
  deleteItem,
  getOwnedItem,
  getPublicItem,
  listOwnedItems,
  listPublicItems,
  updateItem,
  type ItemFilters,
} from "./item.service.js";

function value(input: unknown) {
  return typeof input === "string" ? input : undefined;
}

function positiveInteger(input: unknown) {
  const parsed = Number(value(input));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function filters(request: Request): ItemFilters {
  return {
    search: value(request.query.search),
    priority: value(request.query.priority),
    technology: value(request.query.technology),
    sort: value(request.query.sort),
    page: positiveInteger(request.query.page),
    limit: positiveInteger(request.query.limit),
  };
}

function param(request: Request, key: string) {
  const result = request.params[key];
  return Array.isArray(result) ? result[0] ?? "" : result ?? "";
}

export async function getPublicItems(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ success: true, data: await listPublicItems(filters(request)) });
  } catch (error) {
    next(error);
  }
}

export async function getPublicItemById(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({
      success: true,
      data: await getPublicItem(param(request, "itemId")),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyItems(request: Request, response: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(200).json({
      success: true,
      data: await listOwnedItems(user.id, filters(request)),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyItem(request: Request, response: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(200).json({
      success: true,
      data: await getOwnedItem(user.id, param(request, "itemId")),
    });
  } catch (error) {
    next(error);
  }
}

export async function postItem(request: Request, response: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(201).json({
      success: true,
      message: "Item created successfully.",
      data: await createItem(user, itemInputSchema.parse(request.body)),
    });
  } catch (error) {
    next(error);
  }
}

export async function putItem(request: Request, response: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(response);
    response.status(200).json({
      success: true,
      message: "Item updated successfully.",
      data: await updateItem(
        user,
        param(request, "itemId"),
        itemInputSchema.parse(request.body),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function removeItem(request: Request, response: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(response);
    await deleteItem(user.id, param(request, "itemId"));
    response.status(200).json({ success: true, message: "Item deleted successfully." });
  } catch (error) {
    next(error);
  }
}
