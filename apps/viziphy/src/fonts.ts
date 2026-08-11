import {
  useFonts as usePoppins,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  useFonts as usePlayfairDisplay,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import type { TextStyle } from "react-native";

/** Gate 6: Pro-only brand font packs for carousel typography. Each pack maps
 * a weight role to a *distinct* static font family (Google Fonts ships each
 * weight as its own family, not a variable font), so callers should pick the
 * family via `fontFamilyFor` rather than pairing `fontFamily` with
 * `fontWeight` — the latter has no effect on a statically-weighted family
 * and previously risked a synthetic-bold render on top of an already-bold
 * glyph. */
export const BRAND_FONTS = {
  poppins: {
    label: "Modern Sans",
    regular: "Poppins_400Regular",
    medium: "Poppins_500Medium",
    bold: "Poppins_700Bold",
  },
  playfairDisplay: {
    label: "Editorial Serif",
    regular: "PlayfairDisplay_400Regular",
    medium: "PlayfairDisplay_700Bold",
    bold: "PlayfairDisplay_700Bold",
  },
  spaceGrotesk: {
    label: "Techy Grotesk",
    regular: "SpaceGrotesk_400Regular",
    medium: "SpaceGrotesk_500Medium",
    bold: "SpaceGrotesk_700Bold",
  },
} as const;

export type BrandFontKey = keyof typeof BRAND_FONTS;

export const BRAND_FONT_KEYS = Object.keys(BRAND_FONTS) as BrandFontKey[];

type FontWeightRole = "regular" | "medium" | "bold";

/** Resolves a brand font pack + weight role to the concrete font family name
 * to hand to a Text style's `fontFamily`, or `undefined` for the system
 * default (no brand font selected — the pre-Gate-6 look, driven by
 * `fontWeight` instead). */
export function fontFamilyFor(
  brandFont: BrandFontKey | undefined,
  role: FontWeightRole,
): string | undefined {
  if (!brandFont) return undefined;
  return BRAND_FONTS[brandFont][role];
}

/** Returns a TextStyle fragment for the given weight role: a brand
 * `fontFamily` (weight baked in, no separate `fontWeight`) when a brand font
 * is selected, otherwise the plain `fontWeight` this app used before brand
 * fonts existed. */
export function brandTextStyle(
  brandFont: BrandFontKey | undefined,
  role: FontWeightRole,
): TextStyle {
  const family = fontFamilyFor(brandFont, role);
  if (family) return { fontFamily: family };
  return { fontWeight: role === "bold" ? "700" : role === "medium" ? "600" : "400" };
}

/** Loads every brand font family up front (small static files, no lazy
 * per-selection loading needed) — call once near the app root. */
export function useBrandFonts(): boolean {
  const [poppinsLoaded] = usePoppins({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });
  const [playfairLoaded] = usePlayfairDisplay({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
  });
  const [spaceGroteskLoaded] = useSpaceGrotesk({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  return poppinsLoaded && playfairLoaded && spaceGroteskLoaded;
}
