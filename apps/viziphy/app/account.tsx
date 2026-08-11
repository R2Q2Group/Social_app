import { useCallback, useEffect, useState } from "react";
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
import { carouselColors, carouselTypeScale } from "@r2q2/design-tokens";
import {
  AlreadySignedInError,
  getAccountState,
  signInWithEmail,
  signOut,
  upgradeAnonymousAccount,
  type AccountState,
} from "../src/lib/auth";
import { getEntitlement, type Entitlement } from "../src/lib/entitlement";

type Mode = "signUp" | "signIn";

export default function Account() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountState | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [mode, setMode] = useState<Mode>("signUp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [accountState, entitlementState] = await Promise.all([
        getAccountState(),
        getEntitlement(),
      ]);
      setAccount(accountState);
      setEntitlement(entitlementState);
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
        </View>
      ) : null}

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
            placeholderTextColor={carouselColors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            placeholderTextColor={carouselColors.textMuted}
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
              <ActivityIndicator color={carouselColors.background} />
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
    backgroundColor: carouselColors.background,
    padding: 24,
    justifyContent: "center",
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
    marginBottom: 24,
  },
  statusBox: {
    backgroundColor: carouselColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 4,
  },
  statusLine: {
    color: carouselColors.text,
    fontSize: carouselTypeScale.body,
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
    backgroundColor: carouselColors.surface,
  },
  modeChipActive: {
    backgroundColor: carouselColors.accent,
  },
  modeChipText: {
    fontSize: carouselTypeScale.caption,
    fontWeight: "600",
    color: carouselColors.textMuted,
  },
  modeChipTextActive: {
    color: carouselColors.background,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: carouselColors.surface,
    color: carouselColors.text,
    fontSize: carouselTypeScale.body,
    padding: 16,
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
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
