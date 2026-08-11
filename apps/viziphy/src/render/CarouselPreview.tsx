import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { carouselColors } from "@r2q2/design-tokens";
import type { CarouselDraft } from "@r2q2/ai-core";
import { LinkedInSlideCard } from "./LinkedInSlideCard";

const SLIDE_SIDE_PADDING = 24;

export interface CarouselPreviewProps {
  draft: CarouselDraft;
  /** Called as each slide mounts/unmounts, so the caller (export flow) can
   * capture a specific slide's rendered View by index. */
  onSlideRef?: (index: number, ref: View | null) => void;
  /** Reports which slide is currently in view, e.g. so an "Export PNG"
   * action knows which slide to capture. */
  onActiveIndexChange?: (index: number) => void;
}

export function CarouselPreview({
  draft,
  onSlideRef,
  onActiveIndexChange,
}: CarouselPreviewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const pageWidth = windowWidth;
  const slideWidth = windowWidth - SLIDE_SIDE_PADDING * 2;

  useEffect(() => {
    onActiveIndexChange?.(activeIndex);
    // onActiveIndexChange is expected to be a stable callback (or the
    // caller should memoize it) — only re-run when the index itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const handleMomentumScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setActiveIndex(Math.max(0, Math.min(index, draft.slides.length - 1)));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {draft.slides.map((slide, index) => (
          <View key={index} style={{ width: pageWidth, alignItems: "center" }}>
            <LinkedInSlideCard
              ref={(ref) => onSlideRef?.(index, ref)}
              slide={slide}
              index={index}
              total={draft.slides.length}
              width={slideWidth}
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
