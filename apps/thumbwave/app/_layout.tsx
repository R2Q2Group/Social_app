import { Stack } from "expo-router";
import { DraftProvider } from "../src/state/draftStore";

export default function RootLayout() {
  return (
    <DraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </DraftProvider>
  );
}
