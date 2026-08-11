import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { carouselColors, carouselPlatforms, type CarouselPlatformKey } from "@r2q2/design-tokens";
import type { CarouselDraft } from "@r2q2/ai-core";
import { SlideCard } from "./SlideCard";
import { parseAspectRatio } from "./aspectRatio";
import type { BrandFontKey } from "../fonts";

const SLIDE_SIDE_PADDING = 24;
const SLIDE_VERTICAL_PADDING = 16;

export interface CarouselPreviewProps {
  draft: CarouselDraft;
  platform: CarouselPlatformKey;
  /** Called as each slide mounts/unmounts, so the caller (export flow) can
   * capture a specific slide's rendered View by index. */
  onSlideRef?: (index: number, ref: View | null) => void;
  /** Reports which slide is currently in view, e.g. so an "Export PNG"
   * action knows which slide to capture. */
  onActiveIndexChange?: (index: number) => void;
  /** Gate 5: free-tier export watermark, omitted (or false) for Pro. */
  showWatermark?: boolean;
  /** Gate 6: Pro-only brand font pack, omitted for the default system font. */
  fontFamily?: BrandFontKey;
}

export function CarouselPreview({
  draft,
  platform,
  onSlideRef,
  onActiveIndexChange,
  showWatermark,
  fontFamily,
}: CarouselPreviewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const pageWidth = windowWidth;

  // Portrait platforms (TikTok 9:16, Pinterest 2:3) can render taller than
  // the space available on screen — a horizontal ScrollView clips vertical
  // overflow, which would hide the bottom of the card (including the page
  // indicator) rather than shrinking it. Fit the card within whichever of
  // width/height is more constraining, so it's always fully visible.
  const aspectRatio = parseAspectRatio(carouselPlatforms[platform].aspectRatio);
  const widthBudget = windowWidth - SLIDE_SIDE_PADDING * 2;
  const heightBudget =
    containerHeight > 0
      ? Math.max(containerHeight - SLIDE_VERTICAL_PADDING * 2, 0) * aspectRatio
      : widthBudget;
  const slideWidth = Math.min(widthBudget, heightBudget);

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    setContainerHeight(e.nativeEvent.layout.height);
  };

  useEffect(() => {
    onActiveIndexChange?.(activeIndex);
    // onActiveIndexChange is expected to be a stable callback (or the
    // caller should memoize it) — only re-run when the index itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // The ScrollView remounts on platform change (see `key={platform}` below)
  // and resets its own scroll offset — mirror that here so activeIndex
  // doesn't keep pointing at a slide the ScrollView no longer shows.
  useEffect(() => {
    setActiveIndex(0);
  }, [platform]);

  const handleMomentumScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setActiveIndex(Math.max(0, Math.min(index, draft.slides.length - 1)));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        // Remount on platform switch: each platform has its own aspect
        // ratio, so a preserved scroll offset would land mid-slide.
        key={platform}
        style={styles.scrollView}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onLayout={handleContainerLayout}
      >
        {draft.slides.map((slide, index) => (
          <View key={index} style={{ width: pageWidth, alignItems: "center", justifyContent: "center" }}>
            <SlideCard
              ref={(ref) => onSlideRef?.(index, ref)}
              slide={slide}
              index={index}
              total={draft.slides.length}
              width={slideWidth}
              platform={platform}
              showWatermark={showWatermark}
              fontFamily={fontFamily}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {draft.slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: carouselColors.accent,
  },
  dotInactive: {
    backgroundColor: carouselColors.surface,
  },
});
