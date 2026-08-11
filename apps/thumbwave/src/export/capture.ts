import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";

/** Rasterizes a mounted thumbnail View to a PNG tempfile, at whatever size
 * it's currently laid out on-screen. An explicit width/height override (to
 * target a fixed export resolution independent of on-screen size) was
 * tried first for Viziphy's carousel export, but reliably hung captureRef
 * under Fabric/new-architecture — it appears to force a relayout of the
 * source view that never resolves. Same fix here (apps/viziphy/src/export). */
export async function captureThumbnailPng(ref: View): Promise<string> {
  return withTimeout(
    captureRef(ref, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    }),
    15000,
    "Capturing the thumbnail timed out.",
  );
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
