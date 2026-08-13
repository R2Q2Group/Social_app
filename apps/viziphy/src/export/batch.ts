// expo-file-system 19 (SDK 54) replaced the classic API with the new
// File/Directory one; the classic calls used here live on under /legacy.
import * as FileSystem from "expo-file-system/legacy";
import { zipSync, type Zippable } from "fflate";
import { toByteArray, fromByteArray } from "base64-js";
import { carouselPlatforms, type CarouselPlatformKey } from "@r2q2/design-tokens";
import type { CarouselDraft } from "@r2q2/ai-core";
import { captureSlidesSequentially } from "./capture";
import { buildCarouselPdf } from "./pdf";
import type { SlideRefGetter } from "./HiResExporter";

const PLATFORM_FILE_NAMES: Record<CarouselPlatformKey, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  xThreads: "X",
  tiktokReelsCover: "TikTok-Reels",
  pinterest: "Pinterest",
  facebook: "Facebook",
};

/** Builds one multi-page PDF per platform (via the existing buildCarouselPdf,
 * same as a single-platform PDF export) and zips them into a single archive
 * — "batch export (all platforms from one draft in one action)" per RDD
 * Gate 6. Callers must supply refs to already-mounted, already-laid-out
 * slide views for every (platform, index) pair (see HiResExporter) —
 * capturing all 6 platforms straight off the on-screen preview isn't
 * possible since only one platform is visible at a time. */
export async function buildBatchExportZip(
  draft: CarouselDraft,
  platforms: CarouselPlatformKey[],
  getRef: SlideRefGetter,
): Promise<string> {
  const files: Zippable = {};

  for (const platform of platforms) {
    const refs = draft.slides.map((_, index) => getRef(platform, index));
    const pngUris = await captureSlidesSequentially(refs);
    const pdfUri = await buildCarouselPdf(pngUris, carouselPlatforms[platform].aspectRatio);
    const base64 = await FileSystem.readAsStringAsync(pdfUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    files[`${PLATFORM_FILE_NAMES[platform]}.pdf`] = toByteArray(base64);
  }

  // Switched from jszip to fflate (Gate 6, 2026-08-11): jszip produced a
  // reliably corrupt zip on-device — its central directory offset pointed
  // at zero bytes, reproducing identically across every read/write encoding
  // combination tried (base64-string vs raw-Uint8Array, on both the per-PDF
  // input side and the final zip's output side), which isolated the fault
  // inside jszip's own generateAsync(). Leading hypothesis: jszip encodes
  // zip metadata internally as "binary strings" (one JS string char = one
  // byte via String.fromCharCode) and something in this RN/Hermes runtime
  // treats one of those as UTF-8 somewhere in its pipeline, inflating byte
  // counts and drifting the recorded offsets. fflate's zipSync operates on
  // real Uint8Arrays throughout with no binary-string intermediate, so it
  // sidesteps that failure mode entirely rather than working around it.
  const zipBytes = zipSync(files);
  const zipUri = `${FileSystem.cacheDirectory}viziphy-carousel-export-${Date.now()}.zip`;
  await FileSystem.writeAsStringAsync(zipUri, fromByteArray(zipBytes), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return zipUri;
}
