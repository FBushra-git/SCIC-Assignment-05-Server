import type { ZodType } from "zod";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
  promptFeedback?: { blockReason?: string };
};

type GenerateOptions<T> = {
  systemInstruction: string;
  prompt: string;
  responseJsonSchema: Record<string, unknown>;
  validator: ZodType<T>;
  temperature?: number;
};

function requireGeminiKey() {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(
      503,
      "Gemini is not configured. Add GEMINI_API_KEY to Server-side/.env and restart the server.",
    );
  }
  return env.GEMINI_API_KEY;
}

async function requestGemini(body: Record<string, unknown>) {
  const apiKey = requireGeminiKey();
  const models = [...new Set([env.GEMINI_MODEL, env.GEMINI_FALLBACK_MODEL])];
  let lastResponse: globalThis.Response | null = null;
  let lastPayload: GeminiResponse = {};

  for (const [index, model] of models.entries()) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    let response: globalThis.Response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });
    } catch (error) {
      throw new AppError(
        502,
        error instanceof Error && error.name === "TimeoutError"
          ? "Gemini took too long to respond. Please try again."
          : "Could not reach Gemini. Please try again shortly.",
      );
    }

    const payload = (await response.json().catch(() => ({}))) as GeminiResponse;
    lastResponse = response;
    lastPayload = payload;

    if (response.ok) {
      const text = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();
      if (!text) {
        const reason = payload.promptFeedback?.blockReason;
        throw new AppError(
          502,
          reason
            ? `Gemini blocked this request (${reason}). Please revise the input.`
            : "Gemini returned an empty response. Please try again.",
        );
      }
      return text;
    }

    const message = payload.error?.message?.toLocaleLowerCase() ?? "";
    const modelUnavailable =
      (response.status === 400 || response.status === 404) &&
      message.includes("model") &&
      ["not found", "no longer", "unavailable", "not supported"].some((phrase) =>
        message.includes(phrase),
      );
    const temporaryFailure = response.status === 429 || response.status === 503;
    const hasFallback = index < models.length - 1;

    if (!(hasFallback && (temporaryFailure || modelUnavailable))) break;
  }

  const status = lastResponse?.status ?? 502;
  throw new AppError(
    status === 429 ? 429 : status === 503 ? 503 : 502,
    status === 429
      ? "The Gemini free-tier limit has been reached. Please wait and try again."
      : lastPayload.error?.message ?? "Gemini could not complete this request.",
  );
}

/** Use Gemini structured output and validate the result again on our server. */
export async function generateGeminiStructured<T>({
  systemInstruction,
  prompt,
  responseJsonSchema,
  validator,
  temperature = 0.35,
}: GenerateOptions<T>) {
  const text = await requestGemini({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      responseMimeType: "application/json",
      responseJsonSchema,
    },
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AppError(502, "Gemini returned malformed structured data. Please try again.");
  }

  const result = validator.safeParse(parsed);
  if (!result.success) {
    throw new AppError(
      502,
      "Gemini returned incomplete structured data. Please try again.",
      result.error.flatten(),
    );
  }
  return result.data;
}

export async function generateGeminiText(options: {
  systemInstruction: string;
  prompt: string;
  temperature?: number;
}) {
  return requestGemini({
    systemInstruction: { parts: [{ text: options.systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: options.prompt }] }],
    generationConfig: { temperature: options.temperature ?? 0.55 },
  });
}
