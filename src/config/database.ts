import { MongoClient } from "mongodb";

import { env } from "./env.js";

export const mongoClient = new MongoClient(env.MONGODB_URI);
export const database = mongoClient.db();

export async function connectDatabase() {
  await mongoClient.connect();
  await database.command({ ping: 1 });
  await database.collection("profiles").createIndex({ userId: 1 }, { unique: true });
  await database.collection("activities").createIndex({ userId: 1, createdAt: -1 });
  await database.collection("roadmaps").createIndex({ userId: 1, status: 1 });
  await database.collection("roadmaps").createIndex({ userId: 1, updatedAt: -1 });
  await database.collection("projects").createIndex({ userId: 1, status: 1 });
  await database
    .collection("projects")
    .createIndex({ userId: 1, projectSlug: 1 }, { unique: true });
  await database
    .collection("recommendations")
    .createIndex({ userId: 1, createdAt: -1 });
  await database
    .collection("conversations")
    .createIndex({ userId: 1, updatedAt: -1 });
  await database
    .collection("interviewSessions")
    .createIndex({ userId: 1, createdAt: -1 });
  await database.collection("items").createIndex({ userId: 1, updatedAt: -1 });
  await database.collection("items").createIndex({ createdAt: -1 });
  await database.collection("items").createIndex({ priority: 1, technologies: 1 });
  await database
    .collection("newsletterSubscribers")
    .createIndex({ email: 1 }, { unique: true });
  await database.collection("contactRequests").createIndex({ createdAt: -1 });
}

export async function disconnectDatabase() {
  await mongoClient.close();
}
