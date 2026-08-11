// RDD.md Section 4: YouTube thumbnail headline caps at `thumbnailCanvas.maxWords`.
// SVG <Text> doesn't auto-wrap, so this also splits into up to two lines --
// the two-line stacked-bold-headline look is itself standard for the
// shock-face/tutorial-arrow thumbnail styles this app targets, not just an
// SVG limitation worked around.
export function fitHeadline(text: string, maxWords: number): string[] {
  const words = text.trim().split(/\s+/).slice(0, maxWords);
  if (words.length <= 2) return [words.join(" ")];

  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}
