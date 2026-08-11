import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { carouselColors, carouselTypeScale } from "@r2q2/design-tokens";
import { FreeTierLimitError, requestCarouselDraft } from "../src/lib/draftClient";
import { useDraft } from "../src/state/draftStore";

export default function Home() {
  const router = useRouter();
  const { idea, setIdea, setDraft } = useDraft();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = idea.trim().length > 0 && !isLoading;

  async function handleGenerate() {
    setError(null);
    setIsLoading(true);
    try {
      const { draft } = await requestCarouselDraft(idea.trim());
      setDraft(draft);
      router.push("/preview");
    } catch (err) {
      if (err instanceof FreeTierLimitError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Viziphy</Text>
      <Text style={styles.subtitle}>
        Turn an idea into a carousel for LinkedIn, Instagram, X, TikTok,
        Pinterest, or Facebook.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="What's your idea?"
        placeholderTextColor={carouselColors.textMuted}
        value={idea}
        onChangeText={setIdea}
        multiline
        editable={!isLoading}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, !canGenerate && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={!canGenerate}
      >
        {isLoading ? (
          <ActivityIndicator color={carouselColors.background} />
        ) : (
          <Text style={styles.buttonText}>Generate carousel</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: carouselColors.background,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: carouselTypeScale.hook,
    fontWeight: "700",
    color: carouselColors.text,
  },
  subtitle: {
    fontSize: carouselTypeScale.subtitle,
    color: carouselColors.textMuted,
    marginTop: 8,
    marginBottom: 32,
  },
  input: {
    minHeight: 120,
    borderRadius: 12,
    backgroundColor: carouselColors.surface,
    color: carouselColors.text,
    fontSize: carouselTypeScale.body,
    padding: 16,
    textAlignVertical: "top",
  },
  error: {
    color: carouselColors.statNegative,
    fontSize: carouselTypeScale.body,
    marginTop: 16,
  },
  button: {
    marginTop: 24,
    backgroundColor: carouselColors.accent,
    borderRadius: 12,
    paddingVertical: 16,
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
});
