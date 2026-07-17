import { Router } from "express";

import { getResourceById, getResources } from "./resource.controller.js";

export const resourceRouter = Router();

resourceRouter.get("/", getResources);
resourceRouter.get("/:resourceId", getResourceById);
