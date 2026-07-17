import { randomUUID } from "node:crypto";

import { database } from "../../config/database.js";
import { env } from "../../config/env.js";
import type { AuthenticatedUser } from "../../middlewares/require-auth.middleware.js";
import { generateGeminiStructured } from "../ai/gemini.service.js";
import { generatedRecommendationsSchema } from "./recommendation.schema.js";
import type { GeneratedRecommendations } from "./recommendation.schema.js";

type RecommendationDocument = GeneratedRecommendations & {
  userId: string;
  items: Array<GeneratedRecommendations["items"][number] & { id: string }>;
  model: string;
  createdAt: Date;
};

const recommendations =
  database.collection<RecommendationDocument>("recommendations");

const recommendationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "items"],
  properties: {
    summary: { type: "string" },
    items: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "reason", "priority", "resources"],
        properties: {
          type: {
            type: "string",
            enum: ["learning", "project", "interview", "resource"],
          },
          title: { type: "string" },
          reason: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          resources: {
            type: "array",
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "url", "type"],
              properties: {
                title: { type: "string" },
                url: { type: "string" },
                type: {
                  type: "string",
                  enum: [
                    "Official Documentation",
                    "Video",
                    "Practice",
                    "Article",
                    "GitHub Repository",
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Record<string, unknown>;

function toResponse(item: RecommendationDocument & { _id: unknown }) {
  const { _id, ...data } = item;
  return {
    ...data,
    id: String(_id),
    createdAt: item.createdAt.toISOString(),
  };
}

export async function getLatestRecommendations(userId: string) {
  const item = await recommendations.findOne(
    { userId },
    { sort: { createdAt: -1 } },
  );
  return item ? toResponse(item) : null;
}

export async function refreshRecommendations(user: AuthenticatedUser) {
  const [profile, roadmap, projects] = await Promise.all([
    database.collection("profiles").findOne({ userId: user.id }),
    database
      .collection("roadmaps")
      .findOne({ userId: user.id, status: "active" }, { sort: { updatedAt: -1 } }),
    database.collection("projects").find({ userId: user.id }).toArray(),
  ]);

  const skills = Array.isArray(profile?.skills)
    ? profile.skills
        .map((skill) =>
          typeof skill === "object" && skill && "name" in skill
            ? `${String(skill.name)} (${String("status" in skill ? skill.status : "unknown")})`
            : "",
        )
        .filter(Boolean)
    : [];
  const steps = Array.isArray(roadmap?.steps) ? roadmap.steps : [];
  const completedTopics = steps
    .filter((step) => typeof step === "object" && step && "completed" in step && step.completed)
    .map((step) =>
      typeof step === "object" && step && "topicName" in step
        ? String(step.topicName)
        : "",
    )
    .filter(Boolean);
  const remainingTopics = steps
    .filter((step) => typeof step === "object" && step && "completed" in step && !step.completed)
    .slice(0, 5)
    .map((step) =>
      typeof step === "object" && step && "topicName" in step
        ? String(step.topicName)
        : "",
    )
    .filter(Boolean);

  const generated = await generateGeminiStructured({
    systemInstruction:
      "You are SkillForge AI's recommendation engine. Recommend the smallest high-value next actions, explain why each fits this learner, and avoid generic advice. Include at least one learning, project, and interview recommendation. Use stable official resources when possible.",
    prompt: `Create fresh recommendations from this learner state.
Career goal: ${String(profile?.careerGoal || "Not selected")}
Experience: ${String(profile?.experienceLevel || "Not selected")}
Weekly study hours: ${String(profile?.weeklyStudyHours || 10)}
Skills: ${skills.join(", ") || "None declared"}
Current roadmap: ${String(roadmap?.title || "No active roadmap")}
Completed topics: ${completedTopics.join(", ") || "None"}
Upcoming topics: ${remainingTopics.join(", ") || "None"}
Projects: ${projects.map((project) => `${String(project.projectName || project.projectSlug || "Project")} (${String(project.status)})`).join(", ") || "None"}

Prioritize prerequisite gaps and actions achievable in the learner's weekly schedule. Do not invent URLs.`,
    responseJsonSchema: recommendationJsonSchema,
    validator: generatedRecommendationsSchema,
    temperature: 0.4,
  });

  const now = new Date();
  const document: RecommendationDocument = {
    ...generated,
    userId: user.id,
    items: generated.items.map((item) => ({ ...item, id: randomUUID() })),
    model: env.GEMINI_MODEL,
    createdAt: now,
  };
  const inserted = await recommendations.insertOne(document);
  await database.collection("profiles").updateOne(
    { userId: user.id },
    {
      $set: { recommendationStatus: "ready", updatedAt: now },
      $inc: { recommendationVersion: 1 },
    },
  );

  return toResponse({ ...document, _id: inserted.insertedId });
}
