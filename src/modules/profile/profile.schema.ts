import { z } from "zod";

import {
  careerGoals,
  experienceLevels,
  learningStyles,
  proficiencyLevels,
  skillStatuses,
} from "./profile.constants.js";

const optionalUrl = z
  .string()
  .trim()
  .max(500, "Profile photo URL is too long.")
  .refine((value) => {
    if (!value) return true;

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid http or https image URL.")
  .transform((value) => value || null);

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.union([z.enum(values), z.literal("")]);

const skillSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, "Skill name is required.").max(50),
  proficiency: z.enum(proficiencyLevels),
  status: z.enum(skillStatuses),
});

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required.").max(80),
    profilePhoto: optionalUrl,
    currentEducation: z.string().trim().max(120),
    currentRole: z.string().trim().max(80),
    bio: z.string().trim().max(500),
    experienceLevel: optionalEnum(experienceLevels),
    careerGoal: optionalEnum(careerGoals),
    weeklyStudyHours: z.number().int().min(1).max(80),
    learningStyle: optionalEnum(learningStyles),
    preferredProgrammingLanguage: z.string().trim().max(50),
    skills: z.array(skillSchema).max(25, "You can add up to 25 skills."),
  })
  .strict()
  .superRefine((profile, context) => {
    const seenSkills = new Set<string>();

    profile.skills.forEach((skill, index) => {
      const normalizedName = skill.name.toLocaleLowerCase();
      if (seenSkills.has(normalizedName)) {
        context.addIssue({
          code: "custom",
          message: "Each skill can only be added once.",
          path: ["skills", index, "name"],
        });
      }
      seenSkills.add(normalizedName);
    });
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
