# Requirements & Design Document (RDD)
**Company:** R2Q2 Group
**Product family:** Viziphy (flagship) + standalone platform-specific spinoffs
**Repo:** https://github.com/R2Q2Group/Social_app
**Local path:** `D:\Social_Media_app`
**Status:** Pre-development / Planning

---

## 1. Product Summary

R2Q2 Group is building a family of apps that take a raw idea (typed note or voice
draft) and turn it into polished, platform-specific visual content, using AI for
structure/copy and native on-device vector rendering for visuals.

Rather than one app covering every platform, each platform-focus ships as its own
branded app, sharing a common backend:

1. **Viziphy** (flagship) — Carousel Engine: multi-slide posts for LinkedIn,
   Instagram, X, TikTok/Reels covers, Pinterest, Facebook.
2. **Thumbwave** (spinoff) — Thumbnail Engine: YouTube thumbnail generation
   (1280x720), distinct design language (faces, high contrast, arrows/callouts,
   A/B variants).
3. **Future spinoffs** — additional standalone apps as usage data justifies
   splitting a platform out of Viziphy into its own dedicated brand.

All apps under the family share: one AI drafting core, one backend, one BYOK
system, and one R2Q2 Group account layer. Each app has its own App Store listing,
design system, and marketing identity.

---

## 2. Brand Architecture

| Layer | Name | Role |
|---|---|---|
| Company | R2Q2 Group | Owns backend, AI core, billing, shared account system |
| Flagship app | **Viziphy** | Carousel engine — LinkedIn/Instagram/X/Pinterest/Facebook/TikTok covers |
| Spinoff app | **Thumbwave** | YouTube thumbnail engine — standalone app, "by R2Q2 Group" |
| Future | TBD | Split off from Viziphy only if usage data supports a dedicated app |

**Naming rule going forward:** flagship stays "Viziphy," every spinoff gets its own
standalone name (not a "Viziphy ___" suffix), tagged "by R2Q2 Group" in store listings.

Runner-up names retained in case a future spinoff needs one:
DraftToDeck, Slideframe, Carouselly, Pinspire (Pinterest-focused), Threadcraft
(X-focused).

---

## 3. AI Architecture

### 3.1 Text & Structure Model
- Claude Haiku 4.5 or GPT-4o-mini for drafting.
- Output: structured JSON per slide/thumbnail (title, subtitle, bullet points, hook,
  callout type, suggested emphasis words).
- Two distinct system prompts:
  - **Carousel prompt** — breaks long-form input into N slide objects with a narrative arc
    (hook → context → payoff → CTA).
  - **Thumbnail prompt** — extracts a single high-CTR claim/emotion and returns 2-3
    variant objects (text, focal concept, suggested callout shape).

### 3.2 Visual Rendering
- No AI image generation for standard slides/thumbnails — native vector rendering
  (React Native, on-device) using design-token-based layouts (typography, color,
  accent shapes).
- Optional AI image background: user-triggered only, via DALL-E 3 or Flux API,
  billed/limited separately from text generation.
- Face-cutout support for thumbnails: user uploads a photo, app auto-crops/outlines it
  as a layered vector asset.

### 3.3 Design Systems (two separate token sets)
- **Carousel tokens**: dark-mode default, minimal layout, per-platform aspect ratio
  and text-density rules (see Section 4).
- **Thumbnail tokens**: high-saturation, outlined bold text, max 2-3 colors, arrow/
  circle/emoji overlay library, preset "styles" (shock-face, minimalist tech-review,
  tutorial-arrow, etc.).

---

## 4. Platform Render Targets

| Platform | Aspect Ratio | Style Notes |
|---|---|---|
| LinkedIn Carousel | 4:5 / 1:1 | Professional, dark-mode, stat callouts |
| Instagram Carousel | 4:5 | More color, less text per slide |
| X Thread Cards | 16:9 / 1:1 | One punchy statement per slide |
| TikTok/Reels Cover | 9:16 | Bold single focal point |
| Pinterest Pin | 2:3 | Text-heavy top third, SEO title |
| Facebook Post | 1:1 / 1.91:1 | Low text density |
| YouTube Thumbnail | 16:9 (1280x720) | High contrast, 3-5 word max, face/arrow callouts, A/B variants |

---

## 5. Monetization

- **Free Tier**: 3 AI generations/day on backend key (Haiku/GPT-4o-mini — near-zero cost).
- **BYOK**: user enters personal Anthropic/OpenAI key in settings → unlimited drafting,
  zero cost to us.
- **Pro ($7-10/mo)**: unlimited generation, watermark removal, custom brand fonts,
  high-res PDF export, thumbnail A/B variant packs.

---

## 6. Gate Roadmap

Each gate has an explicit exit condition. Do not start a gate until the prior one's
exit condition is met — this keeps Claude Code sessions resumable without context loss.

**Status as of 2026-08-11 (night session):** Gates 0 through 6 are done,
including Gate 3.5 (pulled forward). **Gate 6's exit condition is now met** —
the prior session's one open item, batch export's corrupt `.zip`, is fixed
(jszip replaced with fflate) and device-verified; all six exit checklist
items now pass. **Gate 7 (Beta Launch) is in progress and blocked on the
user**: the feedback loop is built and verified, and a real local Android
build proves the release pipeline works, but TestFlight/Play Store internal
testing — and thus the gate's actual exit condition — needs Apple
Developer/Google Play Console account access and an `eas login` this
session has no credentials for. The app now runs on a **real Android
phone** against local Supabase over home WiFi (first non-emulator
verification), which took a four-part networking fix documented under
Gate 7. **The mid-word text bug carried in from the prior session is now
closed, and turned out to be two independent defects.** The truncation
one was already fixed — the phone was just still running an older APK;
installing the cache-busted build confirmed it on the real device.
Verifying that surfaced a genuinely separate one: headings were being
broken mid-word by *layout*, because every layout hard-coded its heading
font size with no relation to card width, which only shows up on
TikTok's narrow 9:16 card with a word of 8+ characters. Both are
documented with their verification evidence under Gate 7, along with a
user-reported fix for invisible carousel dots.

**Status as of 2026-08-12 (later session):** the two blockers called out
above — no production backend, no real Play Console submission — are both
closed. A hosted Supabase project (`r2q2-social-app`) is live and the app's
release builds point at it; a real signed `.aab` (upload-keystore signed,
`targetSdkVersion` 35, `versionCode` 2) is uploaded to a Google Play closed
testing release and **submitted, awaiting Google's publishing review**.
That review outcome is the new blocker — genuinely external now, not
engineering work. Full detail, including two real security findings (a
keystore password sitting in a plaintext file in the repo, and an
access token that ended up in a chat transcript) and three more release-
pipeline bugs found only by attempting a real submission, is under Gate 7
below. The user is finishing the remaining Play Console listing fields
(country availability, etc.) while the review runs.
Highlights, in the order they came up:

1. **The previous session's stuck build was exactly what it looked like —
   machine resource contention, not a broken build — but recovering from it
   surfaced a second trap.** Killing the runaway `adb`/`expo run:android`
   processes and confirming `adb devices` responded quickly (per the prior
   note) was sufficient to get `expo run:android` to build and install
   cleanly (`BUILD SUCCESSFUL in 3m 18s`). But the app then ANR'd
   (`failed to complete startup`) on every launch attempt, repeatedly, even
   after the host's other heavy processes were closed — because the
   *emulator itself* had a stuck `android.hardware.sensors-service.multihal`
   process burning 50-70% CPU continuously (visible via `adb shell top`,
   25+ minutes of accumulated CPU time), unrelated to anything on the host.
   A plain `adb emu kill` + relaunch of the *same* AVD didn't fix it either
   — Android Studio's emulator defaults to quick-boot, so killing and
   relaunching **restored the exact same stuck-process snapshot** instead of
   cold-booting (confirmed by `kswapd0`/`sensors-service` already showing
   10+ minutes of CPU time seconds after the "fresh" instance reported
   booted). The fix: launch with `-no-snapshot-load` for a genuine cold
   boot. Worth remembering for any future session that hits ANRs a restart
   doesn't fix — check whether the restart actually cold-booted.
2. **`HiResExporter.tsx` had a real ref-collection race** that made *every*
   off-screen capture (hi-res PDF export, and batch export's per-platform
   captures) fail with "Slide 1 isn't rendered yet" on the very first
   attempt post-rebuild. Root-caused via targeted `console.log` +
   `adb logcat`, not guesswork: a `useEffect` reset `refs.current = new
   Map()` on every mount (including the initial one, since effects always
   fire once after first render) — that passive effect ran a couple
   milliseconds *after* `onReady` had already fired and handed the `getRef`
   closure to the caller, wiping every just-collected ref before
   `captureSlidesSequentially` could read them. Fixed by deleting the
   effect entirely — `HiResExporter` fully unmounts and remounts fresh on
   every export call already (`{pendingExport ? <HiResExporter/> : null}`),
   so `useRef(new Map())`'s own fresh instance per mount was always
   sufficient; the effect was redundant *and* actively harmful. Confirmed
   fixed: hi-res PDF export, free-tier PDF export, and (with more RAM, see
   below) batch export all subsequently produced real output.
3. **Pro hi-res export is genuinely 2x, precisely** — pulled both a
   free-tier and a Pro-tier PDF off the device and diffed their embedded
   image dimensions directly: 1890×2363 vs. 3780×4725. Exactly 2.0x in both
   axes, matching `HI_RES_EXPORT_WIDTH`/`STANDARD_EXPORT_WIDTH`.
