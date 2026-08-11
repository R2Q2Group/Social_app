import { forwardRef, type Ref } from "react";
import { View, StyleSheet } from "react-native";
import {
  ClipPath,
  Circle as SvgCircle,
  Defs,
  Image as SvgImage,
  Rect,
  Svg,
  Text as SvgText,
} from "react-native-svg";
import {
  thumbnailCanvas,
  thumbnailColors,
  thumbnailTypeScale,
} from "@r2q2/design-tokens";
import type { ThumbnailVariant } from "@r2q2/ai-core";
import { CalloutOverlay, overlayKindForCalloutShape } from "./overlays";
import { fitHeadline } from "./headlineText";

const CANVAS_RATIO = thumbnailCanvas.width / thumbnailCanvas.height;

export interface ThumbnailCardProps {
  variant: ThumbnailVariant;
  width: number;
  /** Optional face-cutout photo URI (Gate 4: RDD.md 3.2 "user uploads a
   * photo, app auto-crops/outlines it as a layered vector asset" — a
   * circular crop + stroked ring, not ML background removal). */
  photoUri?: string | null;
  presetStyle?: string;
  /** Gate 5: free-tier export watermark, omitted (or false) for Pro. */
  showWatermark?: boolean;
}

export const ThumbnailCard = forwardRef<View, ThumbnailCardProps>(
  function ThumbnailCard({ variant, width, photoUri, presetStyle, showWatermark }, ref) {
    const height = width / CANVAS_RATIO;
    const scale = width / thumbnailCanvas.width;

    const headlineSize = thumbnailTypeScale.headline * scale;
    const subheadSize = thumbnailTypeScale.subhead * scale;
    const lines = fitHeadline(variant.text, thumbnailCanvas.maxWords);

    const hasPhoto = !!photoUri;
    const photoSize = height * 0.62;
    const photoCx = hasPhoto ? width * 0.78 : 0;
    const photoCy = height * 0.42;

    const textX = width * 0.06;

    const overlayKind = overlayKindForCalloutShape(variant.calloutShape);
    const overlaySize = height * 0.24;
    const overlayX = width * 0.06;
    const overlayY = height * 0.68;

    return (
      <View
        ref={ref}
        collapsable={false}
        style={[styles.card, { width, height }]}
      >
        <Svg width={width} height={height}>
          <Defs>
            {hasPhoto ? (
              <ClipPath id="photoClip">
                <SvgCircle cx={photoCx} cy={photoCy} r={photoSize / 2} />
              </ClipPath>
            ) : null}
          </Defs>

          <Rect x={0} y={0} width={width} height={height} fill={thumbnailColors.background} />

          {hasPhoto && photoUri ? (
            <>
              <SvgImage
                x={photoCx - photoSize / 2}
                y={photoCy - photoSize / 2}
                width={photoSize}
                height={photoSize}
                href={photoUri}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#photoClip)"
              />
              <SvgCircle
                cx={photoCx}
                cy={photoCy}
                r={photoSize / 2}
                stroke={thumbnailColors.outline}
                strokeWidth={height * 0.02}
                fill="none"
              />
            </>
          ) : null}

          {lines.map((line, i) => (
            <SvgText
              key={i}
              x={textX}
              y={height * 0.32 + i * headlineSize * 1.05}
              fontSize={headlineSize}
              fontWeight="bold"
              fill={thumbnailColors.text}
              stroke={thumbnailColors.outline}
              strokeWidth={headlineSize * 0.02}
            >
              {line}
            </SvgText>
          ))}

          <SvgText
            x={textX}
            y={height * 0.32 + lines.length * headlineSize * 1.05 + subheadSize}
            fontSize={subheadSize}
            fontWeight="600"
            fill={thumbnailColors.accent}
            stroke={thumbnailColors.outline}
            strokeWidth={subheadSize * 0.03}
          >
            {variant.focalConcept}
          </SvgText>

          <CalloutOverlay
            kind={overlayKind}
            x={overlayX}
            y={overlayY}
            size={overlaySize}
            color={thumbnailColors.accent}
            presetStyle={presetStyle}
          />

          {showWatermark ? (
            <SvgText
              x={width - width * 0.02}
              y={height - height * 0.03}
              fontSize={height * 0.035}
              fontWeight="600"
              fill={thumbnailColors.text}
              fillOpacity={0.4}
              textAnchor="end"
            >
              Made with Thumbwave
            </SvgText>
          ) : null}
        </Svg>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
});
