import { randomUUID } from "node:crypto";

import { ObjectId } from "mongodb";

import { database } from "../../config/database.js";
import { env } from "../../config/env.js";
import type { AuthenticatedUser } from "../../middlewares/require-auth.middleware.js";
import { AppError } from "../../utils/app-error.js";
import { generateGeminiStructured } from "../ai/gemini.service.js";
import { generatedInterviewSchema } from "./interview.schema.js";
import type {
  GenerateInterviewInput,
  GeneratedInterview,
  UpdateInterviewQuestionInput,
} from "./interview.schema.js";

type InterviewQuestion = GeneratedInterview["questions"][number] & {
  id: string;
  bookmarked: boolean;
  completed: boolean;
  completedAt: Date | null;
};

type InterviewSessionDocument = Omit<GeneratedInterview, "questions"> & {
  userId: string;
  careerGoal: string;
  technology: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  questions: InterviewQuestion[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
};

const sessions =
  database.collection<InterviewSessionDocument>("interviewSessions");

const interviewJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "overview", "weakAreas", "revisionTips", "questions"],
  properties: {
    title: { type: "string" },
    overview: { type: "string" },
    weakAreas: { type: "array", items: { type: "string" } },
    revisionTips: { type: "array", items: { type: "string" } },
    questions: {
      type: "array",
      minItems: 8,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "type",
          "question",
          "explanation",
          "answerOutline",
          "codingPrompt",
          "difficulty",
          "technology",
        ],
        properties: {
          type: {
            type: "string",
            enum: ["Technical", "Concept", "Coding", "HR"],
          },
          question: { type: "string" },
          explanation: { type: "string" },
          answerOutline: { type: "array", items: { type: "string" } },
          codingPrompt: { type: "string" },
          difficulty: {
            type: "string",
            enum: ["Beginner", "Intermediate", "Advanced"],
          },
          technology: { type: "string" },
        },
      },
    },
  },
} satisfies Record<string, unknown>;

function sessionId(value: string) {
  if (!ObjectId.isValid(value)) {
    throw new AppError(404, "Interview session not found.");
  }
  return new ObjectId(value);
}

function toResponse(session: InterviewSessionDocument & { _id: ObjectId }) {
  const { _id, ...data } = session;
  return {
    ...data,
    id: _id.toHexString(),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    questions: session.questions.map((question) => ({
      ...question,
      completedAt: question.completedAt?.toISOString() ?? null,
    })),
  };
}

function toSummary(session: InterviewSessionDocument & { _id: ObjectId }) {
  const completed = session.questions.filter((question) => question.completed).length;
  return {
    id: session._id.toHexString(),
    title: session.title,
    careerGoal: session.careerGoal,
    technology: session.technology,
    difficulty: session.difficulty,
    questionCount: session.questions.length,
    completedCount: completed,
    progress: Math.round((completed / Math.max(1, session.questions.length)) * 100),
    createdAt: session.createdAt.toISOString(),
  };
}

