import { database } from "../../config/database.js";
import type { AuthenticatedUser } from "../../middlewares/require-auth.middleware.js";

type ProfileSkill = {
  name: string;
  proficiency: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  status: "Learning" | "Practicing" | "Completed";
};

type ProfileDocument = {
  userId: string;
  careerGoal?: string;
  weeklyStudyHours?: number;
  preferredProgrammingLanguage?: string;
  skills?: ProfileSkill[];
};

type RoadmapDocument = {
  userId: string;
  title: string;
  status: "active" | "completed" | "draft";
  currentWeek?: number;
  totalWeeks?: number;
  nextLesson?: string;
  totalTopics?: number;
  completedTopics?: number;
  progress?: number;
  estimatedCompletion?: Date | string;
  updatedAt?: Date;
};

type ProjectDocument = {
  userId: string;
  status: "planned" | "in_progress" | "completed";
};

type ActivityDocument = {
  userId: string;
  type: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  createdAt: Date;
};

type RecommendationDocument = {
  userId: string;
  items: Array<{
    id: string;
    type: "learning" | "project" | "interview" | "resource";
    title: string;
    reason: string;
    priority: "high" | "medium" | "low";
    resources?: Array<{ url: string }>;
  }>;
  createdAt: Date;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date: Date) {
  const start = startOfUtcDay(date);
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - (day === 0 ? 6 : day - 1));
  return start;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toDate(value: Date | string | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function createWeeklyStudyData(activities: ActivityDocument[], now: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfUtcDay(now).getTime() - (6 - index) * DAY_IN_MS);
    const minutes = activities
      .filter((activity) => dateKey(activity.createdAt) === dateKey(date))
      .reduce((total, activity) => total + (activity.durationMinutes ?? 0), 0);

    return {
      day: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(date),
      date: dateKey(date),
      hours: Number((minutes / 60).toFixed(1)),
    };
  });
}

function createLearningProgressData(activities: ActivityDocument[], now: Date) {
  const currentWeek = startOfUtcWeek(now);

  return Array.from({ length: 6 }, (_, index) => {
    const weekStart = new Date(currentWeek.getTime() - (5 - index) * 7 * DAY_IN_MS);
    const weekEnd = new Date(weekStart.getTime() + 7 * DAY_IN_MS);
    const completedLessons = activities.filter(
      (activity) =>
        activity.type === "lesson_completed" &&
        activity.createdAt >= weekStart &&
        activity.createdAt < weekEnd,
    ).length;

    return {
      week: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(weekStart),
      completedLessons,
    };
  });
}

function createMonthlyProgressData(activities: ActivityDocument[], now: Date) {
  return Array.from({ length: 6 }, (_, index) => {
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1),
    );
    const monthEnd = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1),
    );
    const monthlyActivities = activities.filter(
      (activity) =>
        activity.createdAt >= monthStart && activity.createdAt < monthEnd,
    );

    return {
      month: new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: "UTC",
      }).format(monthStart),
      completedLessons: monthlyActivities.filter(
        (activity) => activity.type === "lesson_completed",
      ).length,
      studyHours: Number(
        (
          monthlyActivities.reduce(
            (total, activity) => total + (activity.durationMinutes ?? 0),
            0,
          ) / 60
        ).toFixed(1),
      ),
    };
  });
}

function calculateLearningStreak(activities: ActivityDocument[], now: Date) {
  const activeDays = new Set(activities.map((activity) => dateKey(activity.createdAt)));
  let streak = 0;
  let cursor = startOfUtcDay(now);

  while (activeDays.has(dateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_IN_MS);
  }

  return streak;
}

function createSuggestions(profile: ProfileDocument | null) {
  const skills = profile?.skills ?? [];
  const nextSkill =
    skills.find((skill) => skill.status === "Learning") ??
    skills.find((skill) => skill.status !== "Completed");
  const careerGoal = profile?.careerGoal || "software developer";
  const language = profile?.preferredProgrammingLanguage || "programming fundamentals";

  const projectByGoal: Record<string, string> = {
    "Frontend Developer": "Build an accessible dashboard interface",
    "Backend Developer": "Build a documented REST API",
    "Full Stack Developer": "Build a full-stack task manager",
    "Mobile Developer": "Build a mobile habit tracker",
    "UI/UX Designer": "Create a complete product case study",
    "AI Engineer": "Build a context-aware AI assistant",
    "Data Analyst": "Build an interactive analytics report",
  };

  return [
    {
      id: "next-skill",
      type: "learning",
      title: nextSkill ? `Continue ${nextSkill.name}` : "Map your first technical skill",
      description: nextSkill
        ? `Move ${nextSkill.name} from ${nextSkill.status.toLowerCase()} toward completion.`
        : "Add your current skills so recommendations can focus on the right gaps.",
      actionLabel: nextSkill ? "Open profile" : "Add skills",
      href: "/profile#skills",
    },
    {
      id: "portfolio-project",
      type: "project",
      title: projectByGoal[careerGoal] ?? `Build a ${careerGoal} portfolio project`,
      description: "Turn your current learning direction into evidence you can show recruiters.",
      actionLabel: "Browse projects",
      href: "/my-projects",
    },
    {
      id: "interview-practice",
      type: "interview",
      title: `Practice ${language} interview questions`,
      description: "A short focused practice session helps reinforce recall and confidence.",
      actionLabel: "Start practice",
      href: "/interview",
    },
  ];
}

