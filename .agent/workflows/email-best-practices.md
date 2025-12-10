---
description: How to create Outlook-compatible HTML emails (universal email client support)
---

# Bonnes Pratiques HTML Email - Template Universel

Ce workflow définit les bonnes pratiques pour créer des emails HTML compatibles avec TOUS les clients email (Gmail, Outlook, Apple Mail, mobile).

## Règles Absolues

### ✅ À UTILISER

1. **Tables pour layout** (pas de divs)

   ```html
   <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px;">
   ```

2. **Styles 100% inline** (pas de <style> dans <head>)

   ```html
   <td style="font-family: Arial, Helvetica, sans-serif; color: #333333; padding: 20px;">
   ```

3. **Couleurs hexadécimales complètes**

   ```html
   style="color: #FFFFFF; background-color: #333333;"
   ```

4. **Font stack email-safe**

   ```html
   font-family: Arial, Helvetica, sans-serif;
   ```

5. **Images avec dimensions explicites**

   ```html
   <img src="..." alt="Description" width="24" height="24" style="display: block; border: 0;">
   ```

6. **Espaceurs verticaux**

   ```html
   <tr><td style="height: 20px; line-height: 20px;">&nbsp;</td></tr>
   ```

### ❌ À NE PAS UTILISER

- `<div>` pour structure
- `display: flex` ou `inline-flex`
- `display: grid`
- `linear-gradient`
- `box-shadow`
- `border-radius > 4px`
- `margin` (utiliser padding)
- CSS dans `<style>` tag
- Classes CSS
- `onerror` JavaScript

## Template Emma Universel

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Emma Agent</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 20px 0;">
                
                <!-- CONTENEUR PRINCIPAL -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff;">
                    
                    <!-- HEADER -->
                    <tr>
                        <td style="background-color: #5B3A70; color: #ffffff; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
                            Emma Agent - Titre
                        </td>
                    </tr>
                    
                    <!-- CONTENT -->
                    <tr>
                        <td style="padding: 20px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size: 14px; color: #333333; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                                        Contenu du message ici...
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- FOOTER -->
                    <tr>
                        <td style="padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #e0e0e0;">
                            Emma Agent - GOB Apps
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>
```

## Fichiers Concernés

Les fichiers suivants dans le projet GOB génèrent des emails HTML et DOIVENT respecter ces règles:

1. `api/cron-briefings.js` - `createBriefingHTML()`
2. `api/emma-briefing.js` - `generateEmailHtml()`
3. `lib/channel-adapter.js` - `adaptForEmail()`
4. `api/send-email.js` - Documentation des attentes du paramètre `html`

## Outils de Test

1. Envoyer un test vers:
   - Gmail personnel
   - Outlook.com
   - Outlook desktop
   - Mail mobile (iOS/Android)

2. Services de test (optionnel):
   - Litmus (payant)
   - Email on Acid (payant)
   - MailTrap (gratuit, preview basique)
