-- Seed: Default emma_prompt_sections
-- Description: Insère les sections par défaut pour l'interface Emma
-- Date: 2025-01-XX

-- Supprimer les sections existantes si elles existent (pour réinitialisation)
-- DELETE FROM emma_prompt_sections; -- Décommenter si besoin de réinitialiser

-- Section 1: Emma Expert (Prompt Système)
INSERT INTO emma_prompt_sections (
  name, icon, placeholder, button_color, button_hover_color,
  prompt_type, prompt_key, inputs, order_index, is_active
) VALUES (
  'Emma Expert (Prompt Système)',
  '👩‍💼',
  'Posez votre question...',
  'bg-gray-800',
  'hover:bg-gray-700',
  'existing',
  'prompts.expertSystem',
  '[{"name": "query", "placeholder": "Posez votre question...", "type": "text", "width": "flex-1"}]'::jsonb,
  0,
  true
) ON CONFLICT DO NOTHING;

-- Section 2: Question Générale (LLM Standard)
INSERT INTO emma_prompt_sections (
  name, icon, placeholder, button_color, button_hover_color,
  prompt_type, prompt_key, inputs, order_index, is_active
) VALUES (
  'Question Générale (LLM Standard)',
  '🤖',
  'Question générale sans contexte financier strict...',
  'bg-blue-600',
  'hover:bg-blue-700',
  'existing',
  'prompts.generalAssistant',
  '[{"name": "query", "placeholder": "Question générale sans contexte financier strict...", "type": "text", "width": "flex-1"}]'::jsonb,
  1,
  true
) ON CONFLICT DO NOTHING;

-- Section 3: Analyse Rapide de Titre
INSERT INTO emma_prompt_sections (
  name, icon, placeholder, button_color, button_hover_color,
  prompt_type, prompt_key, inputs, order_index, is_active
) VALUES (
  'Analyse Rapide de Titre',
  '📈',
  'Analyse institutionnelle complète',
  'bg-emerald-600',
  'hover:bg-emerald-700',
  'existing',
  'prompts.institutionalAnalysis',
  '[
    {"name": "stockTitle", "placeholder": "Nom (ex: Apple)", "type": "text", "width": "flex-1"},
    {"name": "stockTicker", "placeholder": "Ticker (ex: AAPL)", "type": "text", "width": "w-32"}
  ]'::jsonb,
  2,
  true
) ON CONFLICT DO NOTHING;

-- Section 4: Recherche d'Actualités
INSERT INTO emma_prompt_sections (
  name, icon, placeholder, button_color, button_hover_color,
  prompt_type, prompt_key, inputs, order_index, is_active
) VALUES (
  'Recherche d''Actualités',
  '📰',
  'Sujet (ex: Intelligence Artificielle, Taux d''intérêt)',
  'bg-purple-600',
  'hover:bg-purple-700',
  'existing',
  'prompts.newsSearch',
  '[{"name": "newsQuery", "placeholder": "Sujet (ex: Intelligence Artificielle, Taux d''intérêt)", "type": "text", "width": "flex-1"}]'::jsonb,
  3,
  true
) ON CONFLICT DO NOTHING;

-- Section 5: Comparaison de Titres
INSERT INTO emma_prompt_sections (
  name, icon, placeholder, button_color, button_hover_color,
  prompt_type, prompt_key, inputs, order_index, is_active
) VALUES (
  'Comparaison de Titres',
  '⚖️',
  'Tickers (ex: AAPL, MSFT, GOOGL)',
  'bg-orange-600',
  'hover:bg-orange-700',
  'existing',
  'prompts.tickerComparison',
  '[{"name": "compareTickers", "placeholder": "Tickers (ex: AAPL, MSFT, GOOGL)", "type": "text", "width": "flex-1"}]'::jsonb,
  4,
  true
) ON CONFLICT DO NOTHING;

-- Vérification
SELECT 
  name, 
  icon, 
  prompt_type, 
  prompt_key, 
  order_index,
  is_active
FROM emma_prompt_sections
ORDER BY order_index;

