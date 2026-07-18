import assert from "node:assert/strict";
import test from "node:test";

import { contactInputSchema, newsletterInputSchema } from "./platform.schema.js";

test("newsletter validation normalizes a valid email input", () => {
  const result = newsletterInputSchema.parse({ email: "  learner@example.com  " });
  assert.equal(result.email, "learner@example.com");
});

test("contact validation accepts account recovery without a password", () => {
  const result = contactInputSchema.parse({
    name: "SkillForge Learner",
    email: "learner@example.com",
    kind: "account_recovery",
    subject: "Account access support",
    message: "I cannot access my account after changing browsers.",
  });
  assert.equal(result.kind, "account_recovery");
});

test("contact validation rejects underspecified requests", () => {
  const result = contactInputSchema.safeParse({
    name: "A",
    email: "not-an-email",
    kind: "support",
    subject: "Hi",
    message: "Help",
  });
  assert.equal(result.success, false);
});
