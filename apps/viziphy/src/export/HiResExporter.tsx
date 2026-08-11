import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import type { CarouselPlatformKey } from "@r2q2/design-tokens";
import type { CarouselDraft } from "@r2q2/ai-core";
import { SlideCard } from "../render/SlideCard";
import type { BrandFontKey } from "../fonts";

/** Standard-quality off-screen export width — used for free-tier PDF export
 * and for batch export's per-platform captures. Meaningfully sharper than
 * capturing the on-screen phone-width preview (Gate 2/3's approach) without
 * the Pro tier's extra render cost. */
export const STANDARD_EXPORT_WIDTH = 720;

/** Pro-only high-res export width. RDD Section 5 lists "high-res PDF
 * export" as a Pro perk; this is what makes that real. */
export const HI_RES_EXPORT_WIDTH = 1440;

export type SlideRefGetter = (platform: CarouselPlatformKey, index: number) => View | null;

export interface HiResExporterProps {
  draft: CarouselDraft;
  platforms: CarouselPlatformKey[];
  targetWidth: number;
  fontFamily?: BrandFontKey;
  showWatermark?: boolean;
  /** Fires once every slide across every platform has mounted and set its
   * ref, handing back a getter so the caller can look refs up by
   * (platform, index) without holding its own ref-tracking state. */
  onReady: (getRef: SlideRefGetter) => void;
}

/** Mounts every slide of every requested platform off-screen at a fixed
 * pixel width, so PDF/batch export can capture higher resolution than the
 * on-screen phone-width preview.
 *
 * Deliberately does NOT pass an explicit width/height to captureRef itself
 * (Gate 2 found that hangs indefinitely under Fabric — it forces a relayout
 * of the *already on-screen* source view). Instead, this mounts a *new* view
 * tree already laid out at the target width via normal props, so captureRef
 * is called against a view that never needs to be resized. Positioned
 * off-screen (not opacity:0) so it's unambiguously outside the visible
 * layout tree while still being measured/laid out/paintable for capture. */
export function HiResExporter({
  draft,
  platforms,
  targetWidth,
  fontFamily,
  showWatermark,
  onReady,
}: HiResExporterProps) {
  // A fresh Map per mount is all that's needed — the caller
  // (preview.tsx/batch export) always unmounts this component between
  // requests via `{pendingExport ? <HiResExporter ... /> : null}`, so a new
  // instance (and thus a fresh `useRef`) is created per export. A
  // `useEffect`-based reset here previously raced the ref-collection: passive
  // effects run shortly *after* commit, so it could (and reliably did) wipe
  // every just-attached ref out from under `onReady`'s consumer before
  // `getRef` was ever called, making every capture fail with a null ref.
  const refs = useRef(new Map<string, View | null>());
  const reportedRef = useRef(false);

  const expectedCount = platforms.reduce(
    (sum, platform) => sum + draft.slides.length,
    0,
  );

  function handleRef(key: string, ref: View | null) {
    refs.current.set(key, ref);
    if (reportedRef.current) return;
    const allSet = refs.current.size >= expectedCount && [...refs.current.values()].every(Boolean);
    if (allSet) {
      reportedRef.current = true;
      onReady((platform, index) => refs.current.get(`${platform}-${index}`) ?? null);
    }
  }

  return (
    <View style={styles.offscreen} pointerEvents="none">
      {platforms.map((platform) =>
        draft.slides.map((slide, index) => (
          <SlideCard
            key={`${platform}-${index}`}
            ref={(ref) => handleRef(`${platform}-${index}`, ref)}
            slide={slide}
            index={index}
            total={draft.slides.length}
            width={targetWidth}
            platform={platform}
            showWatermark={showWatermark}
            fontFamily={fontFamily}
          />
        )),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: "absolute",
    left: -100000,
    top: 0,
  },
});
