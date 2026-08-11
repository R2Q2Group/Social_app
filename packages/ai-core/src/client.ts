import {
  carouselToolInputSchema,
  thumbnailToolInputSchema,
  validateDraft,
} from "./schema";
import { CAROUSEL_SYSTEM_PROMPT, THUMBNAIL_SYSTEM_PROMPT } from "./prompts";
import type { Draft } from "./types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-3-5-haiku-20241022";
const ANTHROPIC_VERSION = "2023-06-01";

export class DraftGenerationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "DraftGenerationError";
  }
}

export interface GenerateDraftInput {
  mode: "carousel" | "thumbnail";
  input: string;
  /** Backend free-tier key or the caller's BYOK Anthropic key. */
  apiKey: string;
  fetchImpl?: typeof fetch;
}

/**
 * Isomorphic: relies only on global `fetch`, so it runs unmodified in the
 * Supabase Edge Function (Deno) and, if ever called client-side, in Expo/RN.
 */
export async function generateDraft({
  mode,
  input,
  apiKey,
  fetchImpl = fetch,
}: GenerateDraftInput): Promise<Draft> {
  const isCarousel = mode === "carousel";
  const toolName = isCarousel ? "emit_carousel_draft" : "emit_thumbnail_draft";
  const systemPrompt = isCarousel
    ? CAROUSEL_SYSTEM_PROMPT
    : THUMBNAIL_SYSTEM_PROMPT;
  const inputSchema = isCarousel
    ? carouselToolInputSchema
    : thumbnailToolInputSchema;

  let response: Response;
  try {
    response = await fetchImpl(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: input }],
        tools: [
          {
            name: toolName,
            description: `Return the ${mode} draft as structured data.`,
            input_schema: inputSchema,
          },
        ],
        tool_choice: { type: "tool", name: toolName },
      }),
    });
  } catch (cause) {
    throw new DraftGenerationError("Failed to reach Anthropic API", cause);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new DraftGenerationError(
      `Anthropic API error ${response.status}: ${body}`,
    );
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; name?: string; input?: unknown }>;
  };
  const toolUse = payload.content?.find(
    (block) => block.type === "tool_use" && block.name === toolName,
  );
  if (!toolUse) {
    throw new DraftGenerationError(
      "Anthropic response did not include the expected tool_use block",
    );
  }

  const candidate = { mode, ...(toolUse.input as Record<string, unknown>) };
  const result = validateDraft(candidate);
  if (!result.ok) {
    throw new DraftGenerationError(
      `Model output failed schema validation: ${result.error}`,
    );
  }

  return result.data;
}
