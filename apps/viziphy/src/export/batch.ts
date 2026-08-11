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

  const zipBase64 = await zip.generateAsync({ type: "base64" });
  const zipUri = `${FileSystem.cacheDirectory}viziphy-carousel-export-${Date.now()}.zip`;
  await FileSystem.writeAsStringAsync(zipUri, zipBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return zipUri;
}
