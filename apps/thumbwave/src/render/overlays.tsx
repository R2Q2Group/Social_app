// Gate 4: arrow/circle/emoji vector overlay system (RDD.md Section 3.2/4).
// The AI returns a free-form `calloutShape` string (schema.ts only requires
// it be non-empty), not a fixed enum, so `overlayKindForCalloutShape` maps
// it onto one of the three overlay kinds via substring heuristics — the same
// pattern SlideCard.tsx uses for carousel `calloutType` -> accent color.
import { Circle, Path, Text as SvgText } from "react-native-svg";

export type OverlayKind = "arrow" | "circle" | "emoji";

const ARROW_KEYWORDS = ["arrow", "point", "swipe", "click"];
const CIRCLE_KEYWORDS = ["circle", "ring", "loop", "highlight", "spotlight"];

export function overlayKindForCalloutShape(calloutShape: string): OverlayKind {
  const lower = calloutShape.toLowerCase();
  if (ARROW_KEYWORDS.some((k) => lower.includes(k))) return "arrow";
  if (CIRCLE_KEYWORDS.some((k) => lower.includes(k))) return "circle";
  return "emoji";
}

const EMOJI_BY_STYLE: Record<string, string> = {
  "shock-face": "\u{1F631}",
  "minimalist-tech-review": "\u{1F4A1}",
  "tutorial-arrow": "\u{1F447}",
};

export function emojiForPresetStyle(presetStyle?: string): string {
  if (presetStyle && EMOJI_BY_STYLE[presetStyle]) {
    return EMOJI_BY_STYLE[presetStyle];
  }
  return "\u{1F525}"; // fire — generic high-CTR default
}

export interface OverlayProps {
  kind: OverlayKind;
  x: number;
  y: number;
  size: number;
  color: string;
  presetStyle?: string;
}

/** A hand-drawn-style arrow, pointing up-right toward the headline —
 * mirrors the "tutorial-arrow" preset's callout. */
function ArrowOverlay({ x, y, size, color }: OverlayProps) {
  const path = `M ${x} ${y + size} L ${x + size * 0.7} ${y + size * 0.3} M ${x + size * 0.35} ${y + size * 0.3} L ${x + size * 0.7} ${y + size * 0.3} L ${x + size * 0.7} ${y + size * 0.65}`;
  return (
    <Path
      d={path}
      stroke={color}
      strokeWidth={size * 0.12}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}

function CircleOverlay({ x, y, size, color }: OverlayProps) {
  return (
    <Circle
      cx={x + size / 2}
      cy={y + size / 2}
      r={size / 2}
      stroke={color}
      strokeWidth={size * 0.1}
      fill="none"
    />
  );
}

function EmojiOverlay({ x, y, size, presetStyle }: OverlayProps) {
  return (
    <SvgText
      x={x + size / 2}
      y={y + size * 0.85}
      fontSize={size}
      textAnchor="middle"
    >
      {emojiForPresetStyle(presetStyle)}
    </SvgText>
  );
}

export function CalloutOverlay(props: OverlayProps) {
  switch (props.kind) {
    case "arrow":
      return <ArrowOverlay {...props} />;
    case "circle":
      return <CircleOverlay {...props} />;
    case "emoji":
    default:
      return <EmojiOverlay {...props} />;
  }
}
