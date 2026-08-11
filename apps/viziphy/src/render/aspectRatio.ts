/** Parses a design-tokens aspect ratio string ("4:5") into a width/height number. */
export function parseAspectRatio(ratio: string): number {
  const [width, height] = ratio.split(":").map(Number);
  if (!width || !height) {
    throw new Error(`Invalid aspect ratio string: "${ratio}"`);
  }
  return width / height;
}
