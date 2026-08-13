import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { thumbnailAppColors } from "@r2q2/design-tokens";
import { DraftProvider } from "../src/state/draftStore";

export default function RootLayout() {
  // Android 16 (targetSdk 36, from the SDK 54 upgrade) enforces edge-to-edge
  // with no opt-out, so the system bars now overlap the app instead of
  // reserving space. Every screen here runs `headerShown: false`, so nothing
  // else was consuming those insets. Applied once at the root rather than per
  // screen, mirroring Viziphy's layout, so the screens' own padding stacks on
  // top of the inset.
  return (
    <SafeAreaProvider>
      <DraftProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: thumbnailAppColors.background }}>
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
      </DraftProvider>
    </SafeAreaProvider>
  );
}
