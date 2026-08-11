// Thumbnail token set (Thumbwave, from Gate 4): high-saturation, outlined bold
// text, max 2-3 colors. RDD.md Section 3.3.

export const thumbnailColors = {
  background: "#FFE600",
  text: "#0B0D12",
  outline: "#FFFFFF",
  accent: "#FF3B30",
} as const;

export const thumbnailTypeScale = {
  headline: 96,
  subhead: 48,
} as const;

// RDD.md Section 4 — 1280x720, 3-5 word max, face/arrow callouts, A/B variants.
export const thumbnailCanvas = {
  width: 1280,
  height: 720,
  maxWords: 5,
} as const;

export const thumbnailPresetStyles = [
  "shock-face",
  "minimalist-tech-review",
  "tutorial-arrow",
] as const;

// App chrome palette for Thumbwave's own screens (idea input, variant
// preview, account) -- distinct from `thumbnailColors` above, which is the
// loud, high-saturation, max-2-3-color palette for the *exported thumbnail
// images themselves* (RDD.md Section 3.3). Reusing thumbnailColors for the
// surrounding app UI would mean bright-yellow screens with red-on-yellow
// buttons everywhere; this is the same dark-mode-professional shape as
// carouselColors/carouselTypeScale so screens can share structure across
// the family (RDD.md Gate 3.5's shared-account UI, in particular).
export const thumbnailAppColors = {
  background: "#0B0D12",
  text: "#F5F7FA",
  textMuted: "#8B93A7",
  surface: "#161A23",
  accent: "#FFE600",
  statPositive: "#3DD68C",
  statNegative: "#FF6B6B",
} as const;

export const thumbnailAppTypeScale = {
  hook: 32,
  body: 16,
  caption: 13,
} as const;
