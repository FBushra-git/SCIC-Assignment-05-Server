import { Router } from "express";

import { requireAuth } from "../../middlewares/require-auth.middleware.js";
import {
  getMyItem,
  getMyItems,
  getPublicItemById,
  getPublicItems,
  postItem,
  putItem,
  removeItem,
} from "./item.controller.js";

export const itemRouter = Router();

itemRouter.get("/public", getPublicItems);
itemRouter.get("/public/:itemId", getPublicItemById);
itemRouter.get("/mine", requireAuth, getMyItems);
itemRouter.get("/mine/:itemId", requireAuth, getMyItem);
itemRouter.post("/", requireAuth, postItem);
itemRouter.put("/:itemId", requireAuth, putItem);
itemRouter.delete("/:itemId", requireAuth, removeItem);
