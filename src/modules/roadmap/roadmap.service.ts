import { randomUUID } from "node:crypto";

import { ObjectId } from "mongodb";

import { database } from "../../config/database.js";
import { env } from "../../config/env.js";
import type { AuthenticatedUser } from "../../middlewares/require-auth.middleware.js";
import { AppError } from "../../utils/app-error.js";
import { generateGeminiStructured } from "../ai/gemini.service.js";
import { generatedRoadmapSchema } from "./roadmap.schema.js";
import type {
  GenerateRoadmapInput,
  GeneratedRoadmap,
  UpdateRoadmapStepInput,
} from "./roadmap.schema.js";

type RoadmapStep = GeneratedRoadmap["steps"][number] & {
  id: string;
  completed: boolean;
  completedAt: Date | null;
};

type RoadmapDocument = Omit<GeneratedRoadmap, "steps"> & {
  userId: string;
  careerGoal: GenerateRoadmapInput["careerGoal"];
  experienceLevel: GenerateRoadmapInput["experienceLevel"];
  existingSkills: string[];
  weeklyStudyHours: number;
  targetCompletionDate: Date | null;
  status: "active" | "completed" | "draft";
  currentWeek: number;
  totalWeeks: number;
  nextLesson: string;
  totalTopics: number;
  completedTopics: number;
  progress: number;
  estimatedCompletion: Date;
  steps: RoadmapStep[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
};

const roadmaps = database.collection<RoadmapDocument>("roadmaps");

const roadmapJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "estimatedDurationWeeks", "phases", "steps"],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    estimatedDurationWeeks: { type: "integer", minimum: 1, maximum: 52 },
    phases: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "startWeek", "endWeek"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          startWeek: { type: "integer" },
          endWeek: { type: "integer" },
        },
      },
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "weekNumber",
          "topicName",
          "objectives",
          "estimatedHours",
          "resources",
          "practiceSuggestions",
          "suggestedProject",
          "interviewCheckpoint",
        ],
        properties: {
          weekNumber: { type: "integer" },
          topicName: { type: "string" },
          objectives: { type: "array", items: { type: "string" } },
          estimatedHours: { type: "number" },
          resources: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "type", "url"],
              properties: {
                title: { type: "string" },
                type: {
                  type: "string",
                  enum: [
                    "Official Documentation",
                    "Video",
                    "Course",
                    "Article",
                    "Practice",
                    "GitHub Repository",
                  ],
                },
                url: { type: "string" },
              },
            },
          },
          practiceSuggestions: { type: "array", items: { type: "string" } },
          suggestedProject: {
            type: "object",
            additionalProperties: false,
            required: ["title", "description", "deliverables"],
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              deliverables: { type: "array", items: { type: "string" } },
            },
          },
          interviewCheckpoint: { type: "string" },
        },
      },
    },
  },
} satisfies Record<string, unknown>;

function objectId(value: string) {
  if (!ObjectId.isValid(value)) throw new AppError(404, "Roadmap not found.");
  return new ObjectId(value);
}

function toResponse(roadmap: RoadmapDocument & { _id: ObjectId }) {
  const { _id, ...data } = roadmap;
  return {
    ...data,
    id: _id.toHexString(),
    targetCompletionDate: roadmap.targetCompletionDate?.toISOString() ?? null,
    estimatedCompletion: roadmap.estimatedCompletion.toISOString(),
    createdAt: roadmap.createdAt.toISOString(),
    updatedAt: roadmap.updatedAt.toISOString(),
    steps: roadmap.steps.map((step) => ({
      ...step,
      completedAt: step.completedAt?.toISOString() ?? null,
    })),
  };
}

function estimateCompletion(input: GenerateRoadmapInput, weeks: number) {
  if (input.targetCompletionDate) {
    const target = new Date(`${input.targetCompletionDate}T23:59:59.999Z`);
    if (!Number.isNaN(target.getTime()) && target > new Date()) return target;
  }

  const target = new Date();
  target.setDate(target.getDate() + weeks * 7);
  return target;
}

