import { z } from "zod";

const imageUrlSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .url("Image URL must be a valid URL.")
      .refine((value) => value.startsWith("https://"), "Image URL must use HTTPS."),
  ])
  .transform((value) => value || null);

export const itemInputSchema = z.object({
  title: z.string().trim().min(3).max(100),
  shortDescription: z.string().trim().min(20).max(180),
  description: z.string().trim().min(80).max(5000),
  priority: z.enum(["Beginner", "Intermediate", "Advanced"]),
  targetDate: z.union([z.iso.date(), z.literal(""), z.null()]).transform((value) => value || null),
  imageUrl: imageUrlSchema,
  technologies: z
    .array(z.string().trim().min(1).max(40))
    .min(1)
    .max(8)
    .transform((values) => [...new Set(values)]),
});

export type ItemInput = z.infer<typeof itemInputSchema>;
