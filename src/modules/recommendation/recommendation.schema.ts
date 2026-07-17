import { z } from "zod";

export const generatedRecommendationsSchema = z.object({
  summary: z.string().trim().min(10).max(500),
  items: z
    .array(
      z.object({
        type: z.enum(["learning", "project", "interview", "resource"]),
        title: z.string().trim().min(3).max(140),
        reason: z.string().trim().min(10).max(400),
        priority: z.enum(["high", "medium", "low"]),
        resources: z
          .array(
            z.object({
              title: z.string().trim().min(2).max(160),
              url: z.string().url(),
              type: z.enum([
                "Official Documentation",
                "Video",
                "Practice",
                "Article",
                "GitHub Repository",
              ]),
            }),
          )
          .max(4),
      }),
    )
    .min(3)
    .max(6),
});

export type GeneratedRecommendations = z.infer<typeof generatedRecommendationsSchema>;
