import * as FileSystem from "expo-file-system";
import JSZip from "jszip";
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
  const zip = new JSZip();

  for (const platform of platforms) {
    const refs = draft.slides.map((_, index) => getRef(platform, index));
    const pngUris = await captureSlidesSequentially(refs);
    const pdfUri = await buildCarouselPdf(pngUris, carouselPlatforms[platform].aspectRatio);
    const base64 = await FileSystem.readAsStringAsync(pdfUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    zip.file(`${PLATFORM_FILE_NAMES[platform]}.pdf`, base64, { base64: true });
  }

  // KNOWN BUG, unresolved as of Gate 6 (2026-08-11): the zip this produces
  // is corrupt — its central directory offset points past the real header
  // data (verified by hand: only the *last* entry's directory record was
  // ever findable near the recorded offset; 7-Zip and .NET's ZipFile both
  // refuse to open it, "Is not archive"). Confirmed via direct testing that
  // this is NOT a read/write-mechanism issue: it reproduces identically
  // across every combination of base64-string vs raw-Uint8Array on both the
  // per-PDF input side (zip.file(..., {base64:true}) vs reading raw bytes)
  // and the final zip's output side (this writeAsStringAsync/base64 path vs
  // expo-file-system/next's File.write(Uint8Array)) — so the corruption
  // happens inside zip.generateAsync() itself, not in how bytes get in or
  // out. jszip encodes zip metadata (headers, offsets, CRCs) as "binary
  // strings" (one JS string character = one byte, via String.fromCharCode)
  // internally; the leading hypothesis is that something in this RN/Hermes
  // runtime treats one of those binary strings as UTF-8 somewhere in
  // jszip's worker pipeline, which would inflate byte counts exactly where
  // offsets subsequently drift. Not confirmed further — doing so would mean
  // instrumenting jszip's internals directly. A real fix likely means
  // patching or replacing jszip (e.g. a native zip module) rather than
  // anything on this call site; single-platform PDF export (buildCarouselPdf
  // above) doesn't go through jszip at all and is unaffected.
  const zipBase64 = await zip.generateAsync({ type: "base64" });
  const zipUri = `${FileSystem.cacheDirectory}viziphy-carousel-export-${Date.now()}.zip`;
  await FileSystem.writeAsStringAsync(zipUri, zipBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return zipUri;
}
