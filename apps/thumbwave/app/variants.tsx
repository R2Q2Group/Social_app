import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { thumbnailAppColors, thumbnailAppTypeScale } from "@r2q2/design-tokens";
import { ThumbnailCard } from "../src/render/ThumbnailCard";
import { pickFaceCutoutPhoto } from "../src/facecutout/pickPhoto";
import { captureThumbnailPng } from "../src/export/capture";
import { shareFile } from "../src/export/share";
import { useDraft } from "../src/state/draftStore";

type ExportState = { kind: "idle" } | { kind: "png" };

const SIDE_PADDING = 24;

export default function Variants() {
  const router = useRouter();
  const { draft } = useDraft();
  const { width: windowWidth } = useWindowDimensions();
  const [cardRef, setCardRef] = useState<View | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [exportState, setExportState] = useState<ExportState>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft) {
      router.replace("/");
    }
  }, [draft, router]);

  if (!draft) {
    return null;
  }

  const cardWidth = windowWidth - SIDE_PADDING * 2;

  async function handlePickPhoto() {
    setError(null);
    try {
      const uri = await pickFaceCutoutPhoto();
      if (uri) setPhotoUri(uri);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't open your photos.");
    }
  }

  async function handleExportPng() {
    if (!cardRef) return;
    setError(null);
    setExportState({ kind: "png" });
    try {
      const pngUri = await captureThumbnailPng(cardRef);
      await shareFile(pngUri, "image/png", "Save thumbnail as PNG");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExportState({ kind: "idle" });
    }
  }

  const isExporting = exportState.kind !== "idle";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Variant {activeIndex + 1} of {draft.variants.length}
      </Text>

      <View style={styles.chipRow}>
        {draft.variants.map((_, index) => (
          <Pressable
            key={index}
            onPress={() => setActiveIndex(index)}
            style={[styles.chip, activeIndex === index && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                activeIndex === index && styles.chipTextActive,
              ]}
            >
              {index + 1}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.cardWrap}>
        <ThumbnailCard
          key={activeIndex}
          ref={setCardRef}
          variant={draft.variants[activeIndex]}
          width={cardWidth}
          photoUri={photoUri}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={handlePickPhoto}>
          <Text style={styles.secondaryButtonText}>
            {photoUri ? "Change face cutout" : "Add face cutout"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, isExporting && styles.buttonDisabled]}
          onPress={handleExportPng}
          disabled={isExporting}
        >
          {exportState.kind === "png" ? (
            <ActivityIndicator color={thumbnailAppColors.background} />
          ) : (
            <Text style={styles.buttonText}>Export PNG</Text>
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
    backgroundColor: thumbnailAppColors.background,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: thumbnailAppTypeScale.body,
    fontWeight: "600",
    color: thumbnailAppColors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: thumbnailAppColors.surface,
  },
  chipActive: {
    backgroundColor: thumbnailAppColors.accent,
  },
  chipText: {
    fontSize: thumbnailAppTypeScale.body,
    fontWeight: "700",
    color: thumbnailAppColors.textMuted,
  },
  chipTextActive: {
    color: thumbnailAppColors.background,
  },
  cardWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: thumbnailAppColors.statNegative,
    fontSize: thumbnailAppTypeScale.body,
    marginTop: 16,
    marginHorizontal: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginHorizontal: 24,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: thumbnailAppColors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: thumbnailAppColors.text,
    fontSize: thumbnailAppTypeScale.body,
    fontWeight: "600",
  },
  button: {
    flex: 1,
    backgroundColor: thumbnailAppColors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: thumbnailAppColors.background,
    fontSize: thumbnailAppTypeScale.body,
    fontWeight: "700",
  },
  backLink: {
    marginTop: 16,
    alignItems: "center",
  },
  backLinkText: {
    color: thumbnailAppColors.textMuted,
    fontSize: thumbnailAppTypeScale.body,
  },
});
