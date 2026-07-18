import { z } from "zod";

export const newsletterInputSchema = z.object({
  email: z.string().trim().email().max(254),
});

export const contactInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  kind: z.enum(["general", "support", "account_recovery"]),
  subject: z.string().trim().min(4).max(120),
  message: z.string().trim().min(20).max(3000),
});

export type NewsletterInput = z.infer<typeof newsletterInputSchema>;
export type ContactInput = z.infer<typeof contactInputSchema>;
