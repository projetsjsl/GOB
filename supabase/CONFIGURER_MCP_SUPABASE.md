# Configuration du Serveur MCP Supabase

Si le serveur MCP Supabase n'est pas encore configuré dans Cursor, voici comment le faire :

## Configuration dans Cursor

1. **Ouvrir les paramètres MCP de Cursor**
   - Allez dans les paramètres de Cursor
   - Cherchez "MCP" ou "Model Context Protocol"
   - Ajoutez un nouveau serveur MCP

2. **Configuration du serveur Supabase MCP**

   Ajoutez cette configuration dans votre fichier de configuration MCP (généralement `~/.cursor/mcp.json` ou dans les paramètres de Cursor) :

   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "npx",
         "args": [
           "-y",
           "@supabase/mcp-server"
         ],
         "env": {
           "SUPABASE_URL": "https://boyuxgdplbpkknplxbxp.supabase.co",
           "SUPABASE_SERVICE_ROLE_KEY": "votre-service-role-key"
         }
       }
     }
   }
   ```

3. **Obtenir la SERVICE_ROLE_KEY**
   - Allez sur: https://supabase.com/dashboard
   - Sélectionnez votre projet
   - Allez dans Settings → API
   - Copiez la "service_role" key (⚠️ gardez-la secrète!)

4. **Redémarrer Cursor**
   - Après avoir ajouté la configuration, redémarrez Cursor
   - Le serveur MCP Supabase devrait être disponible

## Utilisation

Une fois configuré, vous pourrez utiliser les outils MCP Supabase pour :
- Exécuter des requêtes SQL
- Gérer les tables
- Créer des migrations
- Interagir avec la base de données

## Alternative: Exécution manuelle

En attendant la configuration MCP, vous pouvez exécuter les migrations manuellement :

1. Allez sur: https://supabase.com/dashboard
2. Ouvrez "SQL Editor"
3. Copiez-collez le contenu de `supabase/migrations/013_add_task_dates.sql`
4. Cliquez sur "Run"