export async function generateInterviewSession(
  user: AuthenticatedUser,
  input: GenerateInterviewInput,
) {
  const [profile, roadmap, previousSession] = await Promise.all([
    database.collection("profiles").findOne({ userId: user.id }),
    database
      .collection("roadmaps")
      .findOne({ userId: user.id, status: "active" }, { sort: { updatedAt: -1 } }),
    sessions.findOne(
      { userId: user.id, technology: input.technology },
      { sort: { createdAt: -1 } },
    ),
  ]);
  const roadmapSteps = Array.isArray(roadmap?.steps) ? roadmap.steps : [];
  const completedTopics = roadmapSteps
    .filter(
      (step) =>
        typeof step === "object" &&
        step &&
        "completed" in step &&
        step.completed,
    )
    .map((step) =>
      typeof step === "object" && step && "topicName" in step
        ? String(step.topicName)
        : "",
    )
    .filter(Boolean);
  const skills = Array.isArray(profile?.skills)
    ? profile.skills
        .map((skill) =>
          typeof skill === "object" && skill && "name" in skill
            ? `${String(skill.name)} (${String("proficiency" in skill ? skill.proficiency : "")})`
            : "",
        )
        .filter(Boolean)
    : [];
  const previousQuestions =
    previousSession?.questions.slice(0, 6).map((question) => question.question) ?? [];

  const generated = await generateGeminiStructured({
    systemInstruction:
      "You are SkillForge AI's technical interview coach. Generate fair, practical questions at the requested level. Include technical knowledge, concept explanation, one or more coding tasks, and HR/behavioral questions. Explanations must teach the concept without pretending there is only one valid answer. Return only the supplied schema.",
    prompt: `Create a personalized interview practice session.
Career goal: ${input.careerGoal}
Technology focus: ${input.technology}
Difficulty: ${input.difficulty}
Profile skills: ${skills.join(", ") || "None declared"}
Completed roadmap topics: ${completedTopics.join(", ") || "None"}
Active roadmap: ${String(roadmap?.title || "None")}
Avoid repeating these recent questions: ${previousQuestions.join(" | ") || "None"}

Generate 8 to 10 questions with a useful mix of Technical, Concept, Coding, and HR types. For coding questions, provide a self-contained codingPrompt; for other types use an empty string. Identify likely weak areas from the supplied learner context and provide concise revision tips.`,
    responseJsonSchema: interviewJsonSchema,
    validator: generatedInterviewSchema,
    temperature: 0.45,
  });

  const now = new Date();
  const document: InterviewSessionDocument = {
    ...generated,
    userId: user.id,
    careerGoal: input.careerGoal,
    technology: input.technology,
    difficulty: input.difficulty,
    questions: generated.questions.map((question) => ({
      ...question,
      id: randomUUID(),
      bookmarked: false,
      completed: false,
      completedAt: null,
    })),
    model: env.GEMINI_MODEL,
    createdAt: now,
    updatedAt: now,
  };
  const inserted = await sessions.insertOne(document);
  await database.collection("activities").insertOne({
    userId: user.id,
    type: "interview_session_generated",
    title: `Generated ${input.technology} interview practice`,
    description: `${input.difficulty} · ${generated.questions.length} questions`,
    durationMinutes: 0,
    createdAt: now,
  });

  return toResponse({ ...document, _id: inserted.insertedId });
}

export async function listInterviewSessions(userId: string) {
  const items = await sessions
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(30)
    .toArray();
  return items.map(toSummary);
}

export async function getInterviewSession(userId: string, id: string) {
  const session = await sessions.findOne({ _id: sessionId(id), userId });
  if (!session) throw new AppError(404, "Interview session not found.");
  return toResponse(session);
}

export async function getInterviewDashboard(userId: string) {
  const items = await sessions
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(30)
    .toArray();
  const latest = items[0] ?? null;
  const allQuestions = items.flatMap((session) => session.questions);
  const completedPractice = allQuestions.filter((question) => question.completed).length;
  const bookmarkedQuestions = allQuestions.filter(
    (question) => question.bookmarked,
  ).length;

  return {
    stats: {
      totalSessions: items.length,
      totalQuestions: allQuestions.length,
      completedPractice,
      bookmarkedQuestions,
      completionRate: Math.round(
        (completedPractice / Math.max(1, allQuestions.length)) * 100,
      ),
    },
    recommendedQuestions: latest
      ? latest.questions
          .filter((question) => !question.completed)
          .slice(0, 5)
          .map((question) => ({
            id: question.id,
            sessionId: latest._id.toHexString(),
            type: question.type,
            question: question.question,
            difficulty: question.difficulty,
            technology: question.technology,
            bookmarked: question.bookmarked,
          }))
      : [],
    weakAreas: latest?.weakAreas ?? [],
    aiSuggestions: latest?.revisionTips ?? [
      "Generate your first personalized session to receive revision guidance.",
    ],
    sessions: items.map(toSummary),
    latestSession: latest ? toResponse(latest) : null,
  };
}

export async function updateInterviewQuestion(
  userId: string,
  id: string,
  questionId: string,
  input: UpdateInterviewQuestionInput,
) {
  const _id = sessionId(id);
  const session = await sessions.findOne({ _id, userId });
  if (!session) throw new AppError(404, "Interview session not found.");
  const index = session.questions.findIndex((question) => question.id === questionId);
  const existing = session.questions[index];
  if (index < 0 || !existing) {
    throw new AppError(404, "Interview question not found.");
  }

  const now = new Date();
  const newlyCompleted = input.completed === true && !existing.completed;
  session.questions[index] = {
    ...existing,
    bookmarked: input.bookmarked ?? existing.bookmarked,
    completed: input.completed ?? existing.completed,
    completedAt:
      input.completed === true
        ? existing.completedAt ?? now
        : input.completed === false
          ? null
          : existing.completedAt,
  };
  session.updatedAt = now;
  await sessions.replaceOne({ _id, userId }, session);

  if (newlyCompleted) {
    await database.collection("activities").insertOne({
      userId,
      type: "interview_question_completed",
      title: `Completed a ${existing.technology} interview question`,
      description: existing.question.slice(0, 160),
      durationMinutes: 0,
      createdAt: now,
    });
  }
  return toResponse(session);
}
