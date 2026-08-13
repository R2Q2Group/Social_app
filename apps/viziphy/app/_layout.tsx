import { View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { carouselColors } from "@r2q2/design-tokens";
import { DraftProvider } from "../src/state/draftStore";
import { useBrandFonts } from "../src/fonts";

export default function RootLayout() {
  const brandFontsLoaded = useBrandFonts();

  if (!brandFontsLoaded) {
    // Small/fast font files (a handful of static-weight .ttfs) — a brief
    // plain background beats rendering the app once in the system font and
    // again once brand fonts resolve.
    return <View style={{ flex: 1, backgroundColor: carouselColors.background }} />;
  }

  // Android 16 (targetSdk 36, from the SDK 54 upgrade) enforces edge-to-edge
  // with no opt-out, so the system bars now overlap the app instead of
  // reserving space. Every screen here runs `headerShown: false`, so nothing
  // else was consuming those insets — without this the fixed `paddingTop: 24`
  // the screens use would sit underneath the status bar. Applied once at the
  // root rather than per screen so all four screens stay consistent, and the
  // screens' own padding stacks on top of the inset.
  return (
    <SafeAreaProvider>
      <DraftProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: carouselColors.background }}>
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
      </DraftProvider>
    </SafeAreaProvider>
  );
}
