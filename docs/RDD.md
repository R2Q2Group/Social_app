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
- Claude 3.5 Haiku or GPT-4o-mini for drafting.
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
- **Exit condition:** can POST an idea and receive valid structured JSON for both modes.
      Code complete; not yet run end-to-end. Status as of 2026-08-10:
      Docker Desktop installed (per-user install at
      `%LOCALAPPDATA%\Programs\DockerDesktop`, CLI `docker.exe` v29.7.2,
      not on PATH) but its daemon isn't responding yet — `docker info`
      returns `500 Internal Server Error` reaching `dockerDesktopLinuxEngine`
      (WSL2 backend not up). A PC restart is pending to resolve this.
      **Resume from here:** after reboot, confirm Docker Desktop shows
      "Running", then re-verify with `docker info`, then follow
      `packages/backend/README.md`'s "Gate 1: testing the `draft` endpoint"
      steps (`supabase start` → fill `supabase/functions/.env` → `supabase
      functions serve draft` → curl both modes) to actually clear this
      exit condition.

### Gate 2 — Carousel Renderer (MVP platform: pick one, e.g. LinkedIn)
- [ ] Native vector slide renderer for one platform's aspect ratio + token set
- [ ] Render structured JSON → swipeable slide preview in-app
- [ ] Export single platform as PNG/PDF
- **Exit condition:** idea → drafted → rendered → exported, one platform, end to end.

### Gate 3 — Multi-Platform Carousel Expansion
- [ ] Add remaining platform render targets from Section 4 (one at a time)
- [ ] Per-platform text-density and aspect-ratio rule enforcement
- **Exit condition:** all 6 carousel platforms render correctly from the same draft.

### Gate 4 — Thumbwave (standalone spinoff app)
- [ ] Scaffold Thumbwave as its own app shell (`apps/thumbwave` package in the
      monorepo — decided at Gate 0, see Section 7), sharing the R2Q2 backend/AI
      core and account layer built in Gates 1 and 3.5
- [ ] Thumbnail-specific design tokens + preset style library (distinct from Viziphy's)
- [ ] Face-cutout upload/crop flow
- [ ] Arrow/circle/emoji vector overlay system
- [ ] A/B variant generation (2-3 per input)
- **Exit condition:** idea/title in → 2-3 exportable 1280x720 thumbnail variants out,
  running as a separate installable app from Viziphy.

### Gate 3.5 — Shared Account Layer (moved up from Gate 5)
Because Thumbwave and Viziphy need to share one R2Q2 account/BYOK/subscription
system, this must exist before Gate 4 starts, not after Gate 3 as originally scoped.
- [ ] R2Q2 account system (sign up/login, shared across apps)
- [ ] BYOK key storage tied to account, not per-app
- [ ] Subscription/entitlement check callable from any app in the family
- **Exit condition:** a user logged into Viziphy has that same session/entitlement
  recognized if Thumbwave is installed later.

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
