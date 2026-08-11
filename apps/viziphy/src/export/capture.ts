import { InteractionManager, type View } from "react-native";
import { captureRef } from "react-native-view-shot";

/** Rasterizes a mounted slide View to a PNG tempfile, at whatever size it's
 * currently laid out on-screen. An explicit width/height override (to
 * target a fixed export resolution independent of on-screen size) was
 * tried first, but reliably hung captureRef under Fabric/new-architecture
 * — it appears to force a relayout of the source view that never
 * resolves. */
export async function captureSlidePng(ref: View): Promise<string> {
  return withTimeout(
    captureRef(ref, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    }),
    15000,
    "Capturing the slide timed out.",
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

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** react-native-view-shot's Android capture runs the actual `view.draw()`
 * off the UI thread (on its own cached thread pool), racing against
 * whatever Fabric is doing on the UI thread at that moment — Gate 3 found
 * this can throw `AssertionException: Expected to run on UI thread!` and
 * hang the native promise when captures are fired back-to-back in a loop.
 * Serializing calls (one `await` at a time, already the case for a plain
 * for-loop) isn't sufficient on its own since the race is inside the
 * library, not in our call ordering — so each capture here additionally:
 *   1. waits for any in-flight interactions/animations to finish and yields
 *      a frame first, giving Fabric's UI thread a quiet moment before the
 *      next native capture call is queued;
 *   2. retries once on failure, since the underlying race is inherently
 *      flaky rather than deterministic. */
export async function captureSlidesSequentially(refs: (View | null)[]): Promise<string[]> {
  const uris: string[] = [];
  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    if (!ref) {
      throw new Error(`Slide ${i + 1} isn't rendered yet — try again.`);
    }
    await new Promise<void>((resolve) => InteractionManager.runAfterInteractions(() => resolve()));
    await nextFrame();
    try {
      uris.push(await captureSlidePng(ref));
    } catch {
      // One retry: the native race this works around is flaky, not
      // deterministic, so a second attempt after another quiet frame often
      // succeeds where the first didn't.
      await nextFrame();
      uris.push(await captureSlidePng(ref));
    }
  }
  return uris;
}
