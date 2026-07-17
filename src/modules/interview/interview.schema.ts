import { z } from "zod";

export const generateInterviewSchema = z
  .object({
    careerGoal: z.string().trim().min(2).max(80),
    technology: z.string().trim().min(1).max(60),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  })
  .strict();

export const generatedInterviewSchema = z.object({
  title: z.string().trim().min(5).max(160),
  overview: z.string().trim().min(20).max(700),
  weakAreas: z.array(z.string().trim().min(2).max(120)).min(2).max(6),
  revisionTips: z.array(z.string().trim().min(5).max(260)).min(3).max(8),
  questions: z
    .array(
      z.object({
        type: z.enum(["Technical", "Concept", "Coding", "HR"]),
        question: z.string().trim().min(8).max(600),
        explanation: z.string().trim().min(15).max(1_500),
        answerOutline: z.array(z.string().trim().min(3).max(300)).min(2).max(8),
        codingPrompt: z.string().max(1_500),
        difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
        technology: z.string().trim().min(1).max(80),
      }),
    )
    .min(8)
    .max(12),
});

export const updateInterviewQuestionSchema = z
  .object({
    bookmarked: z.boolean().optional(),
    completed: z.boolean().optional(),
  })
  .strict()
  .refine(
    (input) => input.bookmarked !== undefined || input.completed !== undefined,
    "Provide a bookmark or completion update.",
  );

export type GenerateInterviewInput = z.infer<typeof generateInterviewSchema>;
export type GeneratedInterview = z.infer<typeof generatedInterviewSchema>;
export type UpdateInterviewQuestionInput = z.infer<
  typeof updateInterviewQuestionSchema
>;
