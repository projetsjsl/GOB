-- ============================================================================
-- AJOUT DE TICKERS À LA WATCHLIST SUPABASE
-- ============================================================================
-- Ce script ajoute tous les tickers fournis à la table `tickers` avec source='watchlist'
-- Gère les conflits: si un ticker existe déjà avec source='team', le met à 'both'
-- ============================================================================

-- Liste des tickers à ajouter (avec noms de compagnies)
INSERT INTO tickers (ticker, company_name, source, is_active, priority, currency, country, exchange, added_date, created_at, updated_at)
VALUES
    -- Tech US
    ('AAPL', 'Apple Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('MSFT', 'Microsoft Corporation', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('AMZN', 'Amazon.com Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('GOOGL', 'Alphabet Inc. (Google)', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('META', 'Meta Platforms Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('TSLA', 'Tesla Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('NVDA', 'NVIDIA Corporation', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('AMD', 'Advanced Micro Devices', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('QCOM', 'Qualcomm Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('CSCO', 'Cisco Systems Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('ORCL', 'Oracle Corporation', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('CRM', 'Salesforce Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('ADBE', 'Adobe Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('NOW', 'ServiceNow Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('SNOW', 'Snowflake Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('SHOP', 'Shopify Inc.', 'watchlist', true, 1, 'USD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('ZM', 'Zoom Video Communications', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('NFLX', 'Netflix Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('INTC', 'Intel Corporation', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    
    -- Finance US
    ('BRK.B', 'Berkshire Hathaway Inc. (Class B)', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('JPM', 'JPMorgan Chase & Co.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('BAC', 'Bank of America Corp.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('WFC', 'Wells Fargo & Company', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('C', 'Citigroup Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('GS', 'Goldman Sachs Group Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('MS', 'Morgan Stanley', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('V', 'Visa Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('MA', 'Mastercard Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('PYPL', 'PayPal Holdings Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('AXP', 'American Express Co.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    
    -- Healthcare US
    ('JNJ', 'Johnson & Johnson', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('PFE', 'Pfizer Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('MRK', 'Merck & Co. Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('BMY', 'Bristol Myers Squibb Co.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('LLY', 'Eli Lilly and Company', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('ABBV', 'AbbVie Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('UNH', 'UnitedHealth Group Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('ELV', 'Elevance Health Inc. (ex-Anthem)', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('CVS', 'CVS Health Corporation', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('WBA', 'Walgreens Boots Alliance Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    
    -- Consumer Goods US
    ('PG', 'Procter & Gamble Co.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('KO', 'The Coca-Cola Company', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('PEP', 'PepsiCo Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('MDLZ', 'Mondelez International Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('NSRGY', 'Nestlé S.A. (ADR)', 'watchlist', true, 1, 'USD', 'Switzerland', 'OTC', NOW(), NOW(), NOW()),
    ('DANOY', 'Danone S.A. (ADR)', 'watchlist', true, 1, 'USD', 'France', 'OTC', NOW(), NOW(), NOW()),
    ('LRLCY', 'L''Oréal S.A. (ADR)', 'watchlist', true, 1, 'USD', 'France', 'OTC', NOW(), NOW(), NOW()),
    ('UL', 'Unilever PLC', 'watchlist', true, 1, 'USD', 'United Kingdom', 'NYSE', NOW(), NOW(), NOW()),
    
    -- Retail US
    ('WMT', 'Walmart Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('COST', 'Costco Wholesale Corporation', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    ('TGT', 'Target Corporation', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('HD', 'The Home Depot Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('LOW', 'Lowe''s Companies Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('BBY', 'Best Buy Co. Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    
    -- Apparel US
    ('NKE', 'Nike Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('ADDYY', 'Adidas AG (ADR)', 'watchlist', true, 1, 'USD', 'Germany', 'OTC', NOW(), NOW(), NOW()),
    ('GPS', 'Gap Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('VFC', 'VF Corporation', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    
    -- Media & Entertainment US
    ('DIS', 'The Walt Disney Company', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('CMCSA', 'Comcast Corporation', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    
    -- Telecom US
    ('T', 'AT&T Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('VZ', 'Verizon Communications Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NYSE', NOW(), NOW(), NOW()),
    ('TMUS', 'T-Mobile US Inc.', 'watchlist', true, 1, 'USD', 'United States', 'NASDAQ', NOW(), NOW(), NOW()),
    
    -- Software International
    -- Note: SAP SE (Allemagne) - gardé, Saputo Inc. (Canada) sera ajouté séparément si nécessaire
    ('SAP', 'SAP SE', 'watchlist', true, 1, 'EUR', 'Germany', 'XETR', NOW(), NOW(), NOW()),
    
    -- Canada - Finance
    ('IFC', 'Intact Financial Corporation', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('POW', 'Power Corporation of Canada', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('MFC', 'Manulife Financial Corporation', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('SLF', 'Sun Life Financial Inc.', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('GWO', 'Great-West Lifeco Inc.', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    
    -- Canada - Industrials
    ('CNR', 'Canadian National Railway Company', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('CP', 'Canadian Pacific Kansas City Limited', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    
    -- Canada - Airlines
    ('AC', 'Air Canada', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('WJA', 'WestJet Airlines Ltd. (delistée)', 'watchlist', false, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    
    -- Canada - Aerospace
    ('BBD.B', 'Bombardier Inc. (Class B)', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    
    -- Canada - Tech
    ('GIB.A', 'CGI Inc. (Class A)', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    
    -- Canada - Retail
    ('ATD.B', 'Alimentation Couche-Tard Inc. (Class B)', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('L', 'Loblaw Companies Limited', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('MRU', 'Metro Inc.', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    -- Note: Saputo Inc. utilise le ticker SAP qui est déjà pris par SAP SE (Allemagne)
    -- Si nécessaire, utiliser un ticker alternatif ou une notation différente
    ('DOL', 'Dollarama Inc.', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    
    -- Canada - Mining
    ('RIO', 'Rio Tinto Group', 'watchlist', true, 1, 'USD', 'United Kingdom', 'NYSE', NOW(), NOW(), NOW()),
    ('ABX', 'Barrick Gold Corporation', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('TECK.B', 'Teck Resources Limited (Class B)', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    
    -- Canada - Energy
    ('SU', 'Suncor Energy Inc.', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('CNQ', 'Canadian Natural Resources Limited', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('IMO', 'Imperial Oil Limited', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    
    -- Canada - Pipelines
    ('ENB', 'Enbridge Inc.', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('TRP', 'TC Energy Corporation', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('PPL', 'Pembina Pipeline Corporation', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    
    -- Canada - Utilities
    ('AQN', 'Algonquin Power & Utilities Corp.', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('H', 'Hydro One Limited', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('FTS', 'Fortis Inc.', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('EMA', 'Emera Incorporated', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    
    -- Canada - Telecom
    ('RCI.B', 'Rogers Communications Inc. (Class B)', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    ('BCE', 'BCE Inc.', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW()),
    -- Note: TELUS Corporation utilise le ticker T qui est déjà pris par AT&T (US)
    -- TELUS peut être ajouté avec un ticker alternatif si nécessaire (ex: TU.TO)
    
    -- Canada - Media
    ('CCA', 'Cogeco Communications Inc.', 'watchlist', true, 1, 'CAD', 'Canada', 'TSX', NOW(), NOW(), NOW())
ON CONFLICT (ticker) DO UPDATE SET
    -- Si le ticker existe déjà avec source='team', le mettre à 'both'
    source = CASE 
        WHEN tickers.source = 'team' THEN 'both'
        WHEN tickers.source = 'both' THEN 'both'
        ELSE 'watchlist'
    END,
    -- Mettre à jour les autres champs si fournis
    company_name = COALESCE(EXCLUDED.company_name, tickers.company_name),
    country = COALESCE(EXCLUDED.country, tickers.country),
    exchange = COALESCE(EXCLUDED.exchange, tickers.exchange),
    currency = COALESCE(EXCLUDED.currency, tickers.currency),
    is_active = CASE 
        WHEN EXCLUDED.ticker = 'WJA' THEN false  -- WestJet est delistée
        ELSE COALESCE(EXCLUDED.is_active, tickers.is_active)
    END,
    updated_at = NOW();

-- ============================================================================
-- VÉRIFICATION DES RÉSULTATS
-- ============================================================================

-- Afficher les statistiques
SELECT 
    '✅ Tickers ajoutés/mis à jour' as status,
    COUNT(*) FILTER (WHERE source = 'watchlist') as watchlist_only,
    COUNT(*) FILTER (WHERE source = 'both') as both_team_watchlist,
    COUNT(*) FILTER (WHERE source = 'team') as team_only,
    COUNT(*) FILTER (WHERE is_active = true) as total_active,
    COUNT(*) FILTER (WHERE is_active = false) as total_inactive
FROM tickers
WHERE ticker IN (
    'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'NVDA', 'BRK.B', 'JPM', 'BAC',
    'WFC', 'C', 'GS', 'MS', 'V', 'MA', 'PYPL', 'AXP', 'JNJ', 'PFE', 'MRK', 'BMY',
    'LLY', 'ABBV', 'UNH', 'ELV', 'CVS', 'WBA', 'PG', 'KO', 'PEP', 'MDLZ', 'NSRGY',
    'DANOY', 'LRLCY', 'UL', 'WMT', 'COST', 'TGT', 'HD', 'LOW', 'BBY', 'NKE', 'ADDYY',
    'GPS', 'VFC', 'INTC', 'IFC', 'POW', 'CNR', 'CP', 'AC', 'WJA', 'BBD.B',
    'GIB.A', 'ATD.B', 'L', 'MRU', 'SAP', 'DOL', 'RIO', 'ABX', 'TECK.B', 'SU', 'CNQ',
    'IMO', 'ENB', 'TRP', 'PPL', 'AQN', 'H', 'FTS', 'EMA', 'CCA', 'AMD', 'QCOM', 'CSCO',
    'ORCL', 'SAP', 'CRM', 'ADBE', 'NOW', 'SNOW', 'SHOP', 'ZM', 'NFLX', 'DIS', 'CMCSA',
    'T', 'VZ', 'TMUS', 'RCI.B', 'BCE', 'T', 'MFC', 'SLF', 'GWO'
);

-- Afficher les tickers ajoutés récemment
SELECT 
    ticker,
    company_name,
    source,
    is_active,
    country,
    exchange,
    currency,
    updated_at
FROM tickers
WHERE ticker IN (
    'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'NVDA', 'BRK.B', 'JPM', 'BAC',
    'WFC', 'C', 'GS', 'MS', 'V', 'MA', 'PYPL', 'AXP', 'JNJ', 'PFE', 'MRK', 'BMY',
    'LLY', 'ABBV', 'UNH', 'ELV', 'CVS', 'WBA', 'PG', 'KO', 'PEP', 'MDLZ', 'NSRGY',
    'DANOY', 'LRLCY', 'UL', 'WMT', 'COST', 'TGT', 'HD', 'LOW', 'BBY', 'NKE', 'ADDYY',
    'GPS', 'VFC', 'INTC', 'IFC', 'POW', 'CNR', 'CP', 'AC', 'WJA', 'BBD.B',
    'GIB.A', 'ATD.B', 'L', 'MRU', 'SAP', 'DOL', 'RIO', 'ABX', 'TECK.B', 'SU', 'CNQ',
    'IMO', 'ENB', 'TRP', 'PPL', 'AQN', 'H', 'FTS', 'EMA', 'CCA', 'AMD', 'QCOM', 'CSCO',
    'ORCL', 'SAP', 'CRM', 'ADBE', 'NOW', 'SNOW', 'SHOP', 'ZM', 'NFLX', 'DIS', 'CMCSA',
    'T', 'VZ', 'TMUS', 'RCI.B', 'BCE', 'T', 'MFC', 'SLF', 'GWO'
)
ORDER BY 
    CASE source 
        WHEN 'both' THEN 1
        WHEN 'watchlist' THEN 2
        ELSE 3
    END,
    ticker ASC;

