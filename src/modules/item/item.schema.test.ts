import assert from "node:assert/strict";
import test from "node:test";

import { itemInputSchema } from "./item.schema.js";

const validItem = {
  title: "Accessible developer portfolio",
  shortDescription: "A polished portfolio that explains engineering decisions clearly.",
  description: "Build an accessible portfolio with case studies, measurable outcomes, responsive navigation, robust form states, and a documented deployment process.",
  priority: "Intermediate" as const,
  targetDate: "2026-12-01",
  imageUrl: "https://images.example.com/portfolio.jpg",
  technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
};

test("item input accepts a complete project brief", () => {
  const result = itemInputSchema.parse(validItem);
  assert.equal(result.title, validItem.title);
  assert.deepEqual(result.technologies, validItem.technologies);
});

test("item input rejects non-HTTPS images and duplicate technologies", () => {
  const result = itemInputSchema.safeParse({
    ...validItem,
    imageUrl: "http://images.example.com/portfolio.jpg",
    technologies: ["React", "React"],
  });
  assert.equal(result.success, false);
});

test("item input rejects incomplete descriptions", () => {
  const result = itemInputSchema.safeParse({ ...validItem, description: "Too short." });
  assert.equal(result.success, false);
});