4. **Batch export's off-screen hi-res captures can exhaust a low-RAM
   emulator.** Running batch export at Pro/hi-res (6 platforms × 7 slides ×
   1440px, all mounted off-screen simultaneously via `HiResExporter`) on the
   AVD's default 2GB RAM drove the whole guest OS into severe swap
   thrashing — `kswapd0` pegged at 100%+ CPU, swap 100% full, `MemAvailable`
   reported as 0kB, binder transactions taking 24-34 *seconds*, `adbd`
   itself timing out — with no forward progress after 4+ minutes. This
   wasn't the app hanging; the entire system was starved. Relaunching the
   emulator with `-memory 4096` resolved it completely (batch export then
   completed in ~90s with `MemAvailable` staying above 1GB throughout). Real
   Android devices typically ship well above 2GB RAM, so this is likely a
   low-end-emulator artifact rather than a real-device risk, but it's worth
   a real low-RAM-device pass before shipping batch export, since mounting
   all 6 platforms' hi-res slides at once is a genuinely heavy approach.
5. **Batch export's `.zip` output was corrupt — root-caused to jszip,
   fixed by replacing it.** Once the ref-race (bug #2) and the memory
   ceiling (bug #4) were both out of the way, the prior session diagnosed
   the corruption as internal to `jszip`'s own `generateAsync()` (see the
   Gate 5 session's notes, preserved in git history) — its "binary string"
   internal encoding (one JS string char = one byte) was the leading
   hypothesis for why it corrupted specifically under RN/Hermes despite
   working in jszip's own browser/Node test environments. This session
   swapped it for `fflate` (`zipSync`, real `Uint8Array` throughout, no
   binary-string intermediate) plus `base64-js` for the RN-side base64
   conversion `expo-file-system`'s classic API requires — same call site in
   `apps/viziphy/src/export/batch.ts`, no changes needed elsewhere.
   **Confirmed fixed (2026-08-11, night session):** ran a live Pro-tier
   6-platform hi-res batch export on-device, pulled the resulting `.zip` off
   the emulator, and verified it with both tools that rejected the jszip
   output — 7-Zip's `7z t` reports "Everything is Ok" (6 files, correct
   compressed/uncompressed sizes) and .NET's `ZipFile.OpenRead` opens it and
   enumerates all 6 entries cleanly. Extracted all 6 PDFs and confirmed each
   has a valid `%PDF-1.4` header and `startxref`/`%%EOF` trailer.
6. **Pulling the on-device `.zip` for verification via `adb shell ... cat >
   file` silently corrupted it — 12KB larger than the source, and it's not
   a jszip-class bug.** First verification attempt reported a size mismatch
   against the on-device `ls`; re-pulling the identical bytes with `adb
   exec-out` instead of `adb shell` (which is documented to apply
   line-ending/text-mode translation to stdout on some platforms, unlike
   `exec-out`) produced a byte-exact copy. Worth remembering for any future
   on-device binary-file pull: prefer `adb exec-out` (or `adb pull`) over
   `adb shell ... cat`, and diff sizes against `ls` on-device before trusting
   a pulled binary.
7. **Port 8081 was held by an unrelated project's stale Metro process, not
   a leftover from this repo.** Starting Viziphy's dev client hit Expo's
   usual "port in use" prompt; `netstat`/`tasklist` traced the PID to `node
   ... expo/bin/cli start` running from `D:\R2Q2_APP_build\r2q2-options-app`
   — a different project entirely, not a stale process from a prior session
   of this one. Killing another project's live process without asking
   wasn't warranted, so Viziphy's Metro ran on port 8090 instead
   (`--port 8090`), with an explicit `adb reverse tcp:8090 tcp:8090` (not
   needed on the default port, which Expo's CLI sets up automatically only
   when it recognizes the attached device at startup) and the usual
   force-stop + deep-link reload from Gate 5's playbook, pointed at
   `:8090` instead of `:8081`.

Practical notes for picking back up: local Supabase (`supabase start` in
`packages/backend`) and each app's Metro dev server (`expo start
--dev-client` in `apps/viziphy` or `apps/thumbwave`) do not survive a
session/PC restart and need to be started fresh — see
`packages/backend/README.md` and the per-gate verification notes below for
exact steps. Gate 5's verification hit a sharp edge worth remembering here:
after restarting a stale Metro process, the dev client's native shell can
resume and look fully functional (including making real network calls)
while still silently running the *previous* JS bundle — a plain `adb shell
am start` brings an already-running task to the foreground instead of
re-fetching JS. Force-stop the app first, then relaunch via an explicit
`<scheme>://expo-development-client/?url=http://127.0.0.1:<port>` deep link
to guarantee a real reload. Gate 4's exit condition also flagged one
unverified detail worth a real device/manual pass: Thumbwave's face-cutout
render path (`SvgImage` + circular `ClipPath` + stroked ring in
`apps/thumbwave/src/render/ThumbnailCard.tsx`) is implemented and
type-checked but was never visually confirmed with an actual selected
photo — emulator automation couldn't complete a selection in the system
Photo Picker.

### Gate 0 — Foundation
- [x] Finalize app name
- [x] Init local repo at `D:\Social_Media_app`, connect to
      `https://github.com/R2Q2Group/Social_app`
- [x] Choose stack: React Native + Expo (dev client + EAS Build) for on-device
      vector rendering + fast iteration; Supabase (Postgres/Auth/Edge Functions/
      Storage) for backend. Monorepo (Turborepo) layout. See Section 7.
- [x] Define design tokens (colors, type scale) for both Carousel and Thumbnail
      systems — `packages/design-tokens/src/{carousel,thumbnail}.ts`
- [x] This RDD committed to repo as `/docs/RDD.md`
- **Exit condition:** repo exists, pushes cleanly, RDD committed, stack decided.

### Gate 1 — AI Drafting Core
- [x] Backend endpoint: raw text/voice-transcript in → structured JSON out —
      `packages/backend/supabase/functions/draft`
- [x] Two prompt modes: carousel-breakdown, thumbnail-extraction —
      `packages/ai-core/src/prompts.ts` + `client.ts` (forced Anthropic tool-use,
      Claude 3.5 Haiku, hand-validated against `schema.ts`)
- [x] Free-tier rate limiting (3/day) + BYOK key storage (encrypted, user-provided) —
      `packages/backend/supabase/migrations/20260810000000_gate1_ai_core.sql`
      (Supabase Vault for keys, `increment_usage`/`get_decrypted_byok_key` RPCs
      restricted to the service role). Caller identity is a Supabase session,
      anonymous included, so this works ahead of the Gate 3.5 account system —
      an anonymous session upgrades to a real account later with no migration.
- **Exit condition met (2026-08-10):** verified end-to-end against local Supabase
      (`supabase start` + `supabase functions serve`) — both `carousel` and
      `thumbnail` modes return valid, schema-validated JSON from a real
      Anthropic call. Two bugs found and fixed during verification:
      1. `packages/ai-core/src/*.ts` used extension-less relative imports
         (`from "./client"`), which tsc/Node tolerate but Deno's edge runtime
         requires explicit `.ts` extensions for — added them.
      2. `packages/ai-core/src/client.ts` hardcoded `claude-3-5-haiku-20241022`,
         retired 2026-02-19 (404 `not_found_error`) — updated to its
         replacement, `claude-haiku-4-5`.

### Gate 2 — Carousel Renderer (MVP platform: pick one, e.g. LinkedIn)
- [x] Native vector slide renderer for one platform's aspect ratio + token set —
      `apps/viziphy/src/render/LinkedInSlideCard.tsx`: `react-native-svg` for
      decorative shapes (accent bar) + RN `<Text>` for content (auto-wrap, no
      font asset needed) over `carouselColors`/`carouselTypeScale`/
      `carouselPlatforms.linkedin`. Skia stays unused for Gate 2 — reserved
      for Gate 3/4's raster/cutout needs.
- [x] Render structured JSON → swipeable slide preview in-app —
      `apps/viziphy/src/render/CarouselPreview.tsx` (paging `ScrollView`,
      dot indicator), wired through `app/index.tsx` (idea input →
      `requestCarouselDraft`) and `app/preview.tsx`.
- [x] Export single platform as PNG/PDF — `apps/viziphy/src/export/`:
      `capture.ts` (`react-native-view-shot`), `pdf.ts` (`expo-print`,
      one page per slide at the 4:5 ratio), `share.ts` (`expo-sharing`).
- **Exit condition met (2026-08-11):** verified end-to-end on the
      `Medium_Phone_API_36.1` Android emulator against local Supabase —
      idea → drafted → rendered (swipeable 8-9 slide carousel) → exported
      (PNG share sheet showing the rendered slide; PDF share sheet showing
      a generated multi-page file). Notable fixes made along the way:
      - `apps/viziphy` had no `babel.config.js`/`metro.config.js` — added
        both (Metro's `watchFolders` scoped to `packages/ai-core` +
        `packages/design-tokens` specifically, *not* the monorepo root,
        which was otherwise crawling the ~1000-package root
        `node_modules` and making every cold bundle time out client-side).
      - `react-native-svg`/`react-native-screens`/
        `react-native-safe-area-context`/`babel-preset-expo` all floated to
        versions well past what Expo SDK 52 bundles (via unpinned ranges or
        `expo-router`'s `"*"` peer deps) and broke the native build or the
        JS bundle; pinned via root `package.json` `overrides` plus exact
        versions in `apps/viziphy/package.json`.
      - Generated `android/build.gradle`'s Kotlin Gradle plugin classpath
        had no version, resolving out of sync with the Compose compiler
        version `expo-modules-core` picks — fixed permanently via an Expo
        config plugin (`apps/viziphy/plugins/withKotlinGradlePluginVersion.js`)
        so it survives `expo prebuild --clean`.
      - Local Supabase's Edge Function containers sandbox their bind mount
        to `supabase/functions` only — `draft`'s import of
        `@r2q2/ai-core` (a sibling package) can't resolve inside Docker.
        Fixed with the standard Supabase pattern: a generated
        `supabase/functions/_shared/ai-core` mirror
        (`packages/backend/scripts/sync-shared.js`, run via `predev`/
        `predeploy`), imported instead of the package directly.
        `packages/ai-core/src` remains the single source of truth.
      - `react-native-view-shot`'s `captureRef` hung indefinitely under
        Fabric/new-architecture when given an explicit `width`/`height`
        override (to target a fixed export resolution independent of
        on-screen size) — `apps/viziphy/src/export/capture.ts` captures at
        on-screen size instead, wrapped in a client-side timeout as a
        defensive fallback.

### Gate 3 — Multi-Platform Carousel Expansion
- [x] Add remaining platform render targets from Section 4 (one at a time) —
      `packages/design-tokens/src/carousel.ts`'s `carouselPlatforms` gained a
      `layout` variant per platform (`accentBar` for LinkedIn/Facebook,
      `centered` for Instagram, `statement` for X, `focal` for TikTok/Reels,
      `topHeavy` for Pinterest); `apps/viziphy/src/render/LinkedInSlideCard.tsx`
      was generalized into `SlideCard.tsx` (`platform` prop, one layout
      component per variant, still SVG/RN-`Text` only — Skia stays unused).
      `CarouselPreview`/`preview.tsx` gained a platform-chip picker so the
      same drafted JSON re-renders across all 6 without a new AI call.
- [x] Per-platform text-density and aspect-ratio rule enforcement —
      `carouselPlatforms[platform].limits` (title/subtitle/bullet char caps,
      max bullets) enforced render-side via
      `apps/viziphy/src/render/textDensity.ts`'s `enforceTextDensity`
      (truncates with an ellipsis; a 0 limit drops the field, e.g. X/TikTok
      carry no bullets) rather than round-tripping the AI per platform.
- **Exit condition met (2026-08-11):** verified end-to-end on the
      `Medium_Phone_API_36.1` Android emulator against local Supabase — one
      drafted idea rendered correctly across all 6 platform chips
      (LinkedIn/Instagram/X/TikTok/Pinterest/Facebook), including truncated
      text and correct aspect ratio per platform; PNG export verified via
      the native share sheet. Three real bugs found and fixed during
      verification:
      1. X's `statement` layout absolutely-positioned its page indicator,
         which overlapped the subtitle on X's short 16:9 card — replaced
         with the same flex-column "content + indicator row" pattern the
         other layouts already used successfully.
      2. Portrait platforms (TikTok 9:16, Pinterest 2:3) could render taller
         than the on-screen viewport; the horizontal `ScrollView` clips
         vertical overflow, silently hiding the bottom of the card
         (including the page indicator) instead of shrinking it.
         `CarouselPreview` now measures its available height via `onLayout`
         and fits the card to `min(widthBudget, heightBudget)`.
      3. The platform-chip `ScrollView` in `preview.tsx` had no `style`
         (only `contentContainerStyle`), so it stretched to fill the whole
         flex column instead of sizing to its chip content — chips rendered
         as full-height pills. Fixed with an explicit
         `flexGrow: 0, flexShrink: 0` style. This compounded bug #2's
         symptom (starved the carousel of vertical budget), so fixing both
         together is what made TikTok's huge focal-layout font legible.
      Known limitation carried forward, not a Gate 3 regression: batch PDF
      export (`buildCarouselPdf` capturing all N slides in a loop) can hang
      under Fabric — `react-native-view-shot`'s native capture throws
      `AssertionException: Expected to run on UI thread!` inside
      `FabricUIManager.resolveView` when invoked off the UI thread, and the
      native promise never settles, so even `capture.ts`'s client-side
      timeout (added in Gate 2 for the same underlying issue) doesn't always
      recover it. Single-slide PNG export (same `captureSlidePng` call) is
      solid. Multi-slide export robustness is explicitly Gate 6's scope
      ("Batch export (all platforms from one draft in one action)" /
      "export quality is App-Store-demo-ready") — deferred there rather than
      patched here.

### Gate 4 — Thumbwave (standalone spinoff app)
- [x] Scaffold Thumbwave as its own app shell (`apps/thumbwave` package in the
      monorepo — decided at Gate 0, see Section 7), sharing the R2Q2 backend/AI
      core and account layer built in Gates 1 and 3.5 — config mirrors
      `apps/viziphy` (babel/metro/tsconfig, `withKotlinGradlePluginVersion`
      plugin, scoped Metro `watchFolders`), `com.r2q2group.thumbwave` /
      scheme `thumbwave`. The Gate 1 drafting endpoint and thumbnail schema
      already existed and needed zero backend changes — `mode: "thumbnail"`
      was fully built and validated in Gate 1, just never exercised by a
      real app until now. Sharing the account layer meant actually sharing
      it: `apps/viziphy/src/lib/{supabase,session,auth,entitlement,
      draftClient}.ts` were extracted into a new `packages/account-client`
      package (`draftClient.ts`'s `requestCarouselDraft` generalized to
      `requestDraft(mode, input)`, overloaded per mode for return-type
      narrowing) rather than duplicated into Thumbwave — the whole point of
      Gate 3.5 was one account system, not one copy-pasted per app.
      Viziphy re-points at `@r2q2/account-client` with no behavior change.
- [x] Thumbnail-specific design tokens + preset style library (distinct from
      Viziphy's) — `thumbnailColors`/`thumbnailTypeScale`/`thumbnailCanvas`/
      `thumbnailPresetStyles` already existed from Gate 0. Added
      `thumbnailAppColors`/`thumbnailAppTypeScale` alongside them
      (`packages/design-tokens/src/thumbnail.ts`) for Thumbwave's own
      screens (input, variants, account) — `thumbnailColors` is
      deliberately loud/high-saturation for the *exported thumbnail image*
      per RDD Section 3.3, not meant for general app chrome; reusing it for
      screen backgrounds would mean bright-yellow UI everywhere.
- [x] Face-cutout upload/crop flow — `expo-image-picker` with
      `allowsEditing`/`aspect: [1,1]` (native square crop, no custom crop
      UI needed) feeding `ThumbnailCard`'s SVG `<ClipPath>` circle + stroked
      ring. Matches RDD Section 3.2's "auto-crops/outlines it as a layered
      vector asset" literally — no ML background removal, which is
      explicitly out of scope there.
- [x] Arrow/circle/emoji vector overlay system —
      `src/render/overlays.tsx`: `overlayKindForCalloutShape` maps the
      AI-generated free-form `calloutShape` string onto arrow/circle/emoji
      via substring keywords (same pattern as `SlideCard.tsx`'s
      `calloutType` → accent-color mapping from Gate 3), each rendered as
      react-native-svg primitives (`Path`/`Circle`/`Text`).
- [x] A/B variant generation (2-3 per input) — already returned by the Gate
      1 `draft` endpoint in thumbnail mode (`schema.ts` requires 2-3
      variants); `app/variants.tsx` adds the chip-based preview UI across
      them, re-rendering the same drafted JSON per variant with no extra AI
      call, mirroring Viziphy's platform-chip pattern from Gate 3.
- **Exit condition met (2026-08-11):** verified end-to-end on the
      `Medium_Phone_API_36.1` Android emulator against local Supabase, with
      Thumbwave installed and running as a fully separate app
      (`com.r2q2group.thumbwave`) alongside Viziphy
      (`com.r2q2group.viziphy`): idea in → drafted → 3 rendered variants,
      each with distinct headline/subhead/overlay (arrow on one, fire emoji
      on the other two — circle wasn't hit by this draft's `calloutShape`
      wording but shares the same code path as arrow, already proven) →
      Export PNG produced a real rasterized thumbnail through the native
      share sheet. Face-cutout's permission grant and native photo-picker
      launch were confirmed working; completing a photo selection could not
      be automated through the emulator's synthetic input in this session
      (the system Photo Picker runs in its own surface that didn't respond
      to scripted taps — an automation-tooling limitation, not exercised as
      an app-code failure) — the render path (`SvgImage` + `ClipPath` +
      stroked ring) is implemented and type-checked but not yet visually
      confirmed with a real photo; worth a manual pass. Two real issues
      found and fixed during verification:
      1. Starting Thumbwave's dev client while Viziphy's Metro bundler was
         still running on the shared default port 8081 didn't error —
         Expo's CLI silently reused the already-running server, so
         Thumbwave's dev client loaded *Viziphy's* JS bundle under its own
         native shell (right `applicationId`, wrong app content) until that
         Metro process was killed and restarted from `apps/thumbwave`.
         Worth remembering when running two apps in this monorepo: only one
         Expo dev server per port, and a stale one won't warn you it's
         serving the wrong project.
      2. The headline's SVG-text outline (`stroke` sized at 4.5% of font
         size) was thick enough to visually overwhelm the dark `fill`,
         reading as solid white-on-yellow instead of "outlined bold text"
         per RDD Section 3.3. Reduced to 2%, restoring legible fill+outline
         contrast.

### Gate 3.5 — Shared Account Layer (moved up from Gate 5)
Because Thumbwave and Viziphy need to share one R2Q2 account/BYOK/subscription
system, this must exist before Gate 4 starts, not after Gate 3 as originally scoped.
- [x] R2Q2 account system (sign up/login, shared across apps) — real
      email/password auth on top of Gate 1's anonymous sessions, not a
      separate system: `apps/viziphy/src/lib/auth.ts`'s
      `upgradeAnonymousAccount()` calls `auth.updateUser({email, password})`
      on the caller's existing anonymous session, which links the identity
      in place (same `auth.uid()`, `is_anonymous` flips to `false`) rather
      than minting a new user — so BYOK keys/usage/entitlement from the
      anonymous period carry over with no migration step, exactly as the
      Gate 1 exit note anticipated. `signInWithEmail()` /`signOut()` round
      out the flow; `app/account.tsx` is the minimal UI that exercises all
      of it. Local-only: `supabase/config.toml` gained
      `[auth.email] enable_confirmations = false` so sign-up doesn't need a
      real inbox in dev (revisit before linking a hosted project).
- [x] BYOK key storage tied to account, not per-app — already true as of
      Gate 1 (`byok_keys` keyed by `user_id`, not by app); Gate 3.5 doesn't
      change that table, it just confirmed the same `user_id` is what a
      second app in the family would see too, since every app shares one
      Supabase project/`auth.users` table.
- [x] Subscription/entitlement check callable from any app in the family —
      `packages/backend/supabase/migrations/20260811000000_gate3_5_accounts.sql`
      adds `public.entitlements` (`user_id` PK, `tier` free/pro, `status`,
      RLS select-own) plus an `on_auth_user_created_entitlement` trigger
      that seeds a default `free`/`active` row for every new `auth.users`
      row (anonymous included, so the row already exists by the time that
      session upgrades). `supabase/functions/entitlement/index.ts` is a
      thin read-only endpoint: validates the caller's bearer JWT, returns
      their `{tier, status}` under RLS — no service-role key needed for a
      read. `apps/viziphy/src/lib/entitlement.ts` is the client wrapper.
- **Exit condition met (2026-08-11):** verified end-to-end. Backend, via
      curl against local Supabase: an anonymous session's entitlement reads
      `free/active` immediately (trigger-seeded); upgrading that same
      session to `gate35test@example.com`/password kept the same
      `auth.uid()` and the same entitlement row (`is_anonymous` flipped to
      `false`, `email` set); signing in with that email/password from a
      *second*, unrelated anonymous-session client resolved to the same
      `auth.uid()` and read the identical entitlement; flipping that row to
      `tier=pro` directly in the DB (standing in for Gate 5's future
      billing webhook) was immediately visible to that second-client
      session, proving the "recognized from any app" requirement without
      Thumbwave existing yet to test against; a third, unrelated anonymous
      session read its own `free/active` row, not the first user's `pro`
      one, confirming RLS isolation; a request with no Authorization header
      correctly 401'd. Client, on the `Medium_Phone_API_36.1` Android
      emulator against local Supabase: fresh anonymous session → Account
      screen shows "This device: anonymous session" / "Plan: free
      (active)" → Sign up creates `gate35ui@example.com` in place → screen
      flips to "Signed in as gate35ui@example.com" with the same free/active
      entitlement → Sign out returns to a fresh anonymous session → Sign in
      with the same credentials succeeds. One real bug found and fixed
      during verification: `getAccountState()` in `auth.ts` called
      `supabase.auth.getUser()` directly without first calling
      `ensureAnonymousSession()`, unlike every other identity-touching
      function in the codebase. `account.tsx` calls it in `Promise.all`
      alongside `getEntitlement()` (which *does* ensure a session first) —
      on a cold Account-screen visit this raced the concurrent session
      creation and read "no session yet" as `{email: null, isAnonymous:
      false}`, rendering the signed-in/"Signed in as null" branch instead
      of the anonymous sign-up form. Fixed by calling
      `ensureAnonymousSession()` at the top of `getAccountState()` too.

### Gate 5 — Monetization Layer (per-app entitlement UI)
- [x] Pro subscription paywall (unlimited gen, watermark removal, brand fonts, hi-res export)
      — `apps/{viziphy,thumbwave}/app/upgrade.tsx`: Free-vs-Pro plan comparison
      (hi-res export/custom fonts listed as "coming soon," honestly deferred to
      Gate 6 rather than promised early) + Upgrade/Cancel button. Investigation
      at the start of this gate found two gaps blocking the exit condition from
      being real: (1) Pro had no backend effect — `draft/index.ts` only
      branched on BYOK-or-capped, so a Pro user without a BYOK key would still
      hit the 3/day cap, contradicting RDD.md §5's "Pro: unlimited generation";
      (2) nothing existed to remove, since no watermark existed at all. Both
      fixed as part of this gate (see below), not deferred, since without them
      "Pro" was a label with no enforcement.
      Real Google Play Billing / Apple StoreKit integration is the intended
      end state per product direction, but needs store console access, product
      IDs, and native build config this session can't provision. Landed
      instead: `purchasePro()`/`cancelPro()` in
      `packages/account-client/src/billing.ts` are the seam for that — same
      call shape a real flow would need (resolve to the caller's updated
      Entitlement) — backed today by two new dev-mock RPCs,
      `upgrade_to_pro()`/`downgrade_to_free()`
      (`packages/backend/supabase/migrations/20260812000000_gate5_monetization.sql`,
      security-definer + `auth.uid()` check, same pattern as Gate 1's
      `set_byok_key`/`delete_byok_key`), mirroring how Gate 3.5 already stood
      in for this exact transition by flipping the DB by hand. Swapping in
      real IAP later only replaces what's inside those two functions.
      Free-tier/Pro enforcement itself: a "Made with Viziphy"/"Made with
      Thumbwave" watermark, rendered as a normal child of each slide/thumbnail
      card (`SlideCard.tsx`'s five layouts; `ThumbnailCard.tsx`'s `<SvgText>`)
      so the existing `captureRef`-based PNG/PDF export picks it up for free
      with no separate image-processing pass — gated by a `showWatermark` prop
      threaded from each preview screen's `getEntitlement()` call, defaulting
      to shown (free) until that resolves rather than briefly flashing a
      watermark-free export.
- [x] BYOK settings UI — new `packages/account-client/src/byok.ts`
      (`listByokKeys`/`setByokKey`/`deleteByokKey`), the first client wrapper
      around Gate 1's `set_byok_key`/`delete_byok_key` RPCs and
      `byok_keys_select_own` RLS policy (Gate 1 only exercised them from the
      Edge Function side). Folded into each app's existing `account.tsx`
      (not a new route — account-scoped) rather than duplicated: masked key
      input + Save when unset, "Key saved" status + Remove when set. Only an
      Anthropic row is rendered — `openai` is modeled in the `byok_keys`
      schema per Gate 1 but `ai-core` has no OpenAI client path yet, so an
      OpenAI row would be a dead control.
- [x] Usage tracking for free-tier cap — `packages/account-client/src/usage.ts`'s
      `getUsageToday()` reads `usage_daily` directly (RLS-scoped, no new
      endpoint needed) and renders "X / 3 used today" on the account screen;
      swaps to "unlimited (BYOK)"/"unlimited (Pro)" for those callers instead,
      since they never hit `increment_usage`.
- Note: the underlying account/entitlement *system* was built in Gate 3.5 — this
  gate is the per-app UI/UX on top of it (Viziphy's paywall screen, then Thumbwave's).
- **Exit condition met (2026-08-11):** verified end-to-end on the
      `Medium_Phone_API_36.1` Android emulator against local Supabase, both
      apps, plus direct backend curl checks. Backend: a fresh anonymous
      session's 4th `draft` call 429'd (`free_tier_limit_exceeded`) after 3
      free-tier successes; calling the new `upgrade_to_pro()` RPC on that same
      session let two more calls through unlimited on the *backend* key
      (`usedByok:false`, proving the new entitlement-aware skip in
      `draft/index.ts`, not just the pre-existing BYOK path); `downgrade_to_free()`
      immediately restored the 429; a separately-set (deliberately invalid)
      BYOK key produced a `draft_generation_failed` 502 from Anthropic auth,
      not a 429 — confirming the BYOK bypass path is unchanged. App UI
      (Viziphy): generated a real carousel on a free account and confirmed the
      "Made with Viziphy" watermark rendered on-card (both `accentBar` and
      `topHeavy` layouts); Account screen showed a live "2 / 3 used today"
      matching real `usage_daily` state for a real signed-in user
      (`gate35ui@example.com`, carried over from Gate 3.5); saved a BYOK key →
      UI flipped to "unlimited (BYOK)" + Remove key → removed it → reverted to
      the X/3 counter; opened the Upgrade screen, tapped Upgrade to Pro →
      entitlement flipped live, generated a 4th carousel on the same
      already-capped account and it succeeded with the watermark gone. App UI
      (Thumbwave): generated a thumbnail on a free anonymous session and
      confirmed the "Made with Thumbwave" watermark rendered in the SVG
      output; Account and Upgrade screens both rendered correctly with
      Thumbwave's yellow accent theming and app-specific copy ("Extra A/B
      variant packs" vs. Viziphy's "Custom brand fonts"). `npx tsc --noEmit`
      clean on both apps. One real environment issue hit and fixed during
      verification, not an app-code bug: after killing a stale Metro process
      left over from a prior session (same class of issue Gate 4 already
      documented — only one dev server per port), the Viziphy dev client's
      *native shell* reconnected and appeared to work, but had silently kept
      running the *old* JS bundle from before this gate's code changes — a
      plain `am start` brings an already-running dev-client task to the
      foreground rather than re-fetching JS, so the watermark appeared
      genuinely missing until a `force-stop` + an explicit
      `expo-development-client://…?url=` deep link forced a real reload from
      the current Metro instance. Worth remembering: a dev-client "looking
      alive and rendering real data" is not proof it's running current code
      after any Metro restart.

### Gate 6 — Polish & Export
- [x] High-res PDF export (carousels) — new
      `apps/viziphy/src/export/HiResExporter.tsx` mounts every slide
      off-screen (`position: absolute, left: -100000`, not `opacity: 0`, so
      it's unambiguously outside the visible layout tree but still fully
      measured/laid out for capture) at a fixed pixel width instead of
      capturing the on-screen phone-width preview — `STANDARD_EXPORT_WIDTH`
      (720px, free tier + batch export) and `HI_RES_EXPORT_WIDTH` (1440px,
      Pro-only). Deliberately does *not* pass width/height to `captureRef`
      itself — Gate 2 found that hangs indefinitely under Fabric because it
      forces a relayout of the already on-screen source view; this instead
      mounts a *new* view tree already laid out at the target width via
      normal props, so `captureRef` never needs to resize anything.
      `preview.tsx`'s `handleExportPdf` picks the width by
      `getEntitlement()`'s tier and swaps the button label to "Export PDF
      (Hi-res)" for Pro. Single-slide PNG export is unchanged (on-screen
      capture, not in RDD's Gate 6 scope).
      **Verified end-to-end (2026-08-11):** free-tier and Pro PDF export
      both produce real, valid multi-page PDFs on-device — pulled both off
      the device and diffed their embedded image dimensions directly:
      1890×2363 (free) vs. 3780×4725 (Pro), exactly 2.0x in both axes. One
      real bug found and fixed first: every off-screen capture initially
      failed with "Slide 1 isn't rendered yet" — `HiResExporter`'s
      `useEffect` reset `refs.current = new Map()` on mount, which (being a
      passive effect) ran a couple milliseconds *after* `onReady` had
      already handed the just-collected refs to the caller, wiping them
      before they could be read. Fixed by deleting the effect — the
      component fully unmounts/remounts per export call already, so
      `useRef(new Map())`'s fresh instance per mount made the effect both
      redundant and actively harmful.
- [x] Custom brand fonts (Pro) — `apps/viziphy/src/fonts.ts`: three bundled
      Google Fonts packs (`@expo-google-fonts/{poppins,playfair-display,
      space-grotesk}` + `expo-font`, loaded up front via `useBrandFonts()`
      in `_layout.tsx`, which holds the app on a plain background View
      until ready rather than flashing system-font text first). Threaded as
      an optional `fontFamily` prop through `SlideCard.tsx`'s five layouts
      and `EmphasisText`/`Bullets` via `brandTextStyle(brandFont, role)` —
      resolves to a concrete static-weight family name (e.g.
      `Poppins_700Bold`) instead of pairing a family with `fontWeight`,
      since Google Fonts ships each weight as its own family and
      RN/Fabric has no way to apply synthetic bold on top of one without
      it looking wrong. `preview.tsx` adds a Pro-gated font-chip row
      (locked chips + an "Upgrade" link for free accounts); selection
      persists in AsyncStorage keyed `@r2q2/viziphy/brandFont` so it
      survives a tier downgrade and is ready again on re-upgrade, but only
      applies while `isPro` is true.
      **Verified end-to-end (2026-08-11):** on Pro, selecting "Editorial
      Serif" visibly changed the on-screen preview's typography (not just
      exports) across two different layout variants — LinkedIn's
      `accentBar` and Pinterest's `topHeavy` — and the selection persisted
      across a platform-chip switch. On free tier, all four font chips
      render `disabled` (confirmed via `enabled="false"` in the
      accessibility tree) and the "Brand fonts are a Pro perk — Upgrade"
      hint is present and tappable. Round-tripped a live Pro→free→Pro
      downgrade/upgrade (via Gate 5's `downgrade_to_free()`/
      `upgrade_to_pro()` dev-mock RPCs) and re-confirmed the lock state
      flips correctly both directions, not just on a fresh free account.
- [x] Batch export (all platforms from one draft in one action) — new
      `apps/viziphy/src/export/batch.ts`'s `buildBatchExportZip`: renders
      all 6 platforms via `HiResExporter` (same off-screen mechanism as
      above, at the tier-appropriate width), builds one multi-page PDF per
      platform through the existing `buildCarouselPdf`, and zips them with
      `fflate`'s `zipSync` (pure-JS, no native module, operates on real
      `Uint8Array`s throughout — see the fix note below for why this
      replaced the original `jszip` choice) plus `base64-js` for the
      RN-side base64⇄bytes conversion `expo-file-system`'s classic API
      needs. Shared as a single `.zip` via one `expo-sharing` share-sheet
      action.
      Available to both tiers (free at `STANDARD_EXPORT_WIDTH`, Pro at
      `HI_RES_EXPORT_WIDTH`) — RDD Section 5 doesn't list it as a Pro-only
      perk, only hi-res export and brand fonts are.
      Also addressed while touching this code path: Gate 3 documented that
      looping `captureRef` calls can throw
      `AssertionException: Expected to run on UI thread!` and hang under
      Fabric. Reading `react-native-view-shot`'s Android source
      (`ViewShot.java`) confirms why — `RNViewShotModule.captureRef`
      resolves the view on the UI thread (inside Fabric's `addUIBlock`) but
      then does the actual `view.draw(canvas)` on a separate
      `Executors.newCachedThreadPool()` thread, off the UI thread by
      construction; this is a library-level race, not something fixable by
      changing call order from JS. `capture.ts`'s new
      `captureSlidesSequentially` mitigates rather than eliminates it: each
      capture waits for `InteractionManager.runAfterInteractions` plus one
      more animation frame before firing (a quiet moment for Fabric's UI
      thread) and gets one retry on failure. **Confirmed sufficient
      (2026-08-11):** the underlying `AssertionException` race still fires
      intermittently during a real 42-capture batch run (visible in
      `adb logcat`), but every occurrence recovered on retry — batch export
      completed without hanging in every attempt this session, on both a
      2GB and a 4GB-RAM emulator.
      **Fixed (2026-08-11, night session) — the produced `.zip` was
      corrupt, root-caused to `jszip` itself, resolved by switching zip
      libraries.** The prior session's diagnosis (preserved in git history)
      found neither 7-Zip nor .NET's `ZipFile` could open the `jszip`
      output — "Is not archive" — with the fault isolated to
      `zip.generateAsync()` itself after ruling out every read/write
      encoding combination on this call site; leading hypothesis was
      `jszip`'s internal "binary string" encoding (one JS string char = one
      byte via `String.fromCharCode`) getting corrupted somewhere under
      RN/Hermes. Rather than patch `jszip`'s internals, this session
      replaced it with `fflate`, which operates on real `Uint8Array`s
      throughout with no binary-string intermediate to corrupt — see the
      task checkbox above for the call-site change. **Confirmed fixed:** a
      live Pro-tier 6-platform hi-res batch export pulled off-device opened
      cleanly in both 7-Zip (`7z t`: "Everything is Ok", 6 files) and
      .NET's `ZipFile.OpenRead` (enumerated all 6 entries), and every
      extracted PDF had a valid `%PDF-1.4` header and `%%EOF` trailer.
      Single-platform PDF export (`buildCarouselPdf`, used directly by
      `handleExportPdf` above) never went through the zip layer and was
      unaffected throughout.
