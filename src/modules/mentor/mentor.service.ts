import { randomUUID } from "node:crypto";

import { ObjectId } from "mongodb";

import { database } from "../../config/database.js";
import type { AuthenticatedUser } from "../../middlewares/require-auth.middleware.js";
import { AppError } from "../../utils/app-error.js";
import { generateGeminiText } from "../ai/gemini.service.js";
import type { SendMentorMessageInput } from "./mentor.schema.js";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
};

type ConversationDocument = {
  userId: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
};

const conversations =
  database.collection<ConversationDocument>("conversations");

function conversationId(value: string) {
  if (!ObjectId.isValid(value)) throw new AppError(404, "Conversation not found.");
  return new ObjectId(value);
}

function toResponse(conversation: ConversationDocument & { _id: ObjectId }) {
  const { _id, ...data } = conversation;
  return {
    ...data,
    id: _id.toHexString(),
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages: conversation.messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

function listValue(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean).join(", ") : "None";
}

export async function listConversations(userId: string) {
  const items = await conversations
    .find({ userId })
    .sort({ updatedAt: -1 })
    .limit(30)
    .toArray();
  return items.map((item) => ({
    id: item._id.toHexString(),
    title: item.title,
    preview: item.messages.at(-1)?.content.slice(0, 120) ?? "",
    messageCount: item.messages.length,
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function getConversation(userId: string, id: string) {
  const item = await conversations.findOne({ _id: conversationId(id), userId });
  if (!item) throw new AppError(404, "Conversation not found.");
  return toResponse(item);
}

export async function sendMentorMessage(
  user: AuthenticatedUser,
  input: SendMentorMessageInput,
) {
  const existing = input.conversationId
    ? await conversations.findOne({
        _id: conversationId(input.conversationId),
        userId: user.id,
      })
    : null;
  if (input.conversationId && !existing) {
    throw new AppError(404, "Conversation not found.");
  }

  const [profile, roadmap, recentActivity] = await Promise.all([
    database.collection("profiles").findOne({ userId: user.id }),
    database
      .collection("roadmaps")
      .findOne({ userId: user.id, status: "active" }, { sort: { updatedAt: -1 } }),
    database
      .collection("activities")
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray(),
  ]);
  const steps = Array.isArray(roadmap?.steps) ? roadmap.steps : [];
  const completed = steps
    .filter((step) => typeof step === "object" && step && "completed" in step && step.completed)
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
  const history = (existing?.messages ?? [])
    .slice(-12)
    .map((message) => `${message.role === "user" ? "Learner" : "Mentor"}: ${message.content}`)
    .join("\n\n");

  const reply = await generateGeminiText({
    systemInstruction:
      "You are the SkillForge AI Mentor. Be a contextual learning coach, not a generic chatbot. Give accurate, actionable, encouraging answers at the learner's current level. Use Markdown headings, bullets, and fenced code blocks when useful. Explain why a recommendation fits their roadmap. Never claim to have executed code. If uncertain, say so and suggest a reliable verification path.",
    prompt: `LEARNER CONTEXT
Name: ${user.name}
Career goal: ${String(profile?.careerGoal || "Not selected")}
Experience level: ${String(profile?.experienceLevel || "Not selected")}
Weekly study hours: ${String(profile?.weeklyStudyHours || 10)}
Preferred language: ${String(profile?.preferredProgrammingLanguage || "Not selected")}
Skills: ${skills.join(", ") || "None declared"}
Active roadmap: ${String(roadmap?.title || "None")}
Current week: ${String(roadmap?.currentWeek || "N/A")}
Next topic: ${String(roadmap?.nextLesson || "N/A")}
Completed topics: ${listValue(completed)}
Recent activity: ${recentActivity.map((item) => String(item.title)).join("; ") || "None"}

RECENT CONVERSATION
${history || "This is a new conversation."}

NEW LEARNER QUESTION
${input.message}

Respond directly to the new question while using the learner context when relevant. End with one useful suggested follow-up question.`,
  });

  const now = new Date();
  const newMessages: Message[] = [
    {
      id: randomUUID(),
      role: "user",
      content: input.message,
      createdAt: now,
    },
    {
      id: randomUUID(),
      role: "assistant",
      content: reply,
      createdAt: now,
    },
  ];

  let saved: ConversationDocument & { _id: ObjectId };
  if (existing) {
    const updated: ConversationDocument = {
      ...existing,
      messages: [...existing.messages, ...newMessages],
      updatedAt: now,
    };
    await conversations.replaceOne({ _id: existing._id, userId: user.id }, updated);
    saved = { ...updated, _id: existing._id };
  } else {
    const document: ConversationDocument = {
      userId: user.id,
      title: input.message.length > 58 ? `${input.message.slice(0, 55)}…` : input.message,
      messages: newMessages,
      createdAt: now,
      updatedAt: now,
    };
    const inserted = await conversations.insertOne(document);
    saved = { ...document, _id: inserted.insertedId };
  }

  await database.collection("activities").insertOne({
    userId: user.id,
    type: "ai_conversation",
    title: "Asked the AI mentor",
    description: input.message.slice(0, 160),
    durationMinutes: 0,
    createdAt: now,
  });

  return toResponse(saved);
}
