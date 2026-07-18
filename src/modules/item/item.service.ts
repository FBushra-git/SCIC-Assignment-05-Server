import { ObjectId, type Filter, type Sort } from "mongodb";

import { database } from "../../config/database.js";
import type { AuthenticatedUser } from "../../middlewares/require-auth.middleware.js";
import { AppError } from "../../utils/app-error.js";
import type { ItemInput } from "./item.schema.js";

type ItemPriority = "Beginner" | "Intermediate" | "Advanced";

type ItemDocument = {
  userId: string;
  authorName: string;
  title: string;
  shortDescription: string;
  description: string;
  priority: ItemPriority;
  targetDate: string | null;
  imageUrl: string | null;
  technologies: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type ItemFilters = {
  search: string | undefined;
  priority: string | undefined;
  technology: string | undefined;
  sort: string | undefined;
  page: number | undefined;
  limit: number | undefined;
};

const items = database.collection<ItemDocument>("items");

function itemId(value: string) {
  if (!ObjectId.isValid(value)) throw new AppError(404, "Item not found.");
  return new ObjectId(value);
}

function toResponse(item: ItemDocument & { _id: ObjectId }) {
  const { _id, userId: _userId, ...data } = item;
  return {
    ...data,
    id: _id.toHexString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function queryFrom(filters: ItemFilters, ownerId?: string) {
  const query: Filter<ItemDocument> = ownerId ? { userId: ownerId } : {};
  const search = filters.search?.trim();

  if (search) {
    const escaped = search.replace(/[^a-zA-Z0-9\s-]/g, "\\$&");
    const expression = new RegExp(escaped, "i");
    query.$or = [
      { title: expression },
      { shortDescription: expression },
      { description: expression },
      { technologies: expression },
    ];
  }
  if (filters.priority) query.priority = filters.priority as ItemPriority;
  if (filters.technology) query.technologies = filters.technology;

  return query;
}

function sortFrom(value: string | undefined): Sort {
  if (value === "oldest") return { createdAt: 1 };
  if (value === "alphabetical") return { title: 1 };
  if (value === "deadline") return { targetDate: 1, createdAt: -1 };
  return { createdAt: -1 };
}

async function paginatedItems(filters: ItemFilters, ownerId?: string) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(24, Math.max(1, filters.limit ?? 8));
  const query = queryFrom(filters, ownerId);
  const totalItems = await items.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(page, totalPages);
  const records = await items
    .find(query)
    .sort(sortFrom(filters.sort))
    .skip((safePage - 1) * limit)
    .limit(limit)
    .toArray();
  const technologies = await items.distinct(
    "technologies",
    ownerId ? { userId: ownerId } : {},
  );

  return {
    items: records.map(toResponse),
    pagination: {
      page: safePage,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    },
    facets: {
      priorities: ["Beginner", "Intermediate", "Advanced"] as const,
      technologies: technologies.sort(),
    },
  };
}

export function listPublicItems(filters: ItemFilters) {
  return paginatedItems(filters);
}

export function listOwnedItems(userId: string, filters: ItemFilters) {
  return paginatedItems(filters, userId);
}

export async function getPublicItem(value: string) {
  const item = await items.findOne({ _id: itemId(value) });
  if (!item) throw new AppError(404, "Item not found.");

  const related = await items
    .find({
      _id: { $ne: item._id },
      technologies: { $in: item.technologies },
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .toArray();

  return { ...toResponse(item), related: related.map(toResponse) };
}

export async function getOwnedItem(userId: string, value: string) {
  const item = await items.findOne({ _id: itemId(value), userId });
  if (!item) throw new AppError(404, "Item not found.");
  return toResponse(item);
}

export async function createItem(user: AuthenticatedUser, input: ItemInput) {
  const now = new Date();
  const document: ItemDocument = {
    userId: user.id,
    authorName: user.name,
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  const result = await items.insertOne(document);

  await database.collection("activities").insertOne({
    userId: user.id,
    type: "item_created",
    title: `Created ${document.title}`,
    description: "Published a portfolio project brief.",
    durationMinutes: 0,
    createdAt: now,
  });

  return toResponse({ ...document, _id: result.insertedId });
}

export async function updateItem(user: AuthenticatedUser, value: string, input: ItemInput) {
  const _id = itemId(value);
  const existing = await items.findOne({ _id, userId: user.id });
  if (!existing) throw new AppError(404, "Item not found.");

  const updated: ItemDocument = {
    ...existing,
    ...input,
    authorName: user.name,
    updatedAt: new Date(),
  };
  await items.replaceOne({ _id, userId: user.id }, updated);
  return toResponse({ ...updated, _id });
}

export async function deleteItem(userId: string, value: string) {
  const _id = itemId(value);
  const result = await items.deleteOne({ _id, userId });
  if (!result.deletedCount) throw new AppError(404, "Item not found.");
}
