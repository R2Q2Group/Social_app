// Carousel token set (Viziphy): dark-mode default, minimal layout.
// RDD.md Section 3.3.

export const carouselColors = {
  background: "#0B0D12",
  surface: "#15181F",
  text: "#F5F6F8",
  textMuted: "#9AA1AE",
  accent: "#5B8CFF",
  statPositive: "#3DD68C",
  statNegative: "#FF6B6B",
} as const;

export const carouselTypeScale = {
  hook: 40,
  title: 28,
  subtitle: 18,
  body: 15,
  caption: 12,
} as const;

// RDD.md Section 4 — aspect ratio + text-density rules per platform.
export const carouselPlatforms = {
  linkedin: { aspectRatio: "4:5", textDensity: "medium" },
  instagram: { aspectRatio: "4:5", textDensity: "low" },
  xThreads: { aspectRatio: "16:9", textDensity: "low" },
  tiktokReelsCover: { aspectRatio: "9:16", textDensity: "low" },
  pinterest: { aspectRatio: "2:3", textDensity: "high" },
  facebook: { aspectRatio: "1:1", textDensity: "low" },
} as const;