- **Exit condition:** export quality is App-Store-demo-ready.
      **Met (2026-08-11, night session).** `npx tsc --noEmit` is clean on
      `apps/viziphy`. All 6 device-verification checklist items pass:
      1. [x] `adb devices` responds quickly — root cause of the prior
         session's stuck build confirmed as machine resource contention;
         recovering from it also surfaced a quick-boot-snapshot trap (see
         the Section 6 status note above).
      2. [x] Free-tier PDF export works and regressed cleanly onto the new
         off-screen-rendered path.
      3. [x] Pro PDF export is precisely 2x free tier's pixel width,
         confirmed by diffing embedded image dimensions (1890×2363 vs.
         3780×4725).
      4. [x] Font picker locks correctly for free, unlocks and visibly
         changes on-screen typography for Pro, across two layout variants.
      5. [x] Batch export produces a valid `.zip` that doesn't hang and
         opens cleanly in both 7-Zip and .NET's `ZipFile` — see the fix
         note in this gate's batch-export bullet above.
      6. [x] `downgrade_to_free()`/`upgrade_to_pro()` round-trip brand
         font/hi-res gating correctly through a live tier change, not just
         on a fresh account.

### Gate 7 — Beta Launch
- [x] Feedback loop on AI draft quality per platform — new
      `public.draft_feedback` table
      (`packages/backend/supabase/migrations/20260812010000_gate7_feedback.sql`):
      user-owned event log (RLS insert-own/select-own, no service-role RPC
      needed since it's plain content, not a secret like `byok_keys`) keyed
      on `{app, mode, platform, rating}` — re-rating the same platform/variant
      inserts another row rather than overwriting, preserving history across
      edits. `packages/account-client/src/feedback.ts`'s `submitDraftFeedback()`
      is the shared client wrapper. Wired into both apps' existing preview
      screens as a 👍/👎 row: `apps/viziphy/app/preview.tsx` (per platform
      chip — "How's this draft for LinkedIn?") and
      `apps/thumbwave/app/variants.tsx` (per A/B variant — `platform` stores
      `variant-{index}` since Thumbwave has no platform axis). Submission
      failures are swallowed (best-effort telemetry, matching how export
      errors are surfaced separately) so a network hiccup never blocks the
      export flow the feedback row sits next to.
      **Verified end-to-end (2026-08-11):** on the
      `Medium_Phone_API_36.1` emulator, tapped 👍 then 👎 on a real Viziphy
      LinkedIn draft and 👍 on a real Thumbwave variant, confirmed via
      direct `psql` against the local Supabase container that all three
      rows landed with correct `app`/`mode`/`platform`/`rating` values and
      that the UI's active-state highlight tracked each tap.
- [x] Internal Android build (local) / [ ] TestFlight/Play Store internal
      testing track (blocked — see below). Confirmed `eas-cli` is not
      authenticated in this environment (`npx eas-cli whoami` → "Not logged
      in"), and true TestFlight/Play internal-testing distribution needs an
      enrolled Apple Developer Program membership and Google Play Console
      access this session has no credentials for — those are the user's
      accounts to provision, not something to work around. As a reachable
      stand-in, produced a real installable release APK locally:
      `cd apps/viziphy/android && EXPO_NO_METRO_WORKSPACE_ROOT=1 ./gradlew assembleRelease`,
      still debug-signed (the Expo-prebuilt `android/app/build.gradle`
      defaults `release`'s `signingConfig` to the debug keystore — a real
      Play Store submission needs its own release keystore, deliberately
      not generated here since that key becomes the app's permanent
      identity in the store and shouldn't be minted without the user in the
      loop). One real bug found and fixed along the way: the release
      build's JS-bundling step
      (`:app:createBundleReleaseJsAndAssets`, i.e. `expo export:embed`)
      failed with `Unable to resolve module ./index.js from
      D:\Social_Media_app/.` — reproduced independent of which entry file
      was named. Root cause: Expo's monorepo auto-detection
      (`EXPO_USE_METRO_WORKSPACE_ROOT`, on by default) points Metro's
      *server root* at the npm-workspace root for this exact code path
      (`relativeTo: "server"` in `MetroBundlerDevServer.resolveRelativePathAsync`),
      so the embed step's relative-path resolution lands one directory
      *below* the monorepo root instead of inside `apps/viziphy`. The
      asymmetry that makes this tricky: the *dev* server needs
      workspace-root detection ON (it's how Metro finds `expo-router`,
      hoisted to the monorepo root's `node_modules` with no local copy
      under `apps/viziphy/node_modules`) while the *release embed* step
      needs it OFF — confirmed by testing both ways: baking
      `EXPO_NO_METRO_WORKSPACE_ROOT=1` into `metro.config.js` fixed the
      release build but broke `expo start` (`Unable to resolve module
      ./node_modules/expo-router/entry`). Fix landed as a build-invocation
      env var instead of a code change, so `metro.config.js` is untouched
      and dev workflow is unaffected. A second, unrelated failure surfaced
      on the same attempt — `expo-modules-core`'s native
      `buildCMakeRelWithDebInfo[arm64-v8a]` task hit a Windows
      `FileSystemException` on `libreactnative.so`, "the process cannot
      access the file because it is being used by another process" —
      caused by a stale Gradle daemon from an earlier failed attempt still
      holding the file (`./gradlew --stop` showed 2 daemons running);
      `./gradlew --stop` before the retry resolved it.
      **Verified (2026-08-11):** `BUILD SUCCESSFUL`, produced
      `app-release.apk` (~123MB); installed over the existing dev-client
      install via `adb install -r` and confirmed it launches standalone —
      no Metro bundling banner, no dev-server dependency, real embedded JS
      bundle. Reinstalled the debug/dev-client build afterward so the
      emulator was left in its normal dev-ready state, not stuck on the
      release build.
      **Real-device confirmed (2026-08-11), after fixing a real chain of
      networking issues once off the emulator:** the emulator build pointed
      at `10.0.2.2:54321`, the Android emulator's special host-loopback
      alias, which means nothing on a real phone. Getting the same install
      working on the user's actual Android phone over their home WiFi
      surfaced four distinct, independently-diagnosed blockers, in the
      order hit:
      1. Rebuilt with `EXPO_PUBLIC_SUPABASE_URL` pointed at the PC's real
         LAN IP (`192.168.0.108:54321`) instead of `10.0.2.2`. Confirmed
         local Supabase's Kong gateway is Docker-bound to `0.0.0.0:54321`
         (reachable in principle), not just loopback.
      2. Windows had the PC's Ethernet connection classified as a
         **Public** network, and separately had no firewall rule for port
         54321 on either profile — both blocked the phone's inbound
         connection outright, with the app reporting a generic "Network
         request failed" and nothing reaching Kong's logs at all. Switching
         the connection to **Private** in Windows Settings and adding an
         explicit `New-NetFirewallRule` for TCP 54321 (needs an elevated
         PowerShell — this session has no admin rights on the user's
         machine) were both required; neither alone was sufficient.
      3. Even after that, the app still failed identically. **NordVPN was
         running and blocking it** — confirmed by having the user test
         `http://192.168.0.108:54321/` directly in the phone's browser
         (got Kong's real "no route matched" response, proving raw
         connectivity) only *after* killing NordVPN's processes; before
         that, even the plain browser request never reached Kong. VPN
         clients' own firewall/kill-switch layers sit outside Windows
         Firewall entirely, so this wasn't discoverable from the Windows
         side alone.
      4. With raw connectivity finally proven, the app's own fetch calls
         *still* failed with "Network request failed", while the phone's
         browser worked fine against the same URL — and no request ever
         reached Kong's logs. Root cause: Android has blocked cleartext
         (`http://`, non-HTTPS) network requests from apps by default since
         API 28, unlike browsers; this app's manifest had no
         `usesCleartextTraffic` override, and release builds don't inherit
         whatever allowance debug builds might get. First fix attempt used
         the official `expo-build-properties` plugin
         (`android.usesCleartextTraffic: true`), which worked for the
         manifest flag but installing it shifted transitive dependency
         versions enough to break `expo-dev-menu`'s release-variant Kotlin
         compile after a clean `expo prebuild` (`Unresolved reference:
         core`/`Manifest` in `DevMenuManager.kt`) — a real, reproduced
         regression, not a fluke (confirmed by fully reverting the
         dependency and rebuilding clean). Replaced it with a small local
         config plugin instead, `apps/viziphy/plugins/withCleartextTraffic.js`
         (same pattern as Gate 2's `withKotlinGradlePluginVersion`), which
         sets the manifest attribute directly via
         `withAndroidManifest` with zero new dependencies — verified the
         dependency tree returned to the exact previously-working baseline
         (`git diff` on `package-lock.json` clean) before rebuilding.
      Also hit, purely a tooling/environment issue rather than an app bug:
      two separate `EXPO_NO_METRO_WORKSPACE_ROOT=1 ./gradlew assembleRelease`
      invocations had their *tracking* killed by the harness mid-build
      (the underlying Gradle daemon kept running independently both times,
      confirmed via `jps`) — worked around by launching fully detached
      (`nohup ... &; disown`, output to a log file) and polling for
      completion by watching the log/output file directly rather than
      relying on task-tracking for very long-running builds. Separately,
      not cleaning up the first detached attempt before launching a second
      briefly left two concurrent Gradle builds racing on the same output
      files — the same class of Windows file-lock collision Gate 6 hit
      with `libreactnative.so`; resolved with a full `./gradlew --stop` +
      process sweep before each retry. **Confirmed working end-to-end
      (2026-08-11):** installed via Phone Link on the user's real Android
      phone over home WiFi, generated a real carousel successfully — the
      first fully real-device (non-emulator) verification of any part of
      this app.
- **Exit condition:** external users completing idea→export without support.
      **Not met — genuinely blocked on the user, not on remaining
      engineering work.** Every piece buildable without external accounts
      is done (feedback loop, a real installable local build proving the
      release pipeline itself works end-to-end including the monorepo
      bundling fix above, now confirmed on a real Android phone over home
      WiFi — not just the emulator). "External users," though, means real
      people other than the developer; that's what's genuinely blocked.
      What's left needs the user directly: enrolling
      in the Apple Developer Program and creating an App Store Connect
      TestFlight group; creating a Google Play Console app listing and an
      internal testing track; running `eas login` (or providing existing
      EAS credentials) so cloud builds/submission are possible at all; and
      a product decision on real external testers before "external users"
      can be literally true. None of this is guessable or safe to
      provision unattended.
      **Google Play specifically** (user's stated next step as of
      2026-08-11; Apple is deferred until the company entity is sorted out,
      since Apple's org enrollment needs a D-U-N-S number and a real legal
      entity — Play has no equivalent hurdle for internal testing). What
      Play Console needs, none of which this session can provision:
      a developer account ($25 one-time, user's identity/payment — personal
      or organization both work for internal testing); the package name,
      already fixed as `com.r2q2group.viziphy` and **permanent after first
      upload**, so worth confirming before that point; a minimum store
      listing (name, icon, category, contact email, and a **real privacy
      policy URL** — non-optional even for internal-testing-only, and it
      has to be honest about the account system and BYOK key storage from
      Gates 1/3.5); a signing decision — **no release keystore has been
      generated on purpose**, since that key becomes the app's permanent
      store identity and losing it means never being able to update the
      app again (recommend opting into Play App Signing, where Google holds
      the permanent key and only a replaceable upload key is generated
      locally); and an `.aab` rather than the `.apk` built here for
      sideloading (`./gradlew bundleRelease`, same pipeline/env-var caveats
      as `assembleRelease`). Separately, the automated build+submit path
      would need a Google Cloud **service account JSON key** with Play
      Console API access — a real credential, only worth sharing if the
      user actively wants automated submission rather than uploading
      through the console web UI themselves.
      **Update (2026-08-12):** the account/listing/keystore prerequisites
      above are done and a real closed-testing release is submitted —
      see the production-backend and Play-submission entries later in this
      gate for what that took. Exit condition is still not met (no external
      tester has used the app yet), but the remaining blocker is now
      Google's review turnaround, not further engineering or account setup.
- [x] **Closed (2026-08-11, later session): mid-word truncation on the
      hook/slide 1 — the fix was correct all along and the cache-busted APK
      did contain it; the phone was simply still running the older build.**
      Confirmed on the user's real Samsung SM-S906E over adb, and separately
      on the emulator, both running
      `apps/viziphy/dist/viziphy-internal.apk`. The decisive test is
      arithmetic rather than eyeballing, and is worth reusing: the *old*
      `truncate()` was `text.slice(0, max - 1)`, so for any over-length text
      it emitted **exactly `max - 1` characters, always**. So the character
      count alone identifies which build is running, with no false positives:
      - phone, pre-fix build: `"What if you could detect a water leak 24
        hours before it ca"` = exactly 59 chars (LinkedIn `limits.title` 60)
        → old code;
      - phone, this APK: `"The average household leak wastes 9,000 gallons
        of water…"` = 56 chars ending on a whole word → fixed code;
      - emulator, this APK: LinkedIn 54 chars, TikTok 22 chars (limit 30,
        raw cut would be 29) → fixed code, including the tight-limit guard.
      The RDD's fallback hypothesis (React Native's own `numberOfLines`
      clipping producing a visually identical "…") was ruled out outright,
      not just deprioritized: `numberOfLines`/`ellipsizeMode` appear nowhere
      in either app, and RN renders no ellipsis without them, so that "…"
      could only ever have come from `truncate()`. The leading hypothesis
      (stale Metro transform cache) was therefore right, and the
      `--rerun-tasks` cache-busted rebuild fixed it — the APK just never got
      installed on the phone before the session ended.
- [x] **Found and fixed while verifying the above (2026-08-11): headings were
      broken mid-word by *layout*, a separate defect from the truncation
      one.** With the truncation fix live, TikTok/Reels still rendered
      `The av / erage / hous / ehold / leak…` — but here `truncate()`'s
      output was already correct (`"The average household leak"`, 26 chars,
      a clean word boundary under the 30 limit). The break was React Native
      wrapping *within* a word because the word was wider than the card:
      every layout hard-coded its heading `fontSize` from
      `carouselTypeScale` with no relation to card width, and `FocalLayout`
      used the largest type in the app (`hook * 1.3` = 52dp) on the
      narrowest card (9:16). Measured on-device via a temporary probe, that
      card is **259.7dp wide → 187.7dp of text space**, where `household` at
      52dp needs ~266dp — a guaranteed break. Two content-dependent factors
      hid this until now: it needs a word of roughly 8+ characters, and
      AI-generated hook copy skews to short punchy words (the emulator draft
      that passed used `small`/`leak`/`can`/`waste`).
      Fixed with `apps/viziphy/src/render/fitText.ts`'s
      `fitFontSizeToWidth()`, applied to the heading in all five layouts:
      it estimates the widest word's rendered width (per-character advance
      ratios, since RN has no synchronous text-measurement API and the size
      is needed before first paint) and shrinks the font just enough for
      that word to fit, clamped to a floor. It returns the base size
      unchanged whenever the text already fits, so layouts that were never
      at risk render identically — LinkedIn's `accentBar` stayed at exactly
      40dp through the whole verification. Estimates lean wide on purpose
      and a `FIT_SAFETY_MARGIN` of 0.94 keeps a fitted word off the exact
      boundary; without it the probe showed words sizing to *precisely* the
      available width, where any error in the estimate reintroduces the
      break.
      **Verified on the emulator dev client (2026-08-11)** against a draft
      chosen to contain long words: `"Why Detection Matters"` renders
      `Detection` (9 chars) whole at a fitted 34.5dp, and
      `"The cost of prevention is a…"` fits `prevention` (10 chars) at
      31.7dp, while `"A tiny leak today could cost…"` and `"Signs You Might
      Have a Leak"` both stay at the base 52dp. `npx tsc --noEmit` clean.
      Note for future verification: the carousel's paging `ScrollView` did
      not respond to `adb shell input swipe` at the card's vertical midpoint
      but did at `y=1200` on a 1080x2400 frame — worth trying a different y
      before concluding a swipe gesture is broken.
- [x] **Inactive carousel dots were invisible (2026-08-11, user-reported).**
      `CarouselPreview`'s `dotInactive` used `carouselColors.surface`
      (`#15181F`) against the `#0B0D12` background — so nothing indicated
      there were more slides to swipe to. Switched to
      `carouselColors.textMuted` (`#9AA1AE`), an existing token rather than
      a new color. Thumbwave has no dot indicator, so there was nothing to
      mirror.
- [x] **Fixed (2026-08-11, later session): slide content overflowed and
      collided with the page indicator and watermark on text-heavy drafts.**
      On LinkedIn's `accentBar` layout with a long hook + title + subtitle +
      bullets, the subtitle ran underneath both the `1 / N` page indicator
      and the "Made with Viziphy" watermark, so all three overlapped and
      became hard to read. Visible in the user's original pre-fix screenshot
      ("Made with Viziphy" over "Early detection technology that").
      Mechanism: `styles.watermark` is `position: absolute` pinned to the
      card's bottom-right, and `styles.content` is a `space-between` column
      whose `body` child was unconstrained — when the drafted text was taller
      than the card, `body` overran the space reserved for the indicator
      instead of the text being shrunk or clipped, and RN doesn't clip a
      flex item's overflowing children to its own box (only an ancestor with
      `overflow: hidden` does), so the overflow rendered on top of whatever
      came after it in the tree.
      Fixed with the same family as the heading auto-fit (`fitText.ts`):
      added `estimateWrappedLineCount()` (greedy word-wrap simulation reusing
      `estimateTextWidth`) and `fitScaleToHeight()`, which estimates the
      stacked height of a layout's supporting text (secondary title,
      subtitle, bullets — deliberately not the heading, already width-fit)
      and returns a scale factor so it fits the height actually left after
      the heading/caption/page-indicator take their share. `AccentBarLayout`
      applies the scale to font sizes and spacing; `Bullets` gained optional
      `fontSize`/`marginTop` props to receive it. `styles.body` also gained
      `overflow: "hidden"` as a hard backstop, so even if the estimate is
      off, excess content clips inside body's own box instead of rendering
      on top of the indicator/watermark — the same "estimate leans safe,
      never re-introduces the original defect" philosophy as the heading fit.
      **Verified:** `npx tsc --noEmit` clean. Math sanity-checked with a
      synthetic worst-case draft (max-length hook/title/subtitle/3 bullets on
      a 340-wide LinkedIn card) in a standalone script mirroring the
      estimator — confirmed it correctly drives `bodyScale` down to the 0.6
      floor rather than mis-estimating a scale that still overflows, and
      that a short draft leaves `scale` at `1` (no unnecessary shrinking).
      On-device: cold-booted the `Medium_Phone_API_36.1` emulator (the
      previous session's stuck-`sensors-service` trap recurred on a
      quick-boot relaunch — same fix as before, `-no-snapshot-load`),
      generated a real 5-slide LinkedIn draft from local Supabase with a
      deliberately dense idea (hook+title+subtitle+3 bullets on every
      slide), and swiped through all 5: every slide, including three with a
      3-4 line heading plus a full subtitle and 3 bullets, rendered with a
      clean gap above the page indicator/watermark — no overlap, and normal
      (non-dense) slides showed no visible shrinking, confirming the fix
      doesn't regress the common case.
