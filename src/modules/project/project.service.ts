import { database } from "../../config/database.js";
import { AppError } from "../../utils/app-error.js";
import { projectCatalog } from "./project.catalog.js";

type ProjectStatus = "planned" | "in_progress" | "completed";

type UserProjectDocument = {
  userId: string;
  projectSlug: string;
  projectName: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

const userProjects = database.collection<UserProjectDocument>("projects");

export async function listProjects(
  userId: string | undefined,
  filters: {
    search: string | undefined;
    difficulty: string | undefined;
    technology: string | undefined;
  },
) {
  const states = userId ? await userProjects.find({ userId }).toArray() : [];
  const statusBySlug = new Map(states.map((state) => [state.projectSlug, state.status]));
  const search = filters.search?.trim().toLocaleLowerCase();
  const difficulty = filters.difficulty?.trim().toLocaleLowerCase();
  const technology = filters.technology?.trim().toLocaleLowerCase();

  return projectCatalog
    .filter((project) => {
      const matchesSearch =
        !search ||
        project.name.toLocaleLowerCase().includes(search) ||
        project.shortDescription.toLocaleLowerCase().includes(search) ||
        project.technologies.some((item) => item.toLocaleLowerCase().includes(search));
      const matchesDifficulty =
        !difficulty || project.difficulty.toLocaleLowerCase() === difficulty;
      const matchesTechnology =
        !technology ||
        project.technologies.some((item) => item.toLocaleLowerCase() === technology);
      return matchesSearch && matchesDifficulty && matchesTechnology;
    })
    .map((project) => ({
      ...project,
      userStatus: statusBySlug.get(project.slug) ?? null,
    }));
}

export async function getProject(userId: string | undefined, slug: string) {
  const project = projectCatalog.find((item) => item.slug === slug);
  if (!project) throw new AppError(404, "Project not found.");

  const state = userId
    ? await userProjects.findOne({ userId, projectSlug: slug })
    : null;
  const related = project.relatedSlugs
    .map((relatedSlug) => projectCatalog.find((item) => item.slug === relatedSlug))
    .filter((item): item is (typeof projectCatalog)[number] => Boolean(item))
    .map(({ relatedSlugs: _relatedSlugs, ...item }) => item);

  return { ...project, userStatus: state?.status ?? null, related };
}

export async function updateProjectStatus(
  userId: string,
  slug: string,
  status: ProjectStatus,
) {
  const project = projectCatalog.find((item) => item.slug === slug);
  if (!project) throw new AppError(404, "Project not found.");

  const existing = await userProjects.findOne({ userId, projectSlug: slug });
  const now = new Date();
  const document: UserProjectDocument = {
    userId,
    projectSlug: slug,
    projectName: project.name,
    status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    completedAt: status === "completed" ? existing?.completedAt ?? now : null,
  };
  await userProjects.replaceOne({ userId, projectSlug: slug }, document, {
    upsert: true,
  });

  if (!existing || (status === "completed" && existing.status !== "completed")) {
    await database.collection("activities").insertOne({
      userId,
      type: status === "completed" ? "project_completed" : "project_added",
      title:
        status === "completed"
          ? `Completed ${project.name}`
          : `Added ${project.name}`,
      description:
        status === "completed"
          ? "Added a completed portfolio project."
          : "Added a new project to the learning workspace.",
      durationMinutes: 0,
      createdAt: now,
    });
  }
  await database.collection("profiles").updateOne(
    { userId },
    { $set: { recommendationStatus: "refresh_pending", updatedAt: now } },
  );

  return { ...project, userStatus: status };
}
