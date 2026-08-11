# Social_app (R2Q2 Group)

Monorepo for the R2Q2 Group app family — Viziphy (carousel engine) and Thumbwave
(thumbnail engine, from Gate 4), sharing one backend, AI core, and design-token
system.

Full requirements and design decisions: [`docs/RDD.md`](docs/RDD.md).

## Structure

```
apps/
  viziphy/            Expo app — carousel engine (flagship)
packages/
  backend/             Supabase project: auth, BYOK key storage, edge functions
  ai-core/             Shared AI drafting core (carousel + thumbnail prompts)
  design-tokens/       Shared design tokens (carousel + thumbnail token sets)
```

## Stack

- React Native + Expo (dev client / EAS Build)
- Supabase (Postgres, Auth, Edge Functions, Storage)
- Turborepo monorepo

## Gate status

Currently on **Gate 0 — Foundation**. See `docs/RDD.md` Section 6 for the full
gate roadmap and exit conditions.
