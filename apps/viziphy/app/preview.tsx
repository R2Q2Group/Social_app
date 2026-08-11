import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import {
  carouselColors,
  carouselPlatforms,
  carouselTypeScale,
  type CarouselPlatformKey,
} from "@r2q2/design-tokens";
import { getEntitlement, submitDraftFeedback, type FeedbackRating } from "@r2q2/account-client";
import { CarouselPreview } from "../src/render/CarouselPreview";
import { captureSlidePng, captureSlidesSequentially } from "../src/export/capture";
import { buildCarouselPdf } from "../src/export/pdf";
import { buildBatchExportZip } from "../src/export/batch";
import { shareFile } from "../src/export/share";
import {
  HiResExporter,
  HI_RES_EXPORT_WIDTH,
  STANDARD_EXPORT_WIDTH,
  type SlideRefGetter,
} from "../src/export/HiResExporter";
import { useDraft } from "../src/state/draftStore";
import { BRAND_FONT_KEYS, BRAND_FONTS, type BrandFontKey } from "../src/fonts";

type ExportState = { kind: "idle" } | { kind: "png" } | { kind: "pdf" } | { kind: "batch" };

const PLATFORM_LABELS: Record<CarouselPlatformKey, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  xThreads: "X",
  tiktokReelsCover: "TikTok/Reels",
  pinterest: "Pinterest",
  facebook: "Facebook",
};

const PLATFORM_KEYS = Object.keys(carouselPlatforms) as CarouselPlatformKey[];

const BRAND_FONT_STORAGE_KEY = "@r2q2/viziphy/brandFont";

