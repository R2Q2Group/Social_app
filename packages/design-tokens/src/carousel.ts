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
// `layout` picks the SlideCard visual variant (render/SlideCard.tsx); `limits`
// are enforced by render/textDensity.ts before a slide is rendered/exported.
// A limit of 0 means that field is dropped entirely for the platform (e.g.
// X/TikTok's "one punchy statement" / "single focal point" style notes).
export const carouselPlatforms = {
  linkedin: {
    aspectRatio: "4:5",
    textDensity: "medium",
    layout: "accentBar",
    limits: { title: 60, subtitle: 90, bullet: 80, maxBullets: 3 },
  },
  instagram: {
    aspectRatio: "4:5",
    textDensity: "low",
    layout: "centered",
    limits: { title: 40, subtitle: 60, bullet: 60, maxBullets: 2 },
  },
  xThreads: {
    aspectRatio: "16:9",
    textDensity: "low",
    layout: "statement",
    limits: { title: 50, subtitle: 70, bullet: 0, maxBullets: 0 },
  },
  tiktokReelsCover: {
    aspectRatio: "9:16",
    textDensity: "low",
    layout: "focal",
    limits: { title: 30, subtitle: 0, bullet: 0, maxBullets: 0 },
  },
  pinterest: {
    aspectRatio: "2:3",
    textDensity: "high",
    layout: "topHeavy",
    limits: { title: 70, subtitle: 100, bullet: 90, maxBullets: 4 },
  },
  facebook: {
    aspectRatio: "1:1",
    textDensity: "low",
    layout: "accentBar",
    limits: { title: 50, subtitle: 70, bullet: 70, maxBullets: 2 },
  },
} as const;

export type CarouselPlatformKey = keyof typeof carouselPlatforms;
