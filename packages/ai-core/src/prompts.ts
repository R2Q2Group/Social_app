// Gate 1: implement as callable prompt builders once the drafting endpoint exists.
// See RDD.md Section 3.1 for the narrative-arc / high-CTR-claim requirements each
// prompt must satisfy.

export const CAROUSEL_SYSTEM_PROMPT = `Break the input into a slide-by-slide
narrative arc (hook -> context -> payoff -> CTA). Return structured JSON slide
objects with title, subtitle, bullet points, hook, callout type, and suggested
emphasis words.`;

export const THUMBNAIL_SYSTEM_PROMPT = `Extract a single high-CTR claim or emotion
from the input. Return 2-3 variant JSON objects with text, focal concept, and a
suggested callout shape.`;
