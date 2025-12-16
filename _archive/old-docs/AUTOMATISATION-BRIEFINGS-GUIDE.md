# 🚀 Guide d'Automatisation des Briefings Emma En Direct

## 📋 **Options Disponibles**

### 1️⃣ **Supabase Schedule (Recommandé)**
- ✅ **Avantages** : Intégré, fiable, pas de limite de fonctions
- ✅ **Inconvénients** : Nécessite configuration Supabase
- ✅ **Complexité** : Moyenne

### 2️⃣ **Resend Direct (Plus Simple)**
- ✅ **Avantages** : Simple, direct, moins de dépendances
- ✅ **Inconvénients** : Moins de flexibilité
- ✅ **Complexité** : Faible

### 3️⃣ **Hybride (Meilleur des deux)**
- ✅ **Avantages** : Flexibilité maximale
- ✅ **Inconvénients** : Plus complexe
- ✅ **Complexité** : Élevée

## 🎯 **Recommandation : Resend Direct**

Pour votre cas d'usage, je recommande **Resend Direct** car :
- Plus simple à configurer
- Moins de points de défaillance
- Meilleur contrôle sur l'envoi d'emails
- Monitoring intégré

## 🛠️ **Configuration Resend Direct**

### **Étape 1 : Préparer Supabase**

```sql
-- Exécuter dans Supabase SQL Editor
\i supabase-resend-direct.sql
```

### **Étape 2 : Configurer les Variables**

```sql
-- Remplacer par vos vraies valeurs
UPDATE briefing_config SET config_value = 're_1234567890abcdef' WHERE config_key = 'resend_api_key';
UPDATE briefing_config SET config_value = 'votre-email@example.com' WHERE config_key = 'default_recipient';
UPDATE briefing_config SET config_value = 'https://votre-app.vercel.app' WHERE config_key = 'vercel_api_url';
UPDATE briefing_config SET config_value = 'Emma En Direct <noreply@votre-domaine.com>' WHERE config_key = 'from_email';
```

### **Étape 3 : Tester le Système**

```sql
-- Test complet
SELECT test_resend_system();

-- Test d'envoi manuel
SELECT send_morning_briefing_direct();
```

### **Étape 4 : Vérifier les Cron Jobs**

```sql
-- Voir les cron jobs actifs
SELECT * FROM cron.job WHERE jobname LIKE 'emma-%';
```

## 📅 **Horaires des Briefings**

| Briefing | Heure EST | Heure UTC | Cron Expression |
|----------|-----------|-----------|-----------------|
| **Morning** | 8h00 | 13h00 | `0 13 * * 1-5` |
| **Noon** | 12h00 | 17h00 | `0 17 * * 1-5` |
| **Close** | 16h30 | 21h30 | `30 21 * * 1-5` |

## 🔧 **Fonctions Disponibles**

### **Envoi Manuel**
```sql
SELECT send_morning_briefing_direct();
SELECT send_noon_briefing_direct();
SELECT send_close_briefing_direct();
```

### **Envoi à Tous les Abonnés**
```sql
SELECT send_briefing_to_all_subscribers('morning');
SELECT send_briefing_to_all_subscribers('noon');
SELECT send_briefing_to_all_subscribers('close');
```

### **Gestion des Abonnés**
```sql
-- Ajouter un abonné
INSERT INTO briefing_subscribers (email, name, preferences) 
VALUES ('user@example.com', 'John Doe', '{"morning": true, "noon": false, "close": true}');

-- Voir tous les abonnés
SELECT * FROM briefing_subscribers;

-- Désactiver un abonné
UPDATE briefing_subscribers SET active = false WHERE email = 'user@example.com';
```

### **Monitoring**
```sql
-- Statistiques des 7 derniers jours
SELECT get_briefing_stats(7);

-- Historique des briefings
SELECT * FROM briefings ORDER BY generated_at DESC LIMIT 10;

-- Briefings échoués
SELECT * FROM briefings WHERE status = 'failed' ORDER BY generated_at DESC;
```

## 🚨 **Dépannage**

### **Problème : Cron Jobs ne se déclenchent pas**
```sql
-- Vérifier les cron jobs
SELECT * FROM cron.job WHERE jobname LIKE 'emma-%';

-- Redémarrer les cron jobs
SELECT cron.unschedule('emma-morning-direct');
SELECT cron.schedule('emma-morning-direct', '0 13 * * 1-5', 'SELECT send_morning_briefing_direct();');
```

### **Problème : Emails non envoyés**
```sql
-- Vérifier la configuration
SELECT * FROM briefing_config;

-- Tester manuellement
SELECT send_morning_briefing_direct();

-- Vérifier les erreurs
SELECT * FROM briefings WHERE status = 'failed' ORDER BY generated_at DESC LIMIT 5;
```

### **Problème : API Vercel non accessible**
```sql
-- Vérifier l'URL
SELECT get_config('vercel_api_url');

-- Tester la connectivité
SELECT test_resend_system();
```

## 📊 **Monitoring Avancé**

### **Dashboard de Monitoring**
```sql
-- Vue d'ensemble
SELECT 
  type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(COUNT(*) FILTER (WHERE status = 'sent') * 100.0 / COUNT(*), 2) as success_rate
FROM briefings 
WHERE generated_at >= NOW() - INTERVAL '7 days'
GROUP BY type
ORDER BY type;
```

### **Alertes Automatiques**
```sql
-- Fonction d'alerte en cas d'échec
CREATE OR REPLACE FUNCTION check_briefing_health()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  failed_count INTEGER;
  result JSON;
BEGIN
  SELECT COUNT(*) INTO failed_count
  FROM briefings 
  WHERE status = 'failed' 
  AND generated_at >= NOW() - INTERVAL '1 hour';
  
  IF failed_count > 0 THEN
    SELECT json_build_object(
      'alert', true,
      'message', 'Attention: ' || failed_count || ' briefings ont échoué dans la dernière heure',
      'failed_count', failed_count,
      'timestamp', NOW()
    ) INTO result;
  ELSE
    SELECT json_build_object(
      'alert', false,
      'message', 'Tous les briefings fonctionnent correctement',
      'timestamp', NOW()
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$$;
```

## 🎯 **Prochaines Étapes**

1. **Exécuter** `supabase-resend-direct.sql` dans Supabase
2. **Configurer** les variables dans `briefing_config`
3. **Tester** avec `test_resend_system()`
4. **Vérifier** les cron jobs
5. **Monitorer** les premiers envois

## 📞 **Support**

En cas de problème :
1. Vérifier les logs Supabase
2. Tester manuellement les fonctions
3. Vérifier la configuration Resend
4. Contacter le support si nécessaire

---

**🎉 Votre système d'automatisation Emma En Direct sera opérationnel !**
