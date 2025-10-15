
# SACADOS — Next.js Skeleton

Généré: 2025-10-15T00:41:25.958039Z

## Démarrage
```bash
cp .env.example .env
# Remplis les clés API
npm i
npm run dev
```

## Endpoints
- `POST /api/briefing?type=morning|noon|close&mode=manual|cron&dryRun=true|false` (header: `x-admin-token`)
- `POST /api/briefing-ad-hoc` (body: `perplexityPromptOverride`, `gptInstructionsOverride?`, `subject?`, `to?[]`, `previewOnly?`, `validateAgainstSchema?`)

## Page Admin
- `GET /admin` (utilise NEXT_PUBLIC_ADMIN_TOKEN côté front pour le header)

## Crons
- `vercel.json` contient des crons UTC équivalents à Montréal 07:00 / 12:00 / 16:00.

## MJML
- Modifie `templates/email.mjml`, puis `npm run mjml` pour générer `templates/email.html`.

## Core
- `briefingCore/*` : schéma Zod, prompts, orchestrateurs, render HTML, Resend, Supabase.

