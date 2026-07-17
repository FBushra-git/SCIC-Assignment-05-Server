import { AppError } from "../../utils/app-error.js";
import { learningResources } from "./resource.catalog.js";

type ResourceFilters = {
  search: string | undefined;
  type: string | undefined;
  difficulty: string | undefined;
  technology: string | undefined;
  page: number | undefined;
  limit: number | undefined;
};

function normalized(value: string | undefined) {
  return value?.trim().toLocaleLowerCase() ?? "";
}

export function listLearningResources(filters: ResourceFilters) {
  const search = normalized(filters.search);
  const type = normalized(filters.type);
  const difficulty = normalized(filters.difficulty);
  const technology = normalized(filters.technology);
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(24, Math.max(1, filters.limit ?? 8));

  const filtered = learningResources.filter((resource) => {
    const searchable = [
      resource.title,
      resource.source,
      resource.description,
      ...resource.technologies,
    ]
      .join(" ")
      .toLocaleLowerCase();

    return (
      (!search || searchable.includes(search)) &&
      (!type || resource.type.toLocaleLowerCase() === type) &&
      (!difficulty || resource.difficulty.toLocaleLowerCase() === difficulty) &&
      (!technology ||
        resource.technologies.some(
          (item) => item.toLocaleLowerCase() === technology,
        ))
    );
  });
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    pagination: {
      page: safePage,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    },
    facets: {
      types: [...new Set(learningResources.map((resource) => resource.type))],
      difficulties: [
        ...new Set(learningResources.map((resource) => resource.difficulty)),
      ],
      technologies: [
        ...new Set(learningResources.flatMap((resource) => resource.technologies)),
      ].sort(),
    },
  };
}

export function getLearningResource(resourceId: string) {
  const resource = learningResources.find((item) => item.id === resourceId);
  if (!resource) throw new AppError(404, "Learning resource not found.");
  return resource;
}

export function resolveLearningResources(resourceIds: string[]) {
  return resourceIds
    .map((id) => learningResources.find((resource) => resource.id === id))
    .filter((resource): resource is (typeof learningResources)[number] =>
      Boolean(resource),
    );
}
