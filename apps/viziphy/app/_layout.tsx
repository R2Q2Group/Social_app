import { View } from "react-native";
import { Stack } from "expo-router";
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

  return (
    <DraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </DraftProvider>
  );
}
