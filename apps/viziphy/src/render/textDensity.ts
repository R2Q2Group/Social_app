import { carouselPlatforms, type CarouselPlatformKey } from "@r2q2/design-tokens";
import type { SlideContent } from "@r2q2/ai-core";

/** Clips `text` to `max` chars, replacing the tail with an ellipsis so the
 * cut is visible rather than silently dropping words mid-sentence. Backs up
 * to the last word boundary before the cut so words aren't sliced in half
 * (e.g. "produc…" instead of "product…") -- unless that would throw away
 * most of the available budget (a single long word, or a very tight limit),
 * in which case the raw character cut is kept rather than returning a
 * near-empty string. */
export function truncate(text: string, max: number): string {
  if (max <= 0) return "";
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.4 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

/** Applies a platform's Section-4 text-density rule to a slide: title/subtitle
 * are clipped to their char caps, bullets are capped in count and per-item
 * length, and any field with a 0 limit is dropped entirely (e.g. X/TikTok's
 * "one punchy statement" / "single focal point" notes carry no bullets). */
export function enforceTextDensity(
  slide: SlideContent,
  platform: CarouselPlatformKey,
): SlideContent {
  const { limits } = carouselPlatforms[platform];

  return {
    ...slide,
    hook: slide.hook ? truncate(slide.hook, limits.title) : slide.hook,
    title: truncate(slide.title, limits.title),
    subtitle:
      slide.subtitle && limits.subtitle > 0
        ? truncate(slide.subtitle, limits.subtitle)
        : undefined,
    bulletPoints:
      slide.bulletPoints && limits.maxBullets > 0
        ? slide.bulletPoints
            .slice(0, limits.maxBullets)
            .map((bullet) => truncate(bullet, limits.bullet))
        : undefined,
  };
}
