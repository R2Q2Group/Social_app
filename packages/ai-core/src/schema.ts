import type {
  CarouselDraft,
  Draft,
  SlideContent,
  ThumbnailDraft,
  ThumbnailVariant,
} from "./types.ts";

// Hand-rolled validation instead of a schema library: this package is
// imported unmodified by both the Expo/Metro app and the Deno Edge Function,
// and a bare `zod` import would need different module resolution in each
// runtime. No dependency keeps it portable.

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function validateSlideContent(value: unknown, index: number): SlideContent {
  const slide = asRecord(value, `slides[${index}]`);
  if (!isString(slide.title)) {
    throw new Error(`slides[${index}].title must be a string`);
  }
  if (slide.subtitle !== undefined && !isString(slide.subtitle)) {
    throw new Error(`slides[${index}].subtitle must be a string`);
  }
  if (
    slide.bulletPoints !== undefined &&
    !isStringArray(slide.bulletPoints)
  ) {
    throw new Error(`slides[${index}].bulletPoints must be a string array`);
  }
  if (slide.hook !== undefined && !isString(slide.hook)) {
    throw new Error(`slides[${index}].hook must be a string`);
  }
  if (slide.calloutType !== undefined && !isString(slide.calloutType)) {
    throw new Error(`slides[${index}].calloutType must be a string`);
  }
  if (
    slide.emphasisWords !== undefined &&
    !isStringArray(slide.emphasisWords)
  ) {
    throw new Error(`slides[${index}].emphasisWords must be a string array`);
  }
  return slide as unknown as SlideContent;
}

export function validateCarouselDraft(
  candidate: unknown,
): ValidationResult<CarouselDraft> {
  try {
    const draft = asRecord(candidate, "draft");
    if (draft.mode !== "carousel") {
      throw new Error('mode must be "carousel"');
    }
    if (!Array.isArray(draft.slides) || draft.slides.length < 1) {
      throw new Error("slides must be a non-empty array");
    }
    const slides = draft.slides.map((slide, index) =>
      validateSlideContent(slide, index),
    );
    return { ok: true, data: { mode: "carousel", slides } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function validateThumbnailVariant(
  value: unknown,
  index: number,
): ThumbnailVariant {
  const variant = asRecord(value, `variants[${index}]`);
  if (!isString(variant.text)) {
    throw new Error(`variants[${index}].text must be a string`);
  }
  if (!isString(variant.focalConcept)) {
    throw new Error(`variants[${index}].focalConcept must be a string`);
  }
  if (!isString(variant.calloutShape)) {
    throw new Error(`variants[${index}].calloutShape must be a string`);
  }
  return variant as unknown as ThumbnailVariant;
}

export function validateThumbnailDraft(
  candidate: unknown,
): ValidationResult<ThumbnailDraft> {
  try {
    const draft = asRecord(candidate, "draft");
    if (draft.mode !== "thumbnail") {
      throw new Error('mode must be "thumbnail"');
    }
    if (
      !Array.isArray(draft.variants) ||
      draft.variants.length < 2 ||
      draft.variants.length > 3
    ) {
      throw new Error("variants must contain 2-3 items");
    }
    const variants = draft.variants.map((variant, index) =>
      validateThumbnailVariant(variant, index),
    );
    return { ok: true, data: { mode: "thumbnail", variants } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function validateDraft(candidate: unknown): ValidationResult<Draft> {
  const mode = (candidate as Record<string, unknown> | null)?.mode;
  if (mode === "carousel") return validateCarouselDraft(candidate);
  if (mode === "thumbnail") return validateThumbnailDraft(candidate);
  return { ok: false, error: 'mode must be "carousel" or "thumbnail"' };
}

// JSON-schema shape for the Anthropic tool-use `input_schema` field, kept in
// sync with the validators above by hand.
export const carouselToolInputSchema = {
  type: "object",
  properties: {
    slides: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
          bulletPoints: { type: "array", items: { type: "string" } },
          hook: { type: "string" },
          calloutType: { type: "string" },
          emphasisWords: { type: "array", items: { type: "string" } },
        },
        required: ["title"],
      },
    },
  },
  required: ["slides"],
} as const;

export const thumbnailToolInputSchema = {
  type: "object",
  properties: {
    variants: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          focalConcept: { type: "string" },
          calloutShape: { type: "string" },
        },
        required: ["text", "focalConcept", "calloutShape"],
      },
    },
  },
  required: ["variants"],
} as const;
