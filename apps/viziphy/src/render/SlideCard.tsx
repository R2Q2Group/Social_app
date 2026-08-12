import { forwardRef, type Ref } from "react";
import { StyleSheet, Text, View, type TextStyle } from "react-native";
import { Circle, Rect, Svg } from "react-native-svg";
import {
  carouselColors,
  carouselPlatforms,
  carouselTypeScale,
  type CarouselPlatformKey,
} from "@r2q2/design-tokens";
import type { SlideContent } from "@r2q2/ai-core";
import { parseAspectRatio } from "./aspectRatio";
import { enforceTextDensity } from "./textDensity";
import { fitFontSizeToWidth, fitScaleToHeight, estimateWrappedLineCount, type HeightBlock } from "./fitText";
import { brandTextStyle, type BrandFontKey } from "../fonts";

const ACCENT_BAR_WIDTH = 6;
const PADDING = 24;
// Approximate space a bullet's "• " mark + its row's marginRight claims,
// so bullet-text height/width budgeting doesn't assume the full row width.
const BULLET_MARK_RESERVED_WIDTH = 24;
// Matches styles.body's marginTop below -- named so AccentBarLayout's
// height budgeting can reference the same number without reaching into the
// StyleSheet.create output (RegisteredStyle<T> isn't guaranteed to expose it).
const BODY_MARGIN_TOP = 16;

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
  fontFamily?: BrandFontKey;
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
  fontFamily,
}: EmphasisTextProps) {
  if (!emphasisWords || emphasisWords.length === 0) {
    return <Text style={style}>{text}</Text>;
  }
  const targets = emphasisWords.map((w) => w.toLowerCase());
  const parts = text.split(/(\s+)/);
  const emphasisStyle = { color: highlightColor, ...brandTextStyle(fontFamily, "bold") };
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        const bare = part.replace(/[^\w'-]/g, "").toLowerCase();
        const isEmphasized =
          bare.length > 0 && targets.some((t) => t.includes(bare));
        return (
          <Text key={i} style={isEmphasized ? emphasisStyle : undefined}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

function PageIndicator({ index, total, style }: { index: number; total: number; style?: TextStyle }) {
  return (
    <Text style={[styles.pageIndicator, style]}>
      {index + 1} / {total}
    </Text>
  );
}

/** Gate 5: free-tier export watermark. Rendered as a normal child of each
 * layout's top-level View (the one captureRef captures), not a separate
 * overlay pass, so PNG/PDF export picks it up for free. */
function Watermark() {
  return <Text style={styles.watermark}>Made with Viziphy</Text>;
}

function Bullets({
  bullets,
  accentColor,
  align = "left",
  fontFamily,
  fontSize = carouselTypeScale.body,
  marginTop,
}: {
  bullets?: string[];
  accentColor: string;
  align?: "left" | "center";
  fontFamily?: BrandFontKey;
  /** Gate 7: scaled down by AccentBarLayout's body-height auto-fit on
   * text-heavy drafts; other layouts render at the default body size. */
  fontSize?: number;
  marginTop?: number;
}) {
  if (!bullets || bullets.length === 0) return null;
  return (
    <View
      style={[
        styles.bullets,
        align === "center" && styles.bulletsCentered,
        marginTop !== undefined && { marginTop },
      ]}
    >
      {bullets.map((bullet, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={[styles.bulletMark, { color: accentColor, fontSize }]}>{"•"}</Text>
          <Text
            style={[
              styles.bulletText,
              brandTextStyle(fontFamily, "regular"),
              { fontSize, lineHeight: fontSize * 1.4 },
            ]}
          >
            {bullet}
          </Text>
        </View>
      ))}
    </View>
  );
}

interface LayoutProps {
  cardRef: Ref<View>;
  slide: SlideContent;
  index: number;
  total: number;
  width: number;
  height: number;
  accentColor: string;
  showWatermark?: boolean;
  fontFamily?: BrandFontKey;
}

/** LinkedIn/Facebook: professional, left accent bar, stacked hook/title/subtitle/bullets. */
function AccentBarLayout({ cardRef, slide, index, total, width, height, accentColor, showWatermark, fontFamily }: LayoutProps) {
  const heading = slide.hook || slide.title;
  const bodyWidth = width - ACCENT_BAR_WIDTH - PADDING * 2;
  const headingFontSize = fitFontSizeToWidth(
    heading,
    slide.hook ? carouselTypeScale.hook : carouselTypeScale.title,
    bodyWidth,
  );
  const headingStyle: TextStyle = {
    fontSize: headingFontSize,
    color: carouselColors.text,
    ...brandTextStyle(fontFamily, "bold"),
  };

  // Gate 7: on a long hook+title+subtitle+bullets draft, body's stacked
  // content can be taller than what's actually left for it once the
  // caption/heading/page-indicator take their share -- and RN doesn't clip
  // a flex item's overflowing children to its own box, so it renders on top
  // of the page indicator/watermark instead. Budget what's left after the
  // heading and shrink the supporting text (not the heading, already
  // width-fit above) to fit it.
  const captionHeight = slide.calloutType ? carouselTypeScale.caption * 1.3 : 0;
  const pageIndicatorHeight = carouselTypeScale.caption * 1.3;
  const headingHeight =
    estimateWrappedLineCount(heading, headingFontSize, bodyWidth) * headingFontSize * 1.15;
  const supportingBudget =
    height - PADDING * 2 - captionHeight - pageIndicatorHeight - BODY_MARGIN_TOP - headingHeight;

  const supportingBlocks: HeightBlock[] = [];
  if (slide.hook) {
    supportingBlocks.push({
      text: slide.title,
      fontSize: carouselTypeScale.title,
      lineHeight: 1.2,
      availableWidth: bodyWidth,
      marginTop: 12,
    });
  }
  if (slide.subtitle) {
    supportingBlocks.push({
      text: slide.subtitle,
      fontSize: carouselTypeScale.subtitle,
      lineHeight: 1.2,
      availableWidth: bodyWidth,
      marginTop: 8,
    });
  }
  if (slide.bulletPoints && slide.bulletPoints.length > 0) {
    slide.bulletPoints.forEach((bullet, i) => {
      supportingBlocks.push({
        text: bullet,
        fontSize: carouselTypeScale.body,
        lineHeight: 1.4,
        availableWidth: bodyWidth - BULLET_MARK_RESERVED_WIDTH,
        marginTop: i === 0 ? 16 : 8,
      });
    });
  }
  const bodyScale = fitScaleToHeight(supportingBlocks, supportingBudget);
  const scaledTitleSize = carouselTypeScale.title * bodyScale;
  const scaledSubtitleSize = carouselTypeScale.subtitle * bodyScale;
  const scaledBulletSize = carouselTypeScale.body * bodyScale;

  return (
    <View
      ref={cardRef}
      collapsable={false}
      style={[styles.card, { width, height, backgroundColor: carouselColors.background }]}
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
          <EmphasisText
            text={heading}
            emphasisWords={slide.emphasisWords}
            style={headingStyle}
            highlightColor={accentColor}
            fontFamily={fontFamily}
          />

          {slide.hook ? (
            <Text style={{ fontSize: scaledTitleSize, color: carouselColors.text, marginTop: 12 * bodyScale, ...brandTextStyle(fontFamily, "medium") }}>
              {slide.title}
            </Text>
          ) : null}

          {slide.subtitle ? (
            <Text style={{ fontSize: scaledSubtitleSize, color: carouselColors.textMuted, marginTop: 8 * bodyScale, ...brandTextStyle(fontFamily, "regular") }}>
              {slide.subtitle}
            </Text>
          ) : null}

          <Bullets
            bullets={slide.bulletPoints}
            accentColor={accentColor}
            fontFamily={fontFamily}
            fontSize={scaledBulletSize}
            marginTop={16 * bodyScale}
          />
        </View>

        <PageIndicator index={index} total={total} style={styles.pageIndicatorRight} />
      </View>
      {showWatermark ? <Watermark /> : null}
    </View>
  );
}

/** Instagram: centered, colorful — accent circle behind the hook, less text. */
function CenteredLayout({ cardRef, slide, index, total, width, height, accentColor, showWatermark, fontFamily }: LayoutProps) {
  const heading = slide.hook || slide.title;
  const headingFontSize = fitFontSizeToWidth(heading, carouselTypeScale.title, width - PADDING * 2);

  return (
    <View
      ref={cardRef}
      collapsable={false}
      style={[styles.card, { width, height, backgroundColor: carouselColors.background }]}
    >
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Circle cx={width / 2} cy={height * 0.32} r={width * 0.55} fill={accentColor} opacity={0.14} />
      </Svg>

      <View style={[styles.content, styles.contentCentered, { padding: PADDING }]}>
        {slide.calloutType ? (
          <View style={[styles.badge, { backgroundColor: accentColor }]}>
            <Text style={styles.badgeText}>{slide.calloutType.toUpperCase()}</Text>
          </View>
        ) : null}

        <View style={styles.bodyCentered}>
          <EmphasisText
            text={heading}
            emphasisWords={slide.emphasisWords}
            style={{ fontSize: headingFontSize, color: carouselColors.text, textAlign: "center", ...brandTextStyle(fontFamily, "bold") }}
            highlightColor={accentColor}
            fontFamily={fontFamily}
          />
          {slide.subtitle ? (
            <Text style={{ fontSize: carouselTypeScale.subtitle, color: carouselColors.textMuted, marginTop: 10, textAlign: "center", ...brandTextStyle(fontFamily, "regular") }}>
              {slide.subtitle}
            </Text>
          ) : null}
          <Bullets bullets={slide.bulletPoints} accentColor={accentColor} align="center" fontFamily={fontFamily} />
        </View>

        <PageIndicator index={index} total={total} />
      </View>
      {showWatermark ? <Watermark /> : null}
    </View>
  );
}

/** X Threads: one punchy statement, centered, no bullets — bulletPoints are
 * already stripped by enforceTextDensity for this platform. */
function StatementLayout({ cardRef, slide, index, total, width, height, accentColor, showWatermark, fontFamily }: LayoutProps) {
  const heading = slide.hook || slide.title;
  const headingFontSize = fitFontSizeToWidth(heading, carouselTypeScale.title, width - PADDING * 3);

  return (
    <View
      ref={cardRef}
      collapsable={false}
      style={[styles.card, styles.statementCard, { width, height, backgroundColor: carouselColors.background }]}
    >
      <View style={styles.statementInner}>
        <EmphasisText
          text={heading}
          emphasisWords={slide.emphasisWords}
          style={{ fontSize: headingFontSize, color: carouselColors.text, textAlign: "center", ...brandTextStyle(fontFamily, "bold") }}
          highlightColor={accentColor}
          fontFamily={fontFamily}
        />
        {slide.subtitle ? (
          <Text style={{ fontSize: carouselTypeScale.subtitle, color: carouselColors.textMuted, marginTop: 12, textAlign: "center", ...brandTextStyle(fontFamily, "regular") }}>
            {slide.subtitle}
          </Text>
        ) : null}
      </View>
      <PageIndicator index={index} total={total} style={styles.pageIndicatorRight} />
      {showWatermark ? <Watermark /> : null}
    </View>
  );
}

/** TikTok/Reels cover: bold single focal point, huge type, no subtitle/bullets
 * — both are already stripped by enforceTextDensity for this platform. */
function FocalLayout({ cardRef, slide, index, total, width, height, accentColor, showWatermark, fontFamily }: LayoutProps) {
  const heading = slide.hook || slide.title;
  // 9:16 is the narrowest card and this the largest type in the app, so it's
  // the one heading that regularly needs shrinking to keep a long word
  // ("household") from being broken mid-word.
  const headingFontSize = fitFontSizeToWidth(
    heading,
    carouselTypeScale.hook * 1.3,
    width - PADDING * 3,
    carouselTypeScale.title,
  );

  return (
    <View
      ref={cardRef}
      collapsable={false}
      style={[styles.card, styles.statementCard, { width, height, backgroundColor: carouselColors.background }]}
    >
      <View style={styles.statementInner}>
        <EmphasisText
          text={heading}
          emphasisWords={slide.emphasisWords}
          style={{ fontSize: headingFontSize, color: carouselColors.text, textAlign: "center", ...(fontFamily ? brandTextStyle(fontFamily, "bold") : { fontWeight: "800" as const }) }}
          highlightColor={accentColor}
          fontFamily={fontFamily}
        />
      </View>
      <PageIndicator index={index} total={total} style={styles.pageIndicatorRight} />
      {showWatermark ? <Watermark /> : null}
    </View>
  );
}

/** Pinterest: text-heavy top third (SEO-style title), decorative color block
 * filling the rest — stands in for the pin's image area. */
function TopHeavyLayout({ cardRef, slide, index, total, width, height, accentColor, showWatermark, fontFamily }: LayoutProps) {
  const topHeight = height * 0.38;
  return (
    <View
      ref={cardRef}
      collapsable={false}
      style={[styles.card, { width, height, backgroundColor: carouselColors.background }]}
    >
      <View style={{ height: topHeight, padding: PADDING, justifyContent: "center" }}>
        {slide.calloutType ? (
          <Text style={[styles.caption, { color: accentColor }]}>
            {slide.calloutType.toUpperCase()}
          </Text>
        ) : null}
        <EmphasisText
          text={slide.title}
          emphasisWords={slide.emphasisWords}
          style={{ fontSize: fitFontSizeToWidth(slide.title, carouselTypeScale.title, width - PADDING * 2), color: carouselColors.text, marginTop: 4, ...brandTextStyle(fontFamily, "bold") }}
          highlightColor={accentColor}
          fontFamily={fontFamily}
        />
        {slide.subtitle ? (
          <Text style={{ fontSize: carouselTypeScale.subtitle, color: carouselColors.textMuted, marginTop: 6, ...brandTextStyle(fontFamily, "regular") }}>
            {slide.subtitle}
          </Text>
        ) : null}
      </View>

      <View style={{ flex: 1, backgroundColor: carouselColors.surface, padding: PADDING }}>
        <Svg style={StyleSheet.absoluteFill} width={width} height={height - topHeight}>
          <Rect x={0} y={0} width={width} height={height - topHeight} fill={accentColor} opacity={0.08} />
        </Svg>
        <View style={{ flex: 1 }}>
          <Bullets bullets={slide.bulletPoints} accentColor={accentColor} fontFamily={fontFamily} />
        </View>
        <PageIndicator index={index} total={total} />
      </View>
      {showWatermark ? <Watermark /> : null}
    </View>
  );
}

export interface SlideCardProps {
  slide: SlideContent;
  index: number;
  total: number;
  width: number;
  platform: CarouselPlatformKey;
  /** Gate 5: free-tier export watermark, omitted (or false) for Pro. */
  showWatermark?: boolean;
  /** Gate 6: Pro-only brand font pack, omitted for the default system font. */
  fontFamily?: BrandFontKey;
}

export const SlideCard = forwardRef<View, SlideCardProps>(function SlideCard(
  { slide: rawSlide, index, total, width, platform, showWatermark, fontFamily },
  ref,
) {
  const { aspectRatio, layout } = carouselPlatforms[platform];
  const height = width / parseAspectRatio(aspectRatio);
  const slide = enforceTextDensity(rawSlide, platform);
  const accentColor = accentForCalloutType(slide.calloutType);
  const layoutProps: LayoutProps = { cardRef: ref, slide, index, total, width, height, accentColor, showWatermark, fontFamily };

  switch (layout) {
    case "centered":
      return <CenteredLayout {...layoutProps} />;
    case "statement":
      return <StatementLayout {...layoutProps} />;
    case "focal":
      return <FocalLayout {...layoutProps} />;
    case "topHeavy":
      return <TopHeavyLayout {...layoutProps} />;
    case "accentBar":
    default:
      return <AccentBarLayout {...layoutProps} />;
  }
});

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  statementCard: {
    flexDirection: "column",
    padding: PADDING * 1.5,
  },
  statementInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingRight: PADDING,
    paddingTop: PADDING,
    paddingBottom: PADDING,
    justifyContent: "space-between",
  },
  contentCentered: {
    alignItems: "center",
  },
  caption: {
    fontSize: carouselTypeScale.caption,
    fontWeight: "700",
    letterSpacing: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: carouselTypeScale.caption,
    fontWeight: "700",
    letterSpacing: 1,
    color: carouselColors.background,
  },
  body: {
    flex: 1,
    justifyContent: "flex-start",
    marginTop: BODY_MARGIN_TOP,
    // Gate 7 backstop: the height auto-fit above should keep content within
    // budget, but this guarantees that even if the estimate is off, excess
    // content clips inside body's own box instead of rendering on top of
    // the page indicator/watermark below it.
    overflow: "hidden",
  },
  bodyCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bullets: {
    marginTop: 16,
  },
  bulletsCentered: {
    alignItems: "center",
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
  },
  pageIndicatorRight: {
    alignSelf: "flex-end",
  },
  watermark: {
    position: "absolute",
    bottom: 8,
    right: 12,
    fontSize: carouselTypeScale.caption,
    color: carouselColors.textMuted,
    opacity: 0.55,
  },
});
