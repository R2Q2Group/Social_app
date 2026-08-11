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