- [ ] **Superseded detail, kept for context: mid-word truncation on the
      hook/slide 1.** Real-device testing surfaced that generated text is
      cut mid-word with an ellipsis (observed: "…become expe…" where the
      source hook was "What if you could catch water leaks before they
      become expensive?"). Root cause is `truncate()` in
      `apps/viziphy/src/render/textDensity.ts`, which sliced at a raw
      character count (`limits.title`, 60 for LinkedIn) with no regard for
      word boundaries. Fixed to back up to the last space before the cut,
      with a guard that keeps the raw character cut when backing up would
      discard more than ~60% of the budget (a single very long word, or a
      very tight limit like TikTok's 30). **Verified the logic directly in
      node against the exact observed string** — correctly yields "What if
      you could catch water leaks before they become…". **Not yet
      confirmed on-device:** the first rebuilt APK still showed the
      mid-word cut on slide 1 (slides 2-4 looked right). Two verification
      mistakes worth not repeating: (1) `grep`ing the packaged bundle for
      `"lastIndexOf"` as proof the fix shipped is meaningless — release
      bundles are **Hermes bytecode** (`hermesEnabled=true`; magic bytes
      `c61fbc03`), not readable JS, so common builtin names match by
      coincidence; (2) the bundle being newer than the source file only
      proves *a* rebuild happened, not that Metro's transform cache was
      invalidated. Leading hypothesis is therefore a stale Metro transform
      cache rather than a logic bug. Acted on that at session end: cleared
      `%TEMP%/metro-cache` plus every `createBundleReleaseJsAndAssets`
      intermediate and reran with `--rerun-tasks` — `BUILD SUCCESSFUL`
      with all 1087 tasks genuinely re-executed (nothing `UP-TO-DATE`), and
      that APK is the one now sitting at
      `apps/viziphy/dist/viziphy-internal.apk`. **Next session:** install
      *that* APK on the real phone and re-check slide 1 — this specific
      build has never been tested on-device. If it
      *still* truncates mid-word, the fix is not reaching the device and
      the next thing to check is whether `enforceTextDensity` is even the
      code path producing that particular ellipsis — note React Native's
      own `numberOfLines` clipping produces a visually identical "…" and
      would need a font-size/layout fix instead, not a string fix.
      Worth considering regardless: the AI prompt could ask for a hook
      under the tightest platform's char budget so truncation is rare
      rather than routine — currently one draft is generated and reused
      across all 6 platforms (deliberate, one AI call not six), with the
      per-platform limits applied client-side afterward.
- [x] **Production Supabase backend provisioned and the app pointed at it
      (2026-08-12).** Previously the app only ever talked to a local
      `supabase start` instance over LAN/emulator-loopback IPs — no hosted
      project existed. Created org "R2Q2 Group" and project
      `r2q2-social-app` (ref `jymkhwnlffrtfqzcmyfy`, `us-east-1`) via
      `supabase login --token` (browser OAuth login doesn't work through
      this session's non-TTY shell) and pushed all four migrations plus
      auth config with `supabase config push`. That push caught a real
      landmine before it shipped: a freshly created hosted project defaults
      `enable_anonymous_sign_ins` to **false**, which would have broken
      every session in the app outright (Gate 1's whole identity model
      starts every caller anonymous) — pushed the local override back to
      `true`. Also discovered the hosted project's *other* auth defaults
      (`max_frequency = 1m0s`, `otp_length = 8`) are stricter than the
      CLI's local-dev defaults (`1s`/`6`); pinned both explicitly in
      `config.toml` so a future `config push` can't quietly regress them.
      `enable_confirmations` stays off for this first release too, not just
      local dev — turning it on needs an `emailRedirectTo`/deep-link
      (`viziphy://`) and an app-side handler that don't exist yet, so
      anyone can sign up with an unverified email until that's built. Same
      "ship the mock, document the gap, revisit later" call already made
      for the Gate 5 billing mock. Deployed both edge functions
      (`draft`, `entitlement`) and set the existing Anthropic key (already
      real, from local dev) as a hosted secret straight from the local
      `.env` file via `supabase secrets set --env-file` piped through a
      throwaway temp file — the key value itself never appeared in any
      tool output or chat transcript. Added `apps/viziphy/.env.production`
      (gitignored) so release builds pick up the hosted URL/anon key
      automatically via Expo's env-file precedence
      (`NODE_ENV=production` → `.env.production` before `.env`), leaving
      the dev `.env` and local-Supabase workflow untouched. Removed the
      `withCleartextTraffic` plugin and its
      `usesCleartextTraffic="true"` manifest flag — production is real
      HTTPS now, and Play flags that attribute on review; debug builds are
      unaffected since they already get cleartext from React Native's
      standard `android/app/src/debug/AndroidManifest.xml` override,
      independent of this plugin. **Verified end-to-end (2026-08-12):**
      anonymous sign-up against the hosted project returns a session
      (`is_anonymous: true`), and a live `draft` call with that session's
      token round-tripped through Claude and returned a real 6-slide
      LinkedIn JSON payload with `HTTP 200` — the full chain (DB, Auth,
      Edge Functions, secret) confirmed working together, not just each
      piece individually.
      **Two real secrets handling issues surfaced along the way, both
      closed:** (1) `GenKey Tool.txt` — the upload keystore's password in
      plaintext — was sitting at the repo root, untracked (never pushed to
      GitHub) but not gitignored either, so a stray `git add -A` would have
      caught it; moved into `Documents\PrivateKeys` next to the actual
      `.jks`, where the file's own notes already said it belonged. (2) A
      Supabase personal access token got pasted into the chat transcript
      when login was set up (unavoidable — the CLI's browser-based login
      flow doesn't work in this session's non-TTY shell, so a manually
      generated token was the only path) — flagged immediately and the
      user rotated it from the dashboard once setup was done.
- [x] **First real Google Play closed-testing submission attempt, three
      more genuine blockers found only by actually trying to upload
      (2026-08-12).** All prior release-build verification (this gate's
      earlier entries) proved the *build* worked — none of it exercised
      Play Console's own acceptance checks, which is where these surfaced:
      1. **Release builds were silently debug-signed despite the Gate 6
         `withReleaseSigningConfig` plugin being correctly applied.** Root
         cause: the user-level `~/.gradle/gradle.properties` holding the
         `VIZIPHY_UPLOAD_*` credentials had a UTF-8 BOM (`EF BB BF`) at the
         very start of the file, corrupting the first property's key
         (`VIZIPHY_UPLOAD_STORE_FILE`) so Gradle's
         `project.hasProperty('VIZIPHY_UPLOAD_STORE_FILE')` check silently
         returned `false` and the signing config fell through to its debug
         fallback — no error, no warning, a build that reports
         `BUILD SUCCESSFUL` either way. Only caught because the resulting
         `.aab` was explicitly `jarsigner -verify -certs`'d and its `CN`
         checked before handing it off, rather than trusting the build
         output alone; worth doing that check on every future release
         build, since this failure mode produces no other signal. Fixed by
         stripping the BOM (`tail -c +4` over the file) — the property
         values themselves were untouched, never printed to any log.
      2. **Play rejected the upload: "must target at least API level 35",
         while the project's `targetSdkVersion` default was 34** (root
         `android/build.gradle`'s `ext` block; `compileSdkVersion` and
         `buildToolsVersion` were already `35`, so this was a same-toolchain
         config bump, not an SDK/dependency upgrade). Fixed with a new
         local config plugin, `withTargetSdk35.js`, following the same
         `withProjectBuildGradle` pattern as the existing
         `withKotlinGradlePluginVersion` plugin, so the bump survives a
         future `expo prebuild` instead of being a one-off manual edit.
      3. **Play rejected the *next* upload too: "Version code 1 has already
         been used,"** even though the first (API-34-targeting) draft was
         never published — Play permanently reserves any `versionCode` it
         has ever seen an upload for, discarded draft or not. Bumped to
         `versionCode` 2 in both `app.json` (`expo.android.versionCode`,
         the persistent source of truth for future prebuilds) and the
         currently-generated `android/app/build.gradle`. Worth remembering
         for every future release: bump `versionCode` *before* building,
         not after Play rejects it.
      **Also worth recording as a ruled-out hypothesis:** the first
      `bundleRelease` attempt after adding `.env.production` failed with
      the exact `Unable to resolve module .../expo-router/entry.js from
      D:\Social_Media_app/.` error this gate hit before (see the
      `EXPO_NO_METRO_WORKSPACE_ROOT` entry above) — but this time it
      reproduced identically in both a git-bash shell *and* native
      PowerShell, ruling out "MSYS path mangling" as the cause (the
      initial, wrong guess). The actual fix was the same one already
      documented: `EXPO_NO_METRO_WORKSPACE_ROOT=1` on the release-bundling
      invocation specifically; it just has to be re-set every session since
      it's an env var, not a persisted config change.
      **Current status (2026-08-12):** a `.aab` with all of the above fixed
      — upload-key signed (`CN=Shannan.Crosson, OU=R2Q2 Group`),
      `targetSdkVersion` 35, `versionCode` 2 — is uploaded to a Google Play
      closed testing release and submitted. **Awaiting Google's publishing
      review**; the user is filling in the remaining Play Console listing
      fields (country availability, etc.) while that runs.

### Gate 8 — Scale & Analytics
- [ ] Usage analytics (which platforms/styles are most generated)
- [ ] Cost monitoring on backend AI key usage
- [ ] Consider thumbnail engine as standalone sibling app ("Thumbwave") if usage
      data shows it warrants separate positioning
- **Exit condition:** ongoing — informs v2 roadmap.

### Ideas noted, not yet scheduled
Raised mid-session on 2026-08-11; not implemented, not assigned to a gate yet.
- After a user upgrades to Pro from the Upgrade screen, add a "Get started"
  CTA that jumps straight into content creation, instead of requiring a
  manual back-out to wherever they were before upgrading.
- A Wi-Fi-only option for auto-generation/export, so large exports (batch
  export in particular) don't burn mobile data by default.

---

## 7. Open Decisions Before Coding Starts

1. ~~Final app name~~ — **Resolved:** Viziphy (flagship), Thumbwave (spinoff),
   under R2Q2 Group.
2. ~~React Native + Expo vs. bare React Native~~ — **Resolved:** Expo, using the
   dev client + EAS Build workflow (not classic managed workflow). Config plugins
   and prebuild give full access to native modules (e.g. `@shopify/react-native-skia`,
   `react-native-svg`) for on-device vector rendering, while keeping fast iteration,
   OTA updates, and EAS Build for store submission.
3. ~~Backend: self-hosted (Node/Express) vs. Supabase/Firebase~~ — **Resolved:**
   Supabase (Postgres + Auth + Edge Functions + Storage). Directly supports the
   Gate 3.5 shared account/entitlement layer and encrypted-column BYOK key storage
   without building auth/session infra from scratch.
4. ~~Which carousel platform ships first in Gate 2~~ — **Resolved:** LinkedIn —
   highest professional-use conversion, simplest text-heavy/dark-mode design system
   to get right first.
5. ~~Monorepo vs. separate repos~~ — **Resolved:** Monorepo (Turborepo), structured as
   `apps/viziphy`, `apps/thumbwave` (from Gate 4), `packages/backend`,
   `packages/ai-core`, `packages/design-tokens`. Simplest to keep the shared
   backend/AI core in sync while only Viziphy exists through Gate 3; can be split
   into separate repos later if release cadences diverge.
