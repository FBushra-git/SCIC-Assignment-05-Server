import { AppError } from "../../utils/app-error.js";
import { resolveLearningResources } from "../resource/resource.service.js";
import { publicRoadmaps } from "./public-roadmap.catalog.js";

export type PublicRoadmapFilters = {
  search: string | undefined;
  career: string | undefined;
  category: string | undefined;
  difficulty: string | undefined;
  duration: string | undefined;
  technology: string | undefined;
  popularity: string | undefined;
  sort: string | undefined;
  page: number | undefined;
  limit: number | undefined;
};

function normalize(value: string | undefined) {
  return value?.trim().toLocaleLowerCase() ?? "";
}

function matchesDuration(durationWeeks: number, filter: string) {
  if (!filter) return true;
  if (filter === "under-16") return durationWeeks < 16;
  if (filter === "16-20") return durationWeeks >= 16 && durationWeeks <= 20;
  if (filter === "over-20") return durationWeeks > 20;
  return true;
}

function matchesPopularity(popularity: number, filter: string) {
  if (!filter) return true;
  if (filter === "trending") return popularity >= 90;
  if (filter === "popular") return popularity >= 80;
  if (filter === "hidden-gems") return popularity < 80;
  return true;
}

function matchesCareer(
  roadmap: (typeof publicRoadmaps)[number],
  career: string,
) {
  if (!career) return true;
  if (career === "mobile-app-developer") return roadmap.category === "Mobile";
  if (career === "cyber-security") return roadmap.category === "Security";
  return (
    roadmap.slug === career ||
    roadmap.careerTitle.toLocaleLowerCase().includes(career)
  );
}

function summaryOf(roadmap: (typeof publicRoadmaps)[number]) {
  const { steps: _steps, keywords: _keywords, learningOutcomes: _outcomes, ...summary } =
    roadmap;
  return summary;
}

export function listPublicRoadmaps(filters: PublicRoadmapFilters) {
  const search = normalize(filters.search);
  const career = normalize(filters.career);
  const category = normalize(filters.category);
  const difficulty = normalize(filters.difficulty);
  const technology = normalize(filters.technology);
  const duration = normalize(filters.duration);
  const popularity = normalize(filters.popularity);
  const sort = normalize(filters.sort) || "newest";
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(12, Math.max(1, filters.limit ?? 8));

  const filtered = publicRoadmaps.filter((roadmap) => {
    const searchable = [
      roadmap.careerTitle,
      roadmap.category,
      roadmap.description,
      ...roadmap.technologies,
      ...roadmap.keywords,
    ]
      .join(" ")
      .toLocaleLowerCase();

    return (
      (!search || searchable.includes(search)) &&
      matchesCareer(roadmap, career) &&
      (!category || roadmap.category.toLocaleLowerCase() === category) &&
      (!difficulty || roadmap.difficulty.toLocaleLowerCase() === difficulty) &&
      (!technology ||
        roadmap.technologies.some(
          (item) => item.toLocaleLowerCase() === technology,
        )) &&
      matchesDuration(roadmap.durationWeeks, duration) &&
      matchesPopularity(roadmap.popularity, popularity)
    );
  });

  filtered.sort((left, right) => {
    if (sort === "popular") return right.popularity - left.popularity;
    if (sort === "shortest") return left.durationWeeks - right.durationWeeks;
    if (sort === "longest") return right.durationWeeks - left.durationWeeks;
    if (sort === "alphabetical") {
      return left.careerTitle.localeCompare(right.careerTitle);
    }
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  return {
    items: filtered.slice(start, start + limit).map(summaryOf),
    pagination: {
      page: safePage,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    },
    facets: {
      categories: [...new Set(publicRoadmaps.map((roadmap) => roadmap.category))],
      difficulties: [
        ...new Set(publicRoadmaps.map((roadmap) => roadmap.difficulty)),
      ],
      technologies: [
        ...new Set(publicRoadmaps.flatMap((roadmap) => roadmap.technologies)),
      ].sort(),
    },
  };
}

export function getPublicRoadmap(slug: string) {
  const roadmap = publicRoadmaps.find((item) => item.slug === slug);
  if (!roadmap) throw new AppError(404, "Public roadmap not found.");

  const related = publicRoadmaps
    .filter(
      (item) => item.slug !== slug && item.category === roadmap.category,
    )
    .sort((left, right) => right.popularity - left.popularity)
    .slice(0, 3)
    .map(summaryOf);

  return {
    ...roadmap,
    steps: roadmap.steps.map((step, index) => ({
      ...step,
      order: index + 1,
      resources: resolveLearningResources(step.resourceIds),
      resourceIds: undefined,
    })),
    related,
  };
}
