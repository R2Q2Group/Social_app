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

// Body content auto-fit (Gate 7): a layout's heading gets a width-fit above,
// but a long hook+title+subtitle+bullets combo can still be *taller* than
// the space left for it, overflowing into the page indicator/watermark
// below (RN doesn't clip a flex item's overflowing children to its
// allocated box, only an ancestor with `overflow: hidden` does, so the
// overflow renders on top of whatever comes after it in the tree). This
// estimates stacked text height the same way `fitFontSizeToWidth` estimates
// word width, so supporting text can shrink to fit instead.

/** Estimated number of wrapped lines `text` occupies at `fontSize` within
 * `availableWidth`, via the same greedy word-wrap simulation the browser/RN
 * layout engine performs -- approximate, not pixel-exact, which is enough to
 * budget vertical space. */
export function estimateWrappedLineCount(
  text: string,
  fontSize: number,
  availableWidth: number,
): number {
  if (!text) return 0;
  if (availableWidth <= 0) return 1;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;

  const spaceWidth = estimateTextWidth(" ", fontSize);
  let lines = 1;
  let lineWidth = 0;
  for (const word of words) {
    const wordWidth = estimateTextWidth(word, fontSize);
    const nextWidth = lineWidth === 0 ? wordWidth : lineWidth + spaceWidth + wordWidth;
    if (nextWidth > availableWidth && lineWidth > 0) {
      lines += 1;
      lineWidth = wordWidth;
    } else {
      lineWidth = nextWidth;
    }
  }
  return lines;
}

export interface HeightBlock {
  text: string;
  fontSize: number;
  /** Line height as a multiple of `fontSize`, matching the block's real style. */
  lineHeight: number;
  availableWidth: number;
  marginTop?: number;
}

/** Scale factor (<=1) to shrink `blocks`' font sizes by so their estimated
 * stacked height fits `availableHeight`. Returns 1 when they already fit.
 * Never returns below `minScale` -- shrinking supporting text below
 * legibility is worse than a layout's `overflow: hidden` backstop clipping
 * a little of it, the same trade-off `fitFontSizeToWidth` makes for
 * headings. */
export function fitScaleToHeight(
  blocks: HeightBlock[],
  availableHeight: number,
  minScale = 0.6,
): number {
  if (availableHeight <= 0) return minScale;

  const naturalHeight = blocks.reduce((sum, block) => {
    const lines = estimateWrappedLineCount(block.text, block.fontSize, block.availableWidth);
    return sum + (block.marginTop ?? 0) + lines * block.fontSize * block.lineHeight;
  }, 0);
  if (naturalHeight <= availableHeight || naturalHeight <= 0) return 1;

  return Math.max(minScale, availableHeight / naturalHeight);
}
