import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  carouselColors,
  carouselPlatforms,
  carouselTypeScale,
  type CarouselPlatformKey,
} from "@r2q2/design-tokens";
import { CarouselPreview } from "../src/render/CarouselPreview";
import { captureSlidePng } from "../src/export/capture";
import { buildCarouselPdf } from "../src/export/pdf";
import { shareFile } from "../src/export/share";
import { useDraft } from "../src/state/draftStore";

type ExportState = { kind: "idle" } | { kind: "png" } | { kind: "pdf" };

const PLATFORM_LABELS: Record<CarouselPlatformKey, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  xThreads: "X",
  tiktokReelsCover: "TikTok/Reels",
  pinterest: "Pinterest",
  facebook: "Facebook",
};

const PLATFORM_KEYS = Object.keys(carouselPlatforms) as CarouselPlatformKey[];

export default function Preview() {
  const router = useRouter();
  const { draft } = useDraft();
  const slideRefs = useRef<(View | null)[]>([]);
  const [platform, setPlatform] = useState<CarouselPlatformKey>("linkedin");
  const [activeIndex, setActiveIndex] = useState(0);
  const [exportState, setExportState] = useState<ExportState>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft) {
      router.replace("/");
    }
  }, [draft, router]);

  const handleSlideRef = useCallback((index: number, ref: View | null) => {
    slideRefs.current[index] = ref;
  }, []);

  if (!draft) {
    return null;
  }

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
      const pngUris: string[] = [];
      for (let i = 0; i < draft!.slides.length; i++) {
        const ref = slideRefs.current[i];
        if (!ref) {
          throw new Error(`Slide ${i + 1} isn't rendered yet — try again.`);
        }
        pngUris.push(await captureSlidePng(ref));
      }
      const pdfUri = await buildCarouselPdf(pngUris, carouselPlatforms[platform].aspectRatio);
      await shareFile(pdfUri, "application/pdf", "Save carousel as PDF");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExportState({ kind: "idle" });
    }
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
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
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
            <Text style={styles.buttonText}>Export PDF</Text>
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
  error: {
    color: carouselColors.statNegative,
    fontSize: carouselTypeScale.body,
    marginTop: 16,
    marginHorizontal: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginHorizontal: 24,
  },
  button: {
    flex: 1,
    backgroundColor: carouselColors.accent,
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
  backLink: {
    marginTop: 16,
    alignItems: "center",
  },
  backLinkText: {
    color: carouselColors.textMuted,
    fontSize: carouselTypeScale.body,
  },
});
