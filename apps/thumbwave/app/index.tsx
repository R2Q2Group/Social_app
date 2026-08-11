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
import { thumbnailAppColors, thumbnailAppTypeScale } from "@r2q2/design-tokens";
import { FreeTierLimitError, requestDraft } from "@r2q2/account-client";
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
      const { draft } = await requestDraft("thumbnail", idea.trim());
      setDraft(draft);
      router.push("/variants");
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
      <Pressable
        style={styles.accountLink}
        onPress={() => router.push("/account")}
      >
        <Text style={styles.accountLinkText}>Account</Text>
      </Pressable>

      <Text style={styles.title}>Thumbwave</Text>
      <Text style={styles.subtitle}>
        Turn a video idea or title into 2-3 exportable YouTube thumbnail
        variants.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="What's the video about?"
        placeholderTextColor={thumbnailAppColors.textMuted}
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
          <ActivityIndicator color={thumbnailAppColors.background} />
        ) : (
          <Text style={styles.buttonText}>Generate thumbnails</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: thumbnailAppColors.background,
    padding: 24,
    justifyContent: "center",
  },
  accountLink: {
    position: "absolute",
    top: 24,
    right: 24,
  },
  accountLinkText: {
    color: thumbnailAppColors.textMuted,
    fontSize: thumbnailAppTypeScale.body,
  },
  title: {
    fontSize: thumbnailAppTypeScale.hook,
    fontWeight: "700",
    color: thumbnailAppColors.text,
  },
  subtitle: {
    fontSize: thumbnailAppTypeScale.body,
    color: thumbnailAppColors.textMuted,
    marginTop: 8,
    marginBottom: 32,
  },
  input: {
    minHeight: 120,
    borderRadius: 12,
    backgroundColor: thumbnailAppColors.surface,
    color: thumbnailAppColors.text,
    fontSize: thumbnailAppTypeScale.body,
    padding: 16,
    textAlignVertical: "top",
  },
  error: {
    color: thumbnailAppColors.statNegative,
    fontSize: thumbnailAppTypeScale.body,
    marginTop: 16,
  },
  button: {
    marginTop: 24,
    backgroundColor: thumbnailAppColors.accent,
    borderRadius: 12,
    paddingVertical: 16,
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
});
