import { database } from "../../config/database.js";
import type { ContactInput, NewsletterInput } from "./platform.schema.js";

export async function getPlatformStats() {
  const monthRanges = Array.from({ length: 6 }, (_, index) => {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCMonth(start.getUTCMonth() - (5 - index));
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    return { start, end, label: start.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }) };
  });

  const [
    registeredLearners,
    aiRoadmapsGenerated,
    completedRoadmaps,
    projectsCompleted,
    interviewResult,
    activityResult,
    activity,
  ] = await Promise.all([
    database.collection("profiles").countDocuments(),
    database.collection("roadmaps").countDocuments(),
    database.collection("roadmaps").countDocuments({ status: "completed" }),
    database.collection("projects").countDocuments({ status: "completed" }),
    database
      .collection("interviewSessions")
      .aggregate<{ total: number }>([
        { $project: { questionCount: { $size: { $ifNull: ["$questions", []] } } } },
        { $group: { _id: null, total: { $sum: "$questionCount" } } },
      ])
      .next(),
    database
      .collection("activities")
      .aggregate<{ totalMinutes: number }>([
        { $group: { _id: null, totalMinutes: { $sum: { $ifNull: ["$durationMinutes", 0] } } } },
      ])
      .next(),
    Promise.all(
      monthRanges.map(async ({ start, end, label }) => {
        const [learners, roadmaps] = await Promise.all([
          database.collection("profiles").countDocuments({ createdAt: { $gte: start, $lt: end } }),
          database.collection("roadmaps").countDocuments({ createdAt: { $gte: start, $lt: end } }),
        ]);
        return { month: label, learners, roadmaps };
      }),
    ),
  ]);

  return {
    registeredLearners,
    aiRoadmapsGenerated,
    projectsCompleted,
    interviewQuestionsGenerated: interviewResult?.total ?? 0,
    successRate:
      aiRoadmapsGenerated > 0
        ? Math.round((completedRoadmaps / aiRoadmapsGenerated) * 100)
        : 0,
    learningHours: Math.round((activityResult?.totalMinutes ?? 0) / 60),
    activity,
  };
}

export async function subscribeToNewsletter(input: NewsletterInput) {
  const email = input.email.toLocaleLowerCase();
  const now = new Date();
  await database.collection("newsletterSubscribers").updateOne(
    { email },
    {
      $set: { email, status: "subscribed", updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
}

export async function createContactRequest(input: ContactInput) {
  const now = new Date();
  const result = await database.collection("contactRequests").insertOne({
    ...input,
    email: input.email.toLocaleLowerCase(),
    status: "new",
    createdAt: now,
    updatedAt: now,
  });

  return { id: result.insertedId.toHexString(), createdAt: now.toISOString() };
}
