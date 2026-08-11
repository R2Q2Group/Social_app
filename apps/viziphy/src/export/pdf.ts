import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { parseAspectRatio } from "../render/aspectRatio";

// expo-print defaults to US Letter/A4 — pin explicit page dimensions (in
// points, 72/in) matching the platform's aspect ratio, or pages come out
// letterboxed.
const PAGE_WIDTH_PT = 540;

async function toDataUri(pngUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(pngUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/png;base64,${base64}`;
}

/** Combines per-slide PNGs into one multi-page PDF, one page per slide,
 * pages sized to the given platform's aspect ratio (e.g. "4:5"). */
export async function buildCarouselPdf(
  pngUris: string[],
  aspectRatio: string,
): Promise<string> {
  const ratio = parseAspectRatio(aspectRatio);
  const PAGE_HEIGHT_PT = Math.round(PAGE_WIDTH_PT / ratio);
  const dataUris = await Promise.all(pngUris.map(toDataUri));
  const pages = dataUris
    .map((uri, i) => {
      const breakStyle =
        i < dataUris.length - 1 ? ' style="page-break-after: always;"' : "";
      return `<div class="page"${breakStyle}><img src="${uri}" /></div>`;
    })
    .join("");

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: ${PAGE_WIDTH_PT}pt ${PAGE_HEIGHT_PT}pt; margin: 0; }
          body { margin: 0; }
          .page { width: ${PAGE_WIDTH_PT}pt; height: ${PAGE_HEIGHT_PT}pt; }
          img { width: 100%; height: 100%; object-fit: cover; display: block; }
        </style>
      </head>
      <body>${pages}</body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({
    html,
    width: PAGE_WIDTH_PT,
    height: PAGE_HEIGHT_PT,
    base64: false,
  });
  return uri;
}