function mapAiSuggestions(recommendation: RecommendationDocument | null) {
  if (!recommendation?.items.length) return null;
  const destinations = {
    learning: { actionLabel: "Continue learning", href: "/my-roadmaps" },
    project: { actionLabel: "Browse projects", href: "/my-projects" },
    interview: { actionLabel: "Start practice", href: "/interview" },
    resource: { actionLabel: "Open resource", href: "/my-roadmaps" },
  };
  const priorityOrder = { high: 0, medium: 1, low: 2 };

  return [...recommendation.items]
    .sort(
      (left, right) =>
        priorityOrder[left.priority] - priorityOrder[right.priority],
    )
    .slice(0, 3)
    .map((item) => {
      const destination = destinations[item.type];
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.reason,
        actionLabel: destination.actionLabel,
        href:
          item.type === "resource" && item.resources?.[0]?.url
            ? item.resources[0].url
            : destination.href,
      };
    });
}

export async function getDashboard(user: AuthenticatedUser) {
  const now = new Date();
  const activityWindowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
  );

  const [profile, roadmap, projects, activities, recommendation] = await Promise.all([
    database.collection<ProfileDocument>("profiles").findOne({ userId: user.id }),
    database.collection<RoadmapDocument>("roadmaps").findOne(
      { userId: user.id, status: "active" },
      { sort: { updatedAt: -1 } },
    ),
    database.collection<ProjectDocument>("projects").find({ userId: user.id }).toArray(),
    database
      .collection<ActivityDocument>("activities")
      .find({ userId: user.id, createdAt: { $gte: activityWindowStart } })
      .sort({ createdAt: -1 })
      .limit(400)
      .toArray(),
    database
      .collection<RecommendationDocument>("recommendations")
      .findOne({ userId: user.id }, { sort: { createdAt: -1 } }),
  ]);

  const skills = profile?.skills ?? [];
  const completedSkills = skills.filter((skill) => skill.status === "Completed").length;
  const remainingSkills = skills.length - completedSkills;
  const skillCompletion = skills.length ? (completedSkills / skills.length) * 100 : 0;
  const weeklyStudyTime = createWeeklyStudyData(activities, now);
  const studiedHours = weeklyStudyTime.reduce((total, day) => total + day.hours, 0);
  const weeklyTarget = profile?.weeklyStudyHours ?? 10;
  const weeklyProgress = weeklyTarget ? (studiedHours / weeklyTarget) * 100 : 0;
  const roadmapProgress = roadmap?.progress ??
    (roadmap?.totalTopics
      ? ((roadmap.completedTopics ?? 0) / roadmap.totalTopics) * 100
      : null);
  const estimatedCompletion = toDate(roadmap?.estimatedCompletion);
  const quotes = [
    "Small, consistent steps create remarkable careers.",
    "Build what challenges you; confidence follows evidence.",
    "Clarity grows when learning becomes a daily practice.",
    "Your next breakthrough is usually one focused session away.",
  ];
  const weekNumber = Math.floor(now.getTime() / (7 * DAY_IN_MS));

  return {
    user: {
      name: user.name,
      firstName: user.name.trim().split(/\s+/)[0] || "Learner",
      image: user.image,
      careerGoal: profile?.careerGoal ?? "",
    },
    banner: {
      quote: quotes[weekNumber % quotes.length],
      weeklyTargetHours: weeklyTarget,
      studiedHours: Number(studiedHours.toFixed(1)),
    },
    currentRoadmap: roadmap
      ? {
          id: String(roadmap._id),
          title: roadmap.title,
          currentWeek: roadmap.currentWeek ?? 1,
          totalWeeks: roadmap.totalWeeks ?? 1,
          nextLesson: roadmap.nextLesson ?? "Choose your next lesson",
          remainingTopics: Math.max(
            0,
            (roadmap.totalTopics ?? 0) - (roadmap.completedTopics ?? 0),
          ),
          estimatedCompletion: estimatedCompletion?.toISOString() ?? null,
          progress: clampPercentage(roadmapProgress ?? 0),
        }
      : null,
    progress: {
      overallCompletion: clampPercentage(roadmapProgress ?? skillCompletion),
      weeklyProgress: clampPercentage(weeklyProgress),
      completedSkills,
      remainingSkills,
    },
    suggestions: mapAiSuggestions(recommendation) ?? createSuggestions(profile),
    recentActivity: activities.slice(0, 8).map((activity) => ({
      id: String(activity._id),
      type: activity.type,
      title: activity.title,
      description: activity.description ?? "",
      createdAt: activity.createdAt.toISOString(),
    })),
    analytics: {
      learningProgress: createLearningProgressData(activities, now),
      monthlyProgress: createMonthlyProgressData(activities, now),
      weeklyStudyTime,
      skillsDistribution: [
        { name: "Learning", value: skills.filter((skill) => skill.status === "Learning").length },
        { name: "Practicing", value: skills.filter((skill) => skill.status === "Practicing").length },
        { name: "Completed", value: completedSkills },
      ],
      projectCompletion: [
        { name: "Planned", value: projects.filter((project) => project.status === "planned").length },
        { name: "In progress", value: projects.filter((project) => project.status === "in_progress").length },
        { name: "Completed", value: projects.filter((project) => project.status === "completed").length },
      ],
      learningStreak: calculateLearningStreak(activities, now),
    },
  };
}
