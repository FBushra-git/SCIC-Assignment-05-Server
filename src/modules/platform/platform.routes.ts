import { Router } from "express";

import { getStats, postContact, postNewsletter } from "./platform.controller.js";

export const platformRouter = Router();

platformRouter.get("/stats", getStats);
platformRouter.post("/newsletter", postNewsletter);
platformRouter.post("/contact", postContact);
