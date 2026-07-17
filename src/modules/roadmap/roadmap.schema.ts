import { z } from "zod";

import { careerGoals, experienceLevels } from "../profile/profile.constants.js";

export const generateRoadmapSchema = z
  .object({
    careerGoal: z.enum(careerGoals),
    experienceLevel: z.enum(experienceLevels),
    existingSkills: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
    weeklyStudyHours: z.number().int().min(1).max(80),
    targetCompletionDate: z
      .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal(""), z.null()])
      .optional(),
  })
  .strict();

export const roadmapResourceSchema = z.object({
  title: z.string().trim().min(1).max(160),
  type: z.enum([
    "Official Documentation",
    "Video",
    "Course",
    "Article",
    "Practice",
    "GitHub Repository",
  ]),
  url: z.string().url(),
});

export const generatedRoadmapSchema = z.object({
  title: z.string().trim().min(5).max(160),
  summary: z.string().trim().min(20).max(800),
  estimatedDurationWeeks: z.number().int().min(1).max(52),
  phases: z
    .array(
      z.object({
        title: z.string().trim().min(2).max(100),
        description: z.string().trim().min(10).max(400),
        startWeek: z.number().int().min(1).max(52),
        endWeek: z.number().int().min(1).max(52),
      }),
    )
    .min(1)
    .max(12),
  steps: z
    .array(
      z.object({
        weekNumber: z.number().int().min(1).max(52),
        topicName: z.string().trim().min(2).max(140),
        objectives: z.array(z.string().trim().min(3).max(220)).min(2).max(8),
        estimatedHours: z.number().min(1).max(80),
        resources: z.array(roadmapResourceSchema).min(1).max(6),
        practiceSuggestions: z
          .array(z.string().trim().min(3).max(240))
          .min(1)
          .max(6),
        suggestedProject: z.object({
          title: z.string().trim().min(2).max(120),
          description: z.string().trim().min(10).max(400),
          deliverables: z.array(z.string().trim().min(2).max(180)).min(1).max(8),
        }),
        interviewCheckpoint: z.string().trim().min(5).max(350),
      }),
    )
    .min(1)
    .max(52),
});

export const updateRoadmapStepSchema = z
  .object({
    completed: z.boolean(),
    studyMinutes: z.number().int().min(0).max(10_080).optional(),
  })
  .strict();

export type GenerateRoadmapInput = z.infer<typeof generateRoadmapSchema>;
export type GeneratedRoadmap = z.infer<typeof generatedRoadmapSchema>;
export type UpdateRoadmapStepInput = z.infer<typeof updateRoadmapStepSchema>;
