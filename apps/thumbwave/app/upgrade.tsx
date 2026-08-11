import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { thumbnailAppColors, thumbnailAppTypeScale } from "@r2q2/design-tokens";
import { cancelPro, getEntitlement, purchasePro, type Entitlement } from "@r2q2/account-client";

const FREE_PERKS = ["3 AI generations / day", "Watermarked exports"];
const PRO_PERKS = [
  "Unlimited AI generations",
  "No watermark on exports",
  "Hi-res export (coming soon)",
  "Extra A/B variant packs (coming soon)",
];

export default function Upgrade() {
  const router = useRouter();
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setEntitlement(await getEntitlement());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your plan.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const isPro = entitlement?.tier === "pro";

  async function handleUpgrade() {
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      // Gate 5: real purchase is intended to go through Google Play
      // Billing / Apple StoreKit — purchasePro() is the seam for that,
      // currently backed by a dev-mock RPC. See account-client/src/billing.ts.
      setEntitlement(await purchasePro());
      setMessage("You're on Pro — unlimited generations, no watermark.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancel() {
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      setEntitlement(await cancelPro());
      setMessage("Back to the free plan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backLinkText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Thumbwave Pro</Text>
      <Text style={styles.subtitle}>
        {isPro ? "You're on Pro." : "Unlock unlimited generation and remove the watermark."}
      </Text>

      <View style={styles.planRow}>
        <View style={styles.planCard}>
          <Text style={styles.planName}>Free</Text>
          {FREE_PERKS.map((perk) => (
            <Text key={perk} style={styles.perk}>
              {perk}
            </Text>
          ))}
        </View>
        <View style={[styles.planCard, styles.planCardPro]}>
          <Text style={styles.planName}>Pro</Text>
          {PRO_PERKS.map((perk) => (
            <Text key={perk} style={styles.perk}>
              {perk}
            </Text>
          ))}
        </View>
      </View>

      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={isPro ? handleCancel : handleUpgrade}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={thumbnailAppColors.background} />
        ) : (
          <Text style={styles.buttonText}>
            {isPro ? "Cancel Pro" : "Upgrade to Pro"}
          </Text>
        )}
      </Pressable>

      {message ? <Text style={styles.message}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: thumbnailAppColors.background,
    padding: 24,
    paddingTop: 64,
  },
  backLink: {
    position: "absolute",
    top: 24,
    left: 24,
  },
  backLinkText: {
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
    marginBottom: 24,
  },
  planRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    flex: 1,
    backgroundColor: thumbnailAppColors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  planCardPro: {
    borderWidth: 1,
    borderColor: thumbnailAppColors.accent,
  },
  planName: {
    fontSize: thumbnailAppTypeScale.body,
    fontWeight: "700",
    color: thumbnailAppColors.text,
    marginBottom: 4,
  },
  perk: {
    fontSize: thumbnailAppTypeScale.caption,
    color: thumbnailAppColors.textMuted,
  },
  button: {
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
  message: {
    color: thumbnailAppColors.statPositive,
    fontSize: thumbnailAppTypeScale.body,
    marginTop: 16,
  },
  error: {
    color: thumbnailAppColors.statNegative,
    fontSize: thumbnailAppTypeScale.body,
    marginTop: 16,
  },
});
