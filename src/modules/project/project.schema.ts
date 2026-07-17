import { z } from "zod";

export const updateProjectStatusSchema = z
  .object({
    status: z.enum(["planned", "in_progress", "completed"]),
  })
  .strict();
