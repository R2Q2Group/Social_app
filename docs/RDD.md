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
- [ ] Pro subscription paywall (unlimited gen, watermark removal, brand fonts, hi-res export)
- [ ] BYOK settings UI
- [ ] Usage tracking for free-tier cap
- Note: the underlying account/entitlement *system* was built in Gate 3.5 — this
  gate is the per-app UI/UX on top of it (Viziphy's paywall screen, then Thumbwave's).
- **Exit condition:** free/BYOK/Pro paths all functionally distinct and enforced.

### Gate 6 — Polish & Export
- [ ] High-res PDF export (carousels)
- [ ] Custom brand fonts (Pro)
- [ ] Batch export (all platforms from one draft in one action)
- **Exit condition:** export quality is App-Store-demo-ready.

### Gate 7 — Beta Launch
- [ ] TestFlight/internal Android build
- [ ] Feedback loop on AI draft quality per platform
- **Exit condition:** external users completing idea→export without support.

### Gate 8 — Scale & Analytics
- [ ] Usage analytics (which platforms/styles are most generated)
- [ ] Cost monitoring on backend AI key usage
- [ ] Consider thumbnail engine as standalone sibling app ("Thumbwave") if usage
      data shows it warrants separate positioning
- **Exit condition:** ongoing — informs v2 roadmap.

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