export default function Preview() {
  const router = useRouter();
  const { draft } = useDraft();
  const slideRefs = useRef<(View | null)[]>([]);
  const [platform, setPlatform] = useState<CarouselPlatformKey>("linkedin");
  const [activeIndex, setActiveIndex] = useState(0);
  const [exportState, setExportState] = useState<ExportState>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  // Defaults to showing the watermark (free tier) until the entitlement
  // check resolves, rather than briefly flashing a watermark-free export
  // for a free-tier user on a slow connection.
  const [isPro, setIsPro] = useState(false);
  const [brandFont, setBrandFont] = useState<BrandFontKey | undefined>(undefined);
  const [feedbackByPlatform, setFeedbackByPlatform] = useState<
    Partial<Record<CarouselPlatformKey, FeedbackRating>>
  >({});

  // Off-screen high-res/batch capture: set to request a render, cleared once
  // the requester has what it needs. See HiResExporter for why this can't
  // just reuse the on-screen slideRefs (only one platform is ever visible).
  const [pendingExport, setPendingExport] = useState<{
    platforms: CarouselPlatformKey[];
    targetWidth: number;
  } | null>(null);
  const pendingResolveRef = useRef<((getRef: SlideRefGetter) => void) | null>(null);

  useEffect(() => {
    if (!draft) {
      router.replace("/");
    }
  }, [draft, router]);

  useFocusEffect(
    useCallback(() => {
      getEntitlement()
        .then((entitlement) => setIsPro(entitlement.tier === "pro"))
        .catch(() => setIsPro(false));
    }, []),
  );

  useEffect(() => {
    AsyncStorage.getItem(BRAND_FONT_STORAGE_KEY)
      .then((stored) => {
        if (stored && (BRAND_FONT_KEYS as string[]).includes(stored)) {
          setBrandFont(stored as BrandFontKey);
        }
      })
      .catch(() => {});
  }, []);

  function selectBrandFont(key: BrandFontKey | undefined) {
    setBrandFont(key);
    if (key) {
      AsyncStorage.setItem(BRAND_FONT_STORAGE_KEY, key).catch(() => {});
    } else {
      AsyncStorage.removeItem(BRAND_FONT_STORAGE_KEY).catch(() => {});
    }
  }

  const handleSlideRef = useCallback((index: number, ref: View | null) => {
    slideRefs.current[index] = ref;
  }, []);

  function requestHiResRefs(
    platforms: CarouselPlatformKey[],
    targetWidth: number,
  ): Promise<SlideRefGetter> {
    return new Promise((resolve) => {
      pendingResolveRef.current = resolve;
      setPendingExport({ platforms, targetWidth });
    });
  }

  if (!draft) {
    return null;
  }

  // Applied only for Pro — a downgraded account keeps its saved preference
  // (so it's ready again if they re-upgrade) but exports render in the
  // default system font until then, same as the watermark/hi-res gating.
  const activeFontFamily = isPro ? brandFont : undefined;

  async function handleExportPng() {
    const ref = slideRefs.current[activeIndex];
    if (!ref) return;
    setError(null);
    setExportState({ kind: "png" });
    try {
      const pngUri = await captureSlidePng(ref);
      await shareFile(pngUri, "image/png", "Save slide as PNG");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExportState({ kind: "idle" });
    }
  }

  async function handleExportPdf() {
    setError(null);
    setExportState({ kind: "pdf" });
    try {
      const targetWidth = isPro ? HI_RES_EXPORT_WIDTH : STANDARD_EXPORT_WIDTH;
      const getRef = await requestHiResRefs([platform], targetWidth);
      const refs = draft!.slides.map((_, index) => getRef(platform, index));
      const pngUris = await captureSlidesSequentially(refs);
      const pdfUri = await buildCarouselPdf(pngUris, carouselPlatforms[platform].aspectRatio);
      await shareFile(pdfUri, "application/pdf", "Save carousel as PDF");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExportState({ kind: "idle" });
      setPendingExport(null);
    }
  }

  async function handleExportBatch() {
    setError(null);
    setExportState({ kind: "batch" });
    try {
      const targetWidth = isPro ? HI_RES_EXPORT_WIDTH : STANDARD_EXPORT_WIDTH;
      const getRef = await requestHiResRefs(PLATFORM_KEYS, targetWidth);
      const zipUri = await buildBatchExportZip(draft!, PLATFORM_KEYS, getRef);
      await shareFile(zipUri, "application/zip", "Save all-platform export");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExportState({ kind: "idle" });
      setPendingExport(null);
    }
  }

  function handleFeedback(rating: FeedbackRating) {
    setFeedbackByPlatform((prev) => ({ ...prev, [platform]: rating }));
    // Best-effort telemetry: a failed submit shouldn't interrupt the user or
    // block the export flow, so it's swallowed rather than surfaced via the
    // shared `error` banner used for export failures.
    submitDraftFeedback("viziphy", "carousel", platform, rating).catch(() => {});
  }

  const isExporting = exportState.kind !== "idle";

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.platformScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.platformRow}
      >
        {PLATFORM_KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => setPlatform(key)}
            style={[styles.chip, platform === key && styles.chipActive]}
          >
            <Text style={[styles.chipText, platform === key && styles.chipTextActive]}>
              {PLATFORM_LABELS[key]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <CarouselPreview
        draft={draft}
        platform={platform}
        onSlideRef={handleSlideRef}
        onActiveIndexChange={setActiveIndex}
        showWatermark={!isPro}
        fontFamily={activeFontFamily}
      />

      <View style={styles.feedbackRow}>
        <Text style={styles.feedbackLabel}>
          How's this draft for {PLATFORM_LABELS[platform]}?
        </Text>
        <View style={styles.feedbackButtons}>
          <Pressable
            onPress={() => handleFeedback("up")}
            style={[
              styles.feedbackButton,
              feedbackByPlatform[platform] === "up" && styles.feedbackButtonActive,
            ]}
          >
            <Text style={styles.feedbackButtonText}>👍</Text>
          </Pressable>
          <Pressable
            onPress={() => handleFeedback("down")}
            style={[
              styles.feedbackButton,
              feedbackByPlatform[platform] === "down" && styles.feedbackButtonActive,
            ]}
          >
            <Text style={styles.feedbackButtonText}>👎</Text>
          </Pressable>
        </View>
      </View>

      {pendingExport ? (
        <HiResExporter
          draft={draft}
          platforms={pendingExport.platforms}
          targetWidth={pendingExport.targetWidth}
          fontFamily={activeFontFamily}
          showWatermark={!isPro}
          onReady={(getRef) => pendingResolveRef.current?.(getRef)}
        />
      ) : null}

      <ScrollView
        style={styles.fontScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fontRow}
      >
        <Pressable
          onPress={() => isPro && selectBrandFont(undefined)}
          disabled={!isPro}
          style={[styles.fontChip, !brandFont && styles.fontChipActive]}
        >
          <Text style={[styles.fontChipText, !brandFont && styles.fontChipTextActive]}>Default</Text>
        </Pressable>
        {BRAND_FONT_KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => isPro && selectBrandFont(key)}
            disabled={!isPro}
            style={[styles.fontChip, brandFont === key && styles.fontChipActive]}
          >
            <Text style={[styles.fontChipText, brandFont === key && styles.fontChipTextActive]}>
              {BRAND_FONTS[key].label}
            </Text>
          </Pressable>
        ))}
        {!isPro ? (
          <Pressable onPress={() => router.push("/upgrade")} style={styles.fontLockedHint}>
            <Text style={styles.fontLockedHintText}>Brand fonts are a Pro perk — Upgrade</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.button, isExporting && styles.buttonDisabled]}
            onPress={handleExportPng}
            disabled={isExporting}
          >
            {exportState.kind === "png" ? (
              <ActivityIndicator color={carouselColors.background} />
            ) : (
              <Text style={styles.buttonText}>Export PNG</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.button, isExporting && styles.buttonDisabled]}
            onPress={handleExportPdf}
            disabled={isExporting}
          >
            {exportState.kind === "pdf" ? (
              <ActivityIndicator color={carouselColors.background} />
            ) : (
              <Text style={styles.buttonText}>{isPro ? "Export PDF (Hi-res)" : "Export PDF"}</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          style={[styles.buttonSecondary, isExporting && styles.buttonDisabled]}
          onPress={handleExportBatch}
          disabled={isExporting}
        >
          {exportState.kind === "batch" ? (
            <ActivityIndicator color={carouselColors.text} />
          ) : (
            <Text style={styles.buttonSecondaryText}>Export All Platforms (.zip)</Text>
          )}
        </Pressable>
      </View>

      <Pressable onPress={() => router.replace("/")} style={styles.backLink}>
        <Text style={styles.backLinkText}>Start over</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: carouselColors.background,
    paddingTop: 24,
    paddingBottom: 16,
  },
  platformScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  platformRow: {
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: carouselColors.surface,
  },
  chipActive: {
    backgroundColor: carouselColors.accent,
  },
  chipText: {
    fontSize: carouselTypeScale.caption,
    fontWeight: "600",
    color: carouselColors.textMuted,
  },
  chipTextActive: {
    color: carouselColors.background,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginHorizontal: 24,
  },
  feedbackLabel: {
    flex: 1,
    fontSize: carouselTypeScale.caption,
    color: carouselColors.textMuted,
  },
  feedbackButtons: {
    flexDirection: "row",
    gap: 8,
  },
  feedbackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: carouselColors.surface,
  },
  feedbackButtonActive: {
    backgroundColor: carouselColors.accent,
  },
  feedbackButtonText: {
    fontSize: 18,
  },
  fontScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginTop: 12,
  },
  fontRow: {
    gap: 8,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  fontChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: carouselColors.surface,
  },
  fontChipActive: {
    backgroundColor: carouselColors.accent,
    borderColor: carouselColors.accent,
  },
  fontChipText: {
    fontSize: carouselTypeScale.caption,
    fontWeight: "600",
    color: carouselColors.textMuted,
  },
  fontChipTextActive: {
    color: carouselColors.background,
  },
  fontLockedHint: {
    paddingHorizontal: 4,
  },
  fontLockedHintText: {
    fontSize: carouselTypeScale.caption,
    color: carouselColors.accent,
  },
  error: {
    color: carouselColors.statNegative,
    fontSize: carouselTypeScale.body,
    marginTop: 16,
    marginHorizontal: 24,
  },
  actions: {
    gap: 12,
    marginTop: 16,
    marginHorizontal: 24,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: carouselColors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: carouselColors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: carouselColors.background,
    fontSize: carouselTypeScale.body,
    fontWeight: "700",
  },
  buttonSecondaryText: {
    color: carouselColors.text,
    fontSize: carouselTypeScale.body,
    fontWeight: "700",
  },
  backLink: {
    marginTop: 16,
    alignItems: "center",
  },
  backLinkText: {
    color: carouselColors.textMuted,
    fontSize: carouselTypeScale.body,
  },
});
