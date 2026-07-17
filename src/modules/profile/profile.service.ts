import { database } from "../../config/database.js";
import type { AuthenticatedUser } from "../../middlewares/require-auth.middleware.js";
import type { UpdateProfileInput } from "./profile.schema.js";

type Skill = UpdateProfileInput["skills"][number];
type ProfileDocument = {
  userId: string;
  currentEducation: string;
  currentRole: string;
  bio: string;
  experienceLevel: UpdateProfileInput["experienceLevel"];
  careerGoal: UpdateProfileInput["careerGoal"];
  weeklyStudyHours: number;
  learningStyle: UpdateProfileInput["learningStyle"];
  preferredProgrammingLanguage: string;
  skills: Skill[];
  recommendationVersion: number;
  recommendationStatus: "ready" | "refresh_pending";
  createdAt: Date;
  updatedAt: Date;
};

const profiles = database.collection<ProfileDocument>("profiles");

function calculateCompletion(user: AuthenticatedUser, profile: ProfileDocument | null) {
  const checkpoints = [
    user.name,
    user.email,
    user.image,
    profile?.currentEducation,
    profile?.currentRole,
    profile?.bio,
    profile?.experienceLevel,
    profile?.careerGoal,
    profile?.weeklyStudyHours,
    profile?.learningStyle,
    profile?.preferredProgrammingLanguage,
    profile?.skills.length,
  ];

  return Math.round(
    (checkpoints.filter(Boolean).length / checkpoints.length) * 100,
  );
}

function toProfileResponse(user: AuthenticatedUser, profile: ProfileDocument | null) {
  return {
    userId: user.id,
    fullName: user.name,
    email: user.email,
    profilePhoto: user.image,
    currentEducation: profile?.currentEducation ?? "",
    currentRole: profile?.currentRole ?? "",
    bio: profile?.bio ?? "",
    experienceLevel: profile?.experienceLevel ?? "",
    careerGoal: profile?.careerGoal ?? "",
    weeklyStudyHours: profile?.weeklyStudyHours ?? 10,
    learningStyle: profile?.learningStyle ?? "",
    preferredProgrammingLanguage: profile?.preferredProgrammingLanguage ?? "",
    skills: profile?.skills ?? [],
    profileCompletion: calculateCompletion(user, profile),
    recommendations: {
      status: profile?.recommendationStatus ?? "ready",
      version: profile?.recommendationVersion ?? 0,
    },
    createdAt: profile?.createdAt.toISOString() ?? null,
    updatedAt: profile?.updatedAt.toISOString() ?? null,
  };
}

export async function getProfile(user: AuthenticatedUser) {
  const profile = await profiles.findOne({ userId: user.id });
  return toProfileResponse(user, profile);
}

export async function updateProfile(user: AuthenticatedUser, input: UpdateProfileInput) {
  const existingProfile = await profiles.findOne({ userId: user.id });
  const careerGoalChanged = existingProfile
    ? existingProfile.careerGoal !== input.careerGoal
    : Boolean(input.careerGoal);
  const now = new Date();

  const profile: ProfileDocument = {
    userId: user.id,
    currentEducation: input.currentEducation,
    currentRole: input.currentRole,
    bio: input.bio,
    experienceLevel: input.experienceLevel,
    careerGoal: input.careerGoal,
    weeklyStudyHours: input.weeklyStudyHours,
    learningStyle: input.learningStyle,
    preferredProgrammingLanguage: input.preferredProgrammingLanguage,
    skills: input.skills,
    recommendationVersion:
      (existingProfile?.recommendationVersion ?? 0) + (careerGoalChanged ? 1 : 0),
    recommendationStatus: careerGoalChanged
      ? "refresh_pending"
      : (existingProfile?.recommendationStatus ?? "ready"),
    createdAt: existingProfile?.createdAt ?? now,
    updatedAt: now,
  };

  await profiles.replaceOne({ userId: user.id }, profile, { upsert: true });
  await database.collection("activities").insertOne({
    userId: user.id,
    type: "profile_updated",
    title: "Updated learning profile",
    description: input.careerGoal
      ? `Refined preferences for the ${input.careerGoal} path.`
      : "Refined learning preferences and skills.",
    durationMinutes: 0,
    createdAt: now,
  });

  const updatedUser: AuthenticatedUser = {
    ...user,
    name: input.fullName,
    image: input.profilePhoto,
  };

  return {
    profile: toProfileResponse(updatedUser, profile),
    recommendationRefreshQueued: careerGoalChanged,
  };
}
