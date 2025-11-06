# 🐛 DEBUG SMS - État Actuel

## Problème
Les SMS réels contiennent encore tous les emojis malgré l'optimisation déployée.

## Flux Actuel
```
SMS Twilio → /api/adapters/sms.js
           → /api/chat.js (channel: 'sms')
           → emma-agent.js
           → adaptForChannel(response, 'sms')
           → Retour à sms.js
           → sendSMS()
```

## Tests Nécessaires

### 1. Vérifier que adaptForSMS() fonctionne localement
```bash
node -e "
import('./lib/channel-adapter.js').then(m => {
  const test = '1️⃣ Test 📊 Graphique 💰 Prix';
  const result = m.adaptForChannel(test, 'sms', {});
  console.log('AVANT:', test);
  console.log('APRÈS:', result);
  console.log('Emojis supprimés:', !result.includes('️'));
});
"
```

### 2. Vérifier les logs Vercel
```
vercel logs --follow
```

Chercher:
- "[Chat API] Réponse adaptée pour sms"
- "adaptForChannel"

### 3. Tester avec un vrai SMS
Envoyer: "Test AAPL"

Vérifier Twilio Console:
- Encoding doit être UCS-2 (emoji Emma gardé)
- Body doit contenir "1." au lieu de "1️⃣"
- Segments < 12 (au lieu de 20+)

## Solutions Possibles

### Si adaptForSMS ne s'exécute pas:
- Vérifier import dans chat.js
- Vérifier que channel === 'sms' (pas 'SMS' ou autre)
- Ajouter logs debug

### Si adaptForSMS s'exécute mais ne marche pas:
- Vérifier regex des emojis
- Tester chaque remplacement individuellement
- Vérifier l'ordre des remplacements

### Si tout fonctionne mais pas en prod:
- Vercel rebuild complet
- Vérifier version Node.js
- Vérifier que les fichiers sont bien déployés

## Prochaine Étape
1. Ajouter logs debug massifs
2. Tester en prod avec logs
3. Corriger selon les logs
