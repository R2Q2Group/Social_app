import { forwardRef } from "react";
import { StyleSheet, Text, View, type TextStyle } from "react-native";
import { Rect, Svg } from "react-native-svg";
import {
  carouselColors,
  carouselPlatforms,
  carouselTypeScale,
} from "@r2q2/design-tokens";
import type { SlideContent } from "@r2q2/ai-core";
import { parseAspectRatio } from "./aspectRatio";

const ASPECT_RATIO = parseAspectRatio(carouselPlatforms.linkedin.aspectRatio);
const ACCENT_BAR_WIDTH = 6;
const PADDING = 24;

// RDD.md's carousel tokens don't define per-calloutType colors — map the
// AI-generated calloutType values (attention/warning/insight/action, per
// Gate 1 testing) onto the existing stat/accent palette rather than
// inventing new tokens here.
const CALLOUT_ACCENTS: Record<string, string> = {
  attention: carouselColors.statNegative,
  warning: carouselColors.statNegative,
  insight: carouselColors.accent,
  action: carouselColors.statPositive,
};

function accentForCalloutType(calloutType?: string): string {
  if (!calloutType) return carouselColors.accent;
  return CALLOUT_ACCENTS[calloutType] ?? carouselColors.accent;
}

interface EmphasisTextProps {
  text: string;
  emphasisWords?: string[];
  style: TextStyle;
  highlightColor: string;
}

/** Renders `text`, bolding+coloring any word that's a substring of one of
 * `emphasisWords` — a loose heuristic that also handles multi-word phrases
 * (e.g. emphasisWords: ["built an amazing product"] highlights each of
 * "built", "an", "amazing", "product" individually). */
function EmphasisText({
  text,
  emphasisWords,
  style,
  highlightColor,
}: EmphasisTextProps) {
  if (!emphasisWords || emphasisWords.length === 0) {
    return <Text style={style}>{text}</Text>;
  }
  const targets = emphasisWords.map((w) => w.toLowerCase());
  const parts = text.split(/(\s+)/);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        const bare = part.replace(/[^\w'-]/g, "").toLowerCase();
        const isEmphasized =
          bare.length > 0 && targets.some((t) => t.includes(bare));
        return (
          <Text
            key={i}
            style={isEmphasized ? { color: highlightColor, fontWeight: "700" } : undefined}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

export interface LinkedInSlideCardProps {
  slide: SlideContent;
  index: number;
  total: number;
  width: number;
}

export const LinkedInSlideCard = forwardRef<View, LinkedInSlideCardProps>(
  function LinkedInSlideCard({ slide, index, total, width }, ref) {
    const height = width / ASPECT_RATIO;
    const accentColor = accentForCalloutType(slide.calloutType);
    const headingStyle: TextStyle = slide.hook
      ? { fontSize: carouselTypeScale.hook, fontWeight: "700", color: carouselColors.text }
      : { fontSize: carouselTypeScale.title, fontWeight: "700", color: carouselColors.text };

    return (
      <View
        ref={ref}
        collapsable={false}
        style={[
          styles.card,
          { width, height, backgroundColor: carouselColors.background },
        ]}
      >
        <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
          <Rect x={0} y={0} width={ACCENT_BAR_WIDTH} height={height} fill={accentColor} />
        </Svg>

        <View style={[styles.content, { paddingLeft: ACCENT_BAR_WIDTH + PADDING }]}>
          {slide.calloutType ? (
            <Text style={[styles.caption, { color: accentColor }]}>
              {slide.calloutType.toUpperCase()}
            </Text>
          ) : null}

          <View style={styles.body}>
            {slide.hook ? (
              <EmphasisText
                text={slide.hook}
                emphasisWords={slide.emphasisWords}
                style={headingStyle}
                highlightColor={accentColor}
              />
            ) : (
              <EmphasisText
                text={slide.title}
                emphasisWords={slide.emphasisWords}
                style={headingStyle}
                highlightColor={accentColor}
              />
            )}

            {slide.hook ? (
              <Text
                style={{
                  fontSize: carouselTypeScale.title,
                  fontWeight: "600",
                  color: carouselColors.text,
                  marginTop: 12,
                }}
              >
                {slide.title}
              </Text>
            ) : null}

            {slide.subtitle ? (
              <Text
                style={{
                  fontSize: carouselTypeScale.subtitle,
                  color: carouselColors.textMuted,
                  marginTop: 8,
                }}
              >
                {slide.subtitle}
              </Text>
            ) : null}

            {slide.bulletPoints && slide.bulletPoints.length > 0 ? (
              <View style={styles.bullets}>
                {slide.bulletPoints.map((bullet, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={[styles.bulletMark, { color: accentColor }]}>{"•"}</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <Text style={styles.pageIndicator}>
            {index + 1} / {total}
          </Text>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  content: {
    flex: 1,
    paddingRight: PADDING,
    paddingTop: PADDING,
    paddingBottom: PADDING,
    justifyContent: "space-between",
  },
  caption: {
    fontSize: carouselTypeScale.caption,
    fontWeight: "700",
    letterSpacing: 1,
  },
  body: {
    flex: 1,
    justifyContent: "flex-start",
    marginTop: 16,
  },
  bullets: {
    marginTop: 16,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bulletMark: {
    fontSize: carouselTypeScale.body,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: carouselTypeScale.body,
    color: carouselColors.text,
    lineHeight: carouselTypeScale.body * 1.4,
  },
  pageIndicator: {
    fontSize: carouselTypeScale.caption,
    color: carouselColors.textMuted,
    alignSelf: "flex-end",
  },
});
