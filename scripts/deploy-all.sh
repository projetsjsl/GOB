#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Déploiement automatisé (GitHub + Vercel)"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="$ROOT_DIR/.env.local"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

: "${GITHUB_TOKEN:?GITHUB_TOKEN manquant (définis-le dans .env.local)}"
if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "⚠️  VERCEL_TOKEN non défini. Le push GitHub sera effectué mais pas le déploiement Vercel."
fi

TARGET_BRANCH="${1:-main}"
COMMIT_MESSAGE="${COMMIT_MESSAGE:-"chore: deploy via admin SMS panel"}"
REPO_SLUG="${GITHUB_REPO:-projetsjsl/GOB}"
REMOTE_URL="https://${GITHUB_TOKEN}@github.com/${REPO_SLUG}.git"

echo "📁 Répertoire: $ROOT_DIR"
echo "🌿 Branche cible: $TARGET_BRANCH"
echo "📦 Repo: $REPO_SLUG"

echo "🔍 État Git:"
git status -sb

echo "➕ Ajout de tous les fichiers modifiés/non suivis..."
git add -A

if git diff --cached --quiet; then
  echo "ℹ️  Aucun changement à committer."
else
  echo "📝 Commit: $COMMIT_MESSAGE"
  git commit -m "$COMMIT_MESSAGE"
fi

echo "⬆️  Push vers $REPO_SLUG (branch $TARGET_BRANCH)"
git push "$REMOTE_URL" HEAD:"$TARGET_BRANCH"

if [ -n "${VERCEL_TOKEN:-}" ]; then
  echo "🌐 Déploiement Vercel (production)"
  npx --yes vercel deploy --prod --yes --token "$VERCEL_TOKEN"
else
  echo "⚠️  Token Vercel absent : déploiement Vercel sauté."
fi

echo "✅ Déploiement terminé."
