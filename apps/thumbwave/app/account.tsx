import { useCallback, useState } from "react";
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
import { useFocusEffect, useRouter } from "expo-router";
import { thumbnailAppColors, thumbnailAppTypeScale } from "@r2q2/design-tokens";
import {
  AlreadySignedInError,
  deleteByokKey,
  getAccountState,
  getEntitlement,
  getUsageToday,
  listByokKeys,
  setByokKey,
  signInWithEmail,
  signOut,
  upgradeAnonymousAccount,
  type AccountState,
  type ByokKeyStatus,
  type Entitlement,
  type UsageToday,
} from "@r2q2/account-client";

type Mode = "signUp" | "signIn";

// Gate 4/ai-core only wires up an Anthropic client path today — rendering an
// OpenAI row here would be a dead control with no backend path to hit.
const BYOK_PROVIDER = "anthropic" as const;

export default function Account() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountState | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [byokStatus, setByokStatus] = useState<ByokKeyStatus | null>(null);
  const [usage, setUsage] = useState<UsageToday | null>(null);
  const [mode, setMode] = useState<Mode>("signUp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [byokInput, setByokInput] = useState("");
  const [byokBusy, setByokBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [accountState, entitlementState, byokKeys] = await Promise.all([
        getAccountState(),
        getEntitlement(),
        listByokKeys(),
      ]);
      setAccount(accountState);
      setEntitlement(entitlementState);
      const anthropicStatus =
        byokKeys.find((k) => k.provider === BYOK_PROVIDER) ?? null;
      setByokStatus(anthropicStatus);

      // Usage only matters for a free-tier caller with no BYOK key — Pro
      // and BYOK both bypass the cap in draft/index.ts, so "X / 3" would be
      // misleading for them.
      if (entitlementState.tier === "pro" || anthropicStatus?.hasKey) {
        setUsage(null);
      } else {
        setUsage(await getUsageToday());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function handleSubmit() {
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      if (mode === "signUp") {
        await upgradeAnonymousAccount(email.trim(), password);
        setMessage("Account created — this device is now signed in.");
      } else {
        await signInWithEmail(email.trim(), password);
        setMessage("Signed in.");
      }
      setPassword("");
      await refresh();
    } catch (err) {
      if (err instanceof AlreadySignedInError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      await signOut();
      setEmail("");
      setPassword("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveByokKey() {
    setError(null);
    setMessage(null);
    setByokBusy(true);
    try {
      await setByokKey(BYOK_PROVIDER, byokInput.trim());
      setByokInput("");
      setMessage("API key saved.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save key.");
    } finally {
      setByokBusy(false);
    }
  }

  async function handleRemoveByokKey() {
    setError(null);
    setMessage(null);
    setByokBusy(true);
    try {
      await deleteByokKey(BYOK_PROVIDER);
      setMessage("API key removed.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove key.");
    } finally {
      setByokBusy(false);
    }
  }

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !isLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backLinkText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Account</Text>

      {account ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusLine}>
            {account.isAnonymous
              ? "This device: anonymous session"
              : `Signed in as ${account.email}`}
          </Text>
          {entitlement ? (
            <Text style={styles.statusLine}>
              Plan: {entitlement.tier} ({entitlement.status})
            </Text>
          ) : null}
          {entitlement?.tier === "pro" || byokStatus?.hasKey ? (
            <Text style={styles.statusLine}>
              Generations: unlimited {entitlement?.tier === "pro" ? "(Pro)" : "(BYOK)"}
            </Text>
          ) : usage ? (
            <Text style={styles.statusLine}>
              Generations: {usage.requestCount} / {usage.dailyLimit} used today
            </Text>
          ) : null}
          <Pressable onPress={() => router.push("/upgrade")}>
            <Text style={styles.link}>
              {entitlement?.tier === "pro" ? "Manage plan" : "View plans"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.statusBox}>
        <Text style={styles.sectionTitle}>Your API key (BYOK)</Text>
        <Text style={styles.hint}>
          {byokStatus?.hasKey
            ? "Anthropic key saved — unlimited generations, billed to your own account."
            : "Add your own Anthropic key for unlimited generations at no cost to us."}
        </Text>
        {byokStatus?.hasKey ? (
          <Pressable
            style={[styles.secondaryButton, byokBusy && styles.buttonDisabled]}
            onPress={handleRemoveByokKey}
            disabled={byokBusy}
          >
            <Text style={styles.secondaryButtonText}>Remove key</Text>
          </Pressable>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="sk-ant-..."
              placeholderTextColor={thumbnailAppColors.textMuted}
              value={byokInput}
              onChangeText={setByokInput}
              autoCapitalize="none"
              secureTextEntry
              editable={!byokBusy}
            />
            <Pressable
              style={[
                styles.secondaryButton,
                (byokBusy || byokInput.trim().length === 0) && styles.buttonDisabled,
              ]}
              onPress={handleSaveByokKey}
              disabled={byokBusy || byokInput.trim().length === 0}
            >
              {byokBusy ? (
                <ActivityIndicator color={thumbnailAppColors.text} />
              ) : (
                <Text style={styles.secondaryButtonText}>Save key</Text>
              )}
            </Pressable>
          </>
        )}
      </View>

      {account && !account.isAnonymous ? (
        <Pressable
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSignOut}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Sign out</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeChip, mode === "signUp" && styles.modeChipActive]}
              onPress={() => setMode("signUp")}
            >
              <Text
                style={[
                  styles.modeChipText,
                  mode === "signUp" && styles.modeChipTextActive,
                ]}
              >
                Sign up
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeChip, mode === "signIn" && styles.modeChipActive]}
              onPress={() => setMode("signIn")}
            >
              <Text
                style={[
                  styles.modeChipText,
                  mode === "signIn" && styles.modeChipTextActive,
                ]}
              >
                Sign in
              </Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={thumbnailAppColors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            placeholderTextColor={thumbnailAppColors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isLoading ? (
              <ActivityIndicator color={thumbnailAppColors.background} />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "signUp" ? "Create account" : "Sign in"}
              </Text>
            )}
          </Pressable>
        </>
      )}

      {message ? <Text style={styles.message}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
    marginBottom: 24,
  },
  statusBox: {
    backgroundColor: thumbnailAppColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  },
  statusLine: {
    color: thumbnailAppColors.text,
    fontSize: thumbnailAppTypeScale.body,
  },
  link: {
    color: thumbnailAppColors.accent,
    fontSize: thumbnailAppTypeScale.body,
    fontWeight: "600",
    marginTop: 8,
  },
  sectionTitle: {
    color: thumbnailAppColors.text,
    fontSize: thumbnailAppTypeScale.body,
    fontWeight: "700",
    marginBottom: 4,
  },
  hint: {
    color: thumbnailAppColors.textMuted,
    fontSize: thumbnailAppTypeScale.caption,
    marginBottom: 12,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: thumbnailAppColors.surface,
  },
  modeChipActive: {
    backgroundColor: thumbnailAppColors.accent,
  },
  modeChipText: {
    fontSize: thumbnailAppTypeScale.caption,
    fontWeight: "600",
    color: thumbnailAppColors.textMuted,
  },
  modeChipTextActive: {
    color: thumbnailAppColors.background,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: thumbnailAppColors.background,
    color: thumbnailAppColors.text,
    fontSize: thumbnailAppTypeScale.body,
    padding: 16,
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
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
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: thumbnailAppColors.background,
  },
  secondaryButtonText: {
    color: thumbnailAppColors.text,
    fontSize: thumbnailAppTypeScale.body,
    fontWeight: "600",
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
