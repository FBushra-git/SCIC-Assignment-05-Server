import { z } from "zod";

export const sendMentorMessageSchema = z
  .object({
    message: z.string().trim().min(1, "Write a question for your mentor.").max(4_000),
    conversationId: z.string().trim().optional(),
  })
  .strict();

export type SendMentorMessageInput = z.infer<typeof sendMentorMessageSchema>;
