# 🔑 Comment Obtenir Votre SUPABASE_ANON_KEY

## Étapes :

1. **Allez sur** : https://supabase.com/dashboard
2. **Sélectionnez** votre projet "gob-watchlist"
3. **Cliquez** sur "Settings" (⚙️) dans la barre latérale
4. **Cliquez** sur "API"
5. **Copiez** la clé "anon public" (sous "Project API keys")

## Ensuite :

```bash
cd scripts
nano .env
```

Remplacez `your-anon-key-here` par votre vraie clé.

## Exemple :

```env
SUPABASE_URL=https://gob-watchlist.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvyi13YXRjaGxpc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzOTU4MjQwMCwiZXhwIjoxOTU1MTU4NDAwfQ.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Sécurité :

⚠️ **NE COMMITEZ PAS** le fichier `.env` (déjà dans `.gitignore`)
