import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { carouselColors, carouselTypeScale } from "@r2q2/design-tokens";
import { cancelPro, getEntitlement, purchasePro, type Entitlement } from "@r2q2/account-client";

const FREE_PERKS = [
  "3 AI generations / day",
  "Watermarked exports",
  "Batch export all platforms as one .zip",
];
const PRO_PERKS = [
  "Unlimited AI generations",
  "No watermark on exports",
  "Hi-res PDF export (incl. batch)",
  "Custom brand fonts",
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

      <Text style={styles.title}>Viziphy Pro</Text>
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
          <ActivityIndicator color={carouselColors.background} />
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
    backgroundColor: carouselColors.background,
    padding: 24,
    paddingTop: 64,
  },
  backLink: {
    position: "absolute",
    top: 24,
    left: 24,
  },
  backLinkText: {
    color: carouselColors.textMuted,
    fontSize: carouselTypeScale.body,
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
    marginBottom: 24,
  },
  planRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    flex: 1,
    backgroundColor: carouselColors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  planCardPro: {
    borderWidth: 1,
    borderColor: carouselColors.accent,
  },
  planName: {
    fontSize: carouselTypeScale.body,
    fontWeight: "700",
    color: carouselColors.text,
    marginBottom: 4,
  },
  perk: {
    fontSize: carouselTypeScale.caption,
    color: carouselColors.textMuted,
  },
  button: {
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
  message: {
    color: carouselColors.statPositive,
    fontSize: carouselTypeScale.body,
    marginTop: 16,
  },
  error: {
    color: carouselColors.statNegative,
    fontSize: carouselTypeScale.body,
    marginTop: 16,
  },
});