export async function generateRoadmap(user: AuthenticatedUser, input: GenerateRoadmapInput) {
  const profile = await database.collection("profiles").findOne({ userId: user.id });
  const deadline = input.targetCompletionDate
    ? `Target completion date: ${input.targetCompletionDate}.`
    : "No fixed deadline; choose a sustainable duration.";

  const generated = await generateGeminiStructured({
    systemInstruction:
      "You are SkillForge AI, a senior curriculum architect. Create progressive, practical career roadmaps. Respect the learner's time, never skip prerequisites, include portfolio evidence and interview checkpoints, and recommend stable reputable resources. Return only data matching the supplied schema.",
    prompt: `Create a personalized roadmap for this learner.
Career goal: ${input.careerGoal}
Experience: ${input.experienceLevel}
Existing skills: ${input.existingSkills.join(", ") || "None declared"}
Weekly study time: ${input.weeklyStudyHours} hours.
${deadline}
Preferred learning style: ${String(profile?.learningStyle || "Mixed")}
Preferred language: ${String(profile?.preferredProgrammingLanguage || "No preference")}

Use one sequential step per week. Keep weekly estimated hours within the learner's available time. Prefer official documentation and stable reputable URLs. Each week needs concrete objectives, practice, a small portfolio deliverable, and an interview checkpoint.`,
    responseJsonSchema: roadmapJsonSchema,
    validator: generatedRoadmapSchema,
  });

  const now = new Date();
  const steps = [...generated.steps]
    .sort((left, right) => left.weekNumber - right.weekNumber)
    .map((step, index) => ({
      ...step,
      weekNumber: index + 1,
      estimatedHours: Math.min(step.estimatedHours, input.weeklyStudyHours),
      id: randomUUID(),
      completed: false,
      completedAt: null,
    }));
  const totalWeeks = steps.length;
  const targetCompletionDate = input.targetCompletionDate
    ? new Date(`${input.targetCompletionDate}T23:59:59.999Z`)
    : null;
  const document: RoadmapDocument = {
    ...generated,
    estimatedDurationWeeks: totalWeeks,
    userId: user.id,
    careerGoal: input.careerGoal,
    experienceLevel: input.experienceLevel,
    existingSkills: input.existingSkills,
    weeklyStudyHours: input.weeklyStudyHours,
    targetCompletionDate,
    status: "active",
    currentWeek: 1,
    totalWeeks,
    nextLesson: steps[0]?.topicName ?? "Review your roadmap",
    totalTopics: totalWeeks,
    completedTopics: 0,
    progress: 0,
    estimatedCompletion: estimateCompletion(input, totalWeeks),
    steps,
    model: env.GEMINI_MODEL,
    createdAt: now,
    updatedAt: now,
  };

  await roadmaps.updateMany(
    { userId: user.id, status: "active" },
    { $set: { status: "draft", updatedAt: now } },
  );
  const inserted = await roadmaps.insertOne(document);
  await database.collection("activities").insertOne({
    userId: user.id,
    type: "roadmap_generated",
    title: "Generated a personalized roadmap",
    description: `${document.title} · ${totalWeeks} weeks`,
    durationMinutes: 0,
    createdAt: now,
  });
  await database.collection("profiles").updateOne(
    { userId: user.id },
    { $set: { recommendationStatus: "refresh_pending", updatedAt: now } },
  );

  return toResponse({ ...document, _id: inserted.insertedId });
}

export async function listRoadmaps(userId: string) {
  const items = await roadmaps.find({ userId }).sort({ updatedAt: -1 }).toArray();
  return items.map(toResponse);
}

export async function getActiveRoadmap(userId: string) {
  const roadmap = await roadmaps.findOne({ userId, status: "active" });
  return roadmap ? toResponse(roadmap) : null;
}

export async function getRoadmap(userId: string, roadmapId: string) {
  const roadmap = await roadmaps.findOne({ _id: objectId(roadmapId), userId });
  if (!roadmap) throw new AppError(404, "Roadmap not found.");
  return toResponse(roadmap);
}

export async function updateRoadmapStep(
  userId: string,
  roadmapId: string,
  stepId: string,
  input: UpdateRoadmapStepInput,
) {
  const _id = objectId(roadmapId);
  const roadmap = await roadmaps.findOne({ _id, userId });
  if (!roadmap) throw new AppError(404, "Roadmap not found.");

  const stepIndex = roadmap.steps.findIndex((step) => step.id === stepId);
  const existingStep = roadmap.steps[stepIndex];
  if (stepIndex < 0 || !existingStep) throw new AppError(404, "Roadmap step not found.");

  const now = new Date();
  const newlyCompleted = input.completed && !existingStep.completed;
  roadmap.steps[stepIndex] = {
    ...existingStep,
    completed: input.completed,
    completedAt: input.completed ? existingStep.completedAt ?? now : null,
  };
  const completedTopics = roadmap.steps.filter((step) => step.completed).length;
  const nextStep = roadmap.steps.find((step) => !step.completed);
  const progress = Math.round((completedTopics / Math.max(roadmap.steps.length, 1)) * 100);

  roadmap.completedTopics = completedTopics;
  roadmap.progress = progress;
  roadmap.currentWeek = nextStep?.weekNumber ?? roadmap.totalWeeks;
  roadmap.nextLesson = nextStep?.topicName ?? "Roadmap completed";
  roadmap.status = progress === 100 ? "completed" : "active";
  roadmap.updatedAt = now;

  await roadmaps.replaceOne({ _id, userId }, roadmap);
  if (newlyCompleted) {
    await database.collection("activities").insertOne({
      userId,
      type: "lesson_completed",
      title: `Completed ${existingStep.topicName}`,
      description: `Week ${existingStep.weekNumber} of ${roadmap.title}`,
      durationMinutes: input.studyMinutes ?? 0,
      createdAt: now,
    });
  }
  await database.collection("profiles").updateOne(
    { userId },
    { $set: { recommendationStatus: "refresh_pending", updatedAt: now } },
  );
  return toResponse(roadmap);
}
