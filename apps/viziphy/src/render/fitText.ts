// Heading auto-fit for the carousel layouts (render/SlideCard.tsx).
//
// Every layout renders its heading at a fixed size from `carouselTypeScale`,
// which is fine until a single word is wider than the card. Android then
// breaks that word across lines mid-character ("hous / ehold"), which reads
// as a rendering bug rather than a wrap. This is separate from
// render/textDensity.ts: that clips a *string* to a platform's char budget,
// while this picks a *font size* that lets the clipped string render without
// a word being split.

/** Per-character advance width as a fraction of font size, for the bold
 * sans-serif faces headings use (the system default plus the three bundled
 * Google Fonts packs from ../fonts). React Native has no synchronous text
 * measurement API and these layouts need a size before first paint, so
 * widths are estimated rather than measured.
 *
 * The estimates lean wide deliberately. Overestimating shrinks a heading
 * slightly more than strictly necessary, which merely looks conservative;
 * underestimating lets a word overflow and get broken mid-word, which is the
 * defect this exists to prevent. */
const NARROW_CHARS = "iIl1.,:;'\"`!|[](){}/\\ ";
const WIDE_CHARS = "mwMW@%";

function charAdvance(char: string): number {
  if (NARROW_CHARS.includes(char)) return 0.34;
  if (WIDE_CHARS.includes(char)) return 0.95;
  if (char >= "A" && char <= "Z") return 0.72;
  return 0.58;
}

/** Estimated rendered width of `text` in the same units as `fontSize`. */
export function estimateTextWidth(text: string, fontSize: number): number {
  let advance = 0;
  for (const char of text) advance += charAdvance(char);
  return advance * fontSize;
}

/** Fraction of the available width a fitted word is allowed to occupy.
 * `estimateTextWidth` is an approximation, so sizing a word to land exactly
 * on the boundary leaves no room for it to be off: a few percent of error in
 * the wrong direction puts the word back over the line and Android breaks it
 * again. This keeps a margin so only a large estimation error can do that. */
const FIT_SAFETY_MARGIN = 0.94;

/** Largest size at or below `baseFontSize` at which the single widest word in
 * `text` still fits `availableWidth` on one line, so no word is broken
 * mid-character.
 *
 * Only the widest *word* has to fit -- the heading itself is free to wrap
 * across lines normally. Returns `baseFontSize` unchanged whenever it already
 * fits, so layouts that were never at risk render identically. Never returns
 * below `minFontSize`: if even that can't fit the word, an illegibly small
 * heading is worse than a broken one, so the break is accepted instead. */
export function fitFontSizeToWidth(
  text: string,
  baseFontSize: number,
  availableWidth: number,
  minFontSize = 16,
): number {
  if (availableWidth <= 0) return baseFontSize;

  let widestUnitWidth = 0;
  for (const word of text.split(/\s+/)) {
    const unitWidth = estimateTextWidth(word, 1);
    if (unitWidth > widestUnitWidth) widestUnitWidth = unitWidth;
  }
  if (widestUnitWidth <= 0) return baseFontSize;

  const fittedSize = (availableWidth * FIT_SAFETY_MARGIN) / widestUnitWidth;
  return Math.max(minFontSize, Math.min(baseFontSize, fittedSize));
}
