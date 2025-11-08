# Guide de Test - Workflow Briefing n8n

## 🧪 Tests à Effectuer

### 1. Tester l'endpoint `/api/briefing` directement

```bash
# Tester avec curl
curl "https://gob.vercel.app/api/briefing?type=morning"

# Ou avec le script de test
node test-briefing-endpoint.js morning
node test-briefing-endpoint.js midday
node test-briefing-endpoint.js evening
```

**Vérifier**:
- ✅ Réponse `success: true`
- ✅ Présence de `content` et `html_content`
- ✅ `subject` correct
- ✅ `metadata` avec tickers et tools_used

### 2. Tester via n8n (Manuel)

1. **Aller sur n8n**: https://projetsjsl.app.n8n.cloud/workflow/03lgcA4e9uRTtli1

2. **Tester avec Manual Trigger**:
   - Cliquer sur le node "Manual Trigger (Custom Prompt)"
   - Cliquer sur "Execute Node"
   - Vérifier que le workflow s'exécute

3. **Vérifier chaque étape**:
   - ✅ "Determine Time-Based Prompt" → Vérifier que `prompt_type` est défini
   - ✅ "Call /api/briefing (Emma)" → Vérifier la réponse
   - ✅ "Parse API Response" → Vérifier que `newsletter_content` et `html_content` sont présents
   - ✅ "Generate HTML Newsletter" → Vérifier le HTML généré
   - ✅ "Send Email via Resend" → Vérifier que l'email est envoyé
   - ✅ "Send Confirmation Email" → Vérifier que la confirmation est reçue
   - ✅ "Log to Newsletters Table" → Vérifier dans Supabase

### 3. Tester avec Webhook

```bash
# Tester le webhook
curl -X POST https://projetsjsl.app.n8n.cloud/webhook/emma-newsletter/send \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_type": "morning",
    "custom_prompt": null
  }'
```

### 4. Vérifier les emails

1. **Email principal**: Vérifier que le briefing est reçu
2. **Email de confirmation**: Vérifier que la confirmation est reçue à `ADMIN_EMAIL`

### 5. Vérifier les logs Supabase

```sql
-- Vérifier les newsletters envoyées
SELECT * FROM team_newsletters 
ORDER BY sent_at DESC 
LIMIT 5;

-- Vérifier les logs
SELECT * FROM team_logs 
WHERE workflow_name = 'Emma Newsletter'
ORDER BY timestamp DESC 
LIMIT 10;
```

## 🔍 Points de Vérification

### Endpoint `/api/briefing`
- [ ] Répond correctement pour tous les types (morning/midday/evening)
- [ ] Retourne `html_content` formaté
- [ ] Utilise les prompts depuis `config/briefing-prompts.json`
- [ ] Récupère les tickers depuis Supabase

### Workflow n8n
- [ ] "Call /api/briefing" est appelé avec le bon type
- [ ] La réponse est parsée correctement
- [ ] Le HTML est généré/utilisé
- [ ] L'email est envoyé via Resend
- [ ] La confirmation est envoyée
- [ ] Les logs sont sauvegardés dans Supabase

### Emails
- [ ] Email principal reçu avec le bon format HTML
- [ ] Email de confirmation reçu avec les bonnes infos
- [ ] Sujet correct selon le type

## 🐛 Dépannage

### Si `/api/briefing` retourne une erreur
```bash
# Vérifier les logs Vercel
vercel logs --follow

# Tester localement
npm run dev
curl "http://localhost:3000/api/briefing?type=morning"
```

### Si n8n ne peut pas appeler `/api/briefing`
- Vérifier que l'URL est correcte: `https://gob.vercel.app/api/briefing`
- Vérifier que le workflow n8n a accès à internet
- Vérifier les logs d'exécution dans n8n

### Si les emails ne sont pas envoyés
- Vérifier `RESEND_API_KEY` dans n8n
- Vérifier `BRIEFING_RECIPIENTS` et `ADMIN_EMAIL`
- Vérifier les logs Resend

### Si la confirmation n'est pas reçue
- Vérifier `ADMIN_EMAIL` dans n8n
- Vérifier que le node "Send Confirmation Email" s'exécute
- Vérifier les logs d'exécution dans n8n

