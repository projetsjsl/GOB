-- ============================================================================
-- MISE À JOUR DES MÉTRIQUES VALUELINE
-- Généré automatiquement depuis valueline.xlsx
-- Date: 2025-12-03T22:07:56.863Z
-- ============================================================================
-- 
-- Ce script met à jour les métriques ValueLine pour tous les tickers
-- Source: ValueLine au 3 décembre 2025
-- 
-- IMPORTANT: Exécuter d'abord supabase-add-valueline-metrics.sql si les colonnes n'existent pas
-- ============================================================================

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '85',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'A';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '5',
    persistence = '30',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AA';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '5',
    persistence = '5',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AAL';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '55',
    persistence = '85',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AAON';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '85',
    persistence = '100',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AAPL';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '75',
    persistence = '80',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ABBNY';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '90',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ABBV';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '15',
    persistence = '15',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ABNB';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '75',
    persistence = '70',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ABT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '80',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ACGL';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '50',
    persistence = '35',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ACI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '90',
    persistence = '85',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ACM';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    persistence = '95',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ACN';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '60',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ADBE';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '100',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ADI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '55',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ADM';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '100',
    persistence = '95',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ADP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '70',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ADSK';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '35',
    persistence = '20',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ADT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '65',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AEE';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '55',
    persistence = '75',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AEIS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '45',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AEM';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '45',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AEP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '65',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AER';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '15',
    persistence = '40',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AES';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '65',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AFG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '90',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AFL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '70',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AGCO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '30',
    persistence = '40',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AIG';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '90',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AIT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '50',
    persistence = '80',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AIZ';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '100',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AJG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '55',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AKAM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '40',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ALB';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '85',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ALC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '40',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ALGN';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '5',
    persistence = '90',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ALL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '75',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ALLE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '60',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ALLY';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '40',
    persistence = '90',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ALNY';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '65',
    persistence = '65',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ALSN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '50',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ALV';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '75',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AM';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '90',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AMAT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '10',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AMCR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '95',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AMD';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '95',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AME';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '15',
    persistence = '35',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AMG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '70',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AMGN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '70',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AMH';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '40',
    persistence = '80',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AMKR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '25',
    persistence = '95',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AMP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '45',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AMT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '40',
    persistence = '35',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AMX';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '45',
    persistence = '75',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AMZN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '70',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '100',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ANET';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '95',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AON';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '70',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AOS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '15',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'APA';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    persistence = '65',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'APD';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '15',
    persistence = '90',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'APG';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '85',
    persistence = '100',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'APH';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '5',
    persistence = '95',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'APO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '15',
    persistence = '85',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'APPF';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '35',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'APTV';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '15',
    persistence = '40',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '25',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ARE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '100',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ARES';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '15',
    persistence = '35',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ARMK';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '80',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ARW';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '95',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ASML';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '75',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ATD.TO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '20',
    persistence = '60',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ATI';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '65',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ATO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '70',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ATR';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '25',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ATRL.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '80',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ATZ.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '25',
    persistence = '60',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AU';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '90',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AVAV';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '25',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AVB';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '45',
    persistence = '95',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AVGO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '35',
    persistence = '25',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AVTR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '80',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AVY';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '85',
    persistence = '65',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AWI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '50',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AWK';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '90',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AXON';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '60',
    persistence = '95',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AXP';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '10',
    persistence = '35',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AXS';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '75',
    persistence = '70',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AXSM';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '30',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AXTA';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '45',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AYI';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '80',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AZN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '90',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AZO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '30',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'B';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '15',
    persistence = '25',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BA';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '85',
    persistence = '20',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BABA';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '70',
    persistence = '80',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BAC';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '100',
    persistence = '90',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BAH';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '35',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BALL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '20',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BAX';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '5',
    persistence = '45',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BBDB.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '45',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BBY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '10',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BCE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '35',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BDX';

UPDATE tickers 
SET 
    security_rank = 'C+',
    earnings_predictability = '35',
    persistence = '40',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BE';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '45',
    persistence = '10',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BEN';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '55',
    persistence = '45',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BFAM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '35',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BFB';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '45',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BG';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '5',
    persistence = '50',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BHP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '10',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BIIB';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '35',
    persistence = '10',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BILL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '45',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BIO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '50',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BIP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '100',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BJ';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '90',
    persistence = '35',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BK';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '15',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BKH';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '15',
    persistence = '75',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BKNG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '10',
    persistence = '65',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BKR';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '85',
    persistence = '95',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BLD';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '95',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BLDR';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '95',
    persistence = '90',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BLK';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '100',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BMI';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '50',
    persistence = '65',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BMO.TO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '15',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BMRN';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '5',
    persistence = '20',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BMY';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '30',
    persistence = '100',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BN';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '80',
    persistence = '10',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BNS.TO';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '5',
    persistence = '40',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BNTX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '45',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BOKF';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '50',
    persistence = '90',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BOOT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '5',
    persistence = '20',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '95',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BPOP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '95',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BR';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '90',
    persistence = '95',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BRKB';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '70',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BRKR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '95',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BRO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '85',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BSX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '40',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BSY';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '10',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BTI';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '30',
    persistence = '10',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BUD';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '65',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BURL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '10',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BWA';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '80',
    persistence = '65',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BWXT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '35',
    persistence = '95',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BX';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '35',
    persistence = '5',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BXP';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '90',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'BYD';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '50',
    persistence = '25',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'C';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '60',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CACC';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '85',
    persistence = '90',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CACI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '50',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CAE.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '15',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CAG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '45',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CAH';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '50',
    persistence = '20',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CAJPY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '90',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CARR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '85',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CASY';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '65',
    persistence = '95',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CAT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '75',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CB';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '45',
    persistence = '75',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CBOE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '95',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CBRE';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '75',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CBSH';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '75',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CCEP';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '70',
    persistence = '30',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CCI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '80',
    persistence = '60',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CCK';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '15',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CCL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '55',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CCLB.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '80',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CCO.TO';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '25',
    persistence = '20',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CDE';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '100',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CDNS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '90',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CDW';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '30',
    persistence = '80',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CELH';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '65',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CF';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '40',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CFG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '55',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CFR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '5',
    persistence = '85',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '25',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CGNX';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '70',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CHD';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '30',
    persistence = '90',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CHDN';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '70',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CHE';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    persistence = '70',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CHKP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '50',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CHRW';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '70',
    persistence = '35',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CHTR';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '35',
    persistence = '25',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CHWY';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '85',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '75',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CIEN';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '60',
    persistence = '70',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CINF';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '40',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CL';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '15',
    persistence = '60',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CLF';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '60',
    persistence = '90',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CLH';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '45',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CLS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '20',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CLX';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '80',
    persistence = '40',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CM.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '20',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CMA';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '80',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CMC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '25',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CMCSA';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '75',
    persistence = '65',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CME';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '90',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CMG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '90',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CMI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '55',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CMS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '30',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CNA';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '80',
    persistence = '45',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CNC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '45',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CNH';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '90',
    persistence = '60',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CNI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '40',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CNP';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '25',
    persistence = '50',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CNQ.TO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '5',
    persistence = '55',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CNX';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '25',
    persistence = '70',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'COF';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '65',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'COHR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '90',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'COKE';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '70',
    persistence = '5',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'COLB';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '60',
    persistence = '60',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'COO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '15',
    persistence = '50',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'COP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '70',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'COR';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    persistence = '90',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'COST';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '85',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CP';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '85',
    persistence = '65',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CPAY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '20',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CPB';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '95',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CPRT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '40',
    persistence = '45',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CPT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '25',
    persistence = '75',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CQP';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '20',
    persistence = '55',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CRL';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '25',
    persistence = '80',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CRM';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '55',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CRS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '75',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CRUS';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '20',
    persistence = '75',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CRWD';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '85',
    persistence = '65',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CSCO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '70',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CSGP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '85',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CSL';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '60',
    persistence = '95',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CSU.TO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '85',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CSX';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '95',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CTAS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '20',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CTCA.TO';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '95',
    persistence = '25',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CTSH';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '75',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CTVA';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '65',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CUBE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '40',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CVE.TO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '15',
    persistence = '55',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CVNA';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '15',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CVS';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '5',
    persistence = '50',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CVX';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '75',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CW';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '95',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CWST';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '25',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CX';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '20',
    persistence = '100',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'CYBR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '15',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'D';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '25',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DAL';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '40',
    persistence = '65',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DAR';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '20',
    persistence = '30',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DASH';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '25',
    persistence = '40',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DAY';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '80',
    persistence = '40',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DBX';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '80',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DCI';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '35',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DD';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '85',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DDOG';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '5',
    persistence = '70',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DDS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '95',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DE';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '90',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DECK';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '85',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DELL';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '85',
    persistence = '30',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DEO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '40',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '80',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DGX';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '90',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DHI';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '60',
    persistence = '75',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DHR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '10',
    persistence = '30',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DINO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '10',
    persistence = '25',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DIS';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '60',
    persistence = '25',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DKNG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '75',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DKS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '60',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DLB';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '55',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DLR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '35',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DLTR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '30',
    persistence = '10',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DOC';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '30',
    persistence = '40',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DOCU';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '95',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DOL.TO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '95',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DOV';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '20',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DOW';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '55',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DOX';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '95',
    persistence = '70',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DPZ';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '90',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DRI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '30',
    persistence = '55',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '30',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DTE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '55',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DTEGY';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '50',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DUK';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '70',
    persistence = '65',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DVA';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '30',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DVN';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '55',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DXCM';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '50',
    persistence = '50',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'DY';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '65',
    persistence = '75',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EA';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '40',
    persistence = '40',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EAT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '70',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EBAY';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '65',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ECL';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    persistence = '45',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ED';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '45',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EFN.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '70',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EFX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '65',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EG';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '80',
    persistence = '55',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EHC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '20',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EIX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '35',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EL';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '5',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ELAN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '50',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ELS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '70',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ELV';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '30',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EMA.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '30',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EMBJ';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '95',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EME';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '50',
    persistence = '25',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EMN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '60',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EMPA.TO';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '75',
    persistence = '100',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EMR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '25',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ENB.TO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '65',
    persistence = '45',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ENS';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '75',
    persistence = '70',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ENTG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '45',
    persistence = '50',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EOG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '50',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EPAM';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '25',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EPD';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '95',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EQH';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '70',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EQIX';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '15',
    persistence = '40',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EQNR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '60',
    persistence = '20',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EQR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '65',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EQT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '25',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ERIC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '75',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ERIE';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '25',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ES';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '80',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ESE';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '35',
    persistence = '85',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ESI';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '80',
    persistence = '80',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ESLT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '25',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ESS';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '10',
    persistence = '40',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ESTC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '30',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ET';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '100',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ETN';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '60',
    persistence = '55',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ETR';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '50',
    persistence = '50',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ETSY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '80',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EVR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '25',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EVRG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '50',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EW';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '65',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EWBC';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '45',
    persistence = '35',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EXAS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '40',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EXC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '45',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EXEL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '90',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EXLS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '70',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EXP';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '60',
    persistence = '90',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EXPD';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '30',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EXPE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '75',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'EXR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '15',
    persistence = '25',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'F';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '60',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FAF';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '55',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FANG';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    persistence = '90',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FAST';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '35',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FBIN';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '70',
    persistence = '70',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FCFS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '85',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FCN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '100',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FCNCA';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '80',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FCX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '80',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FDS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '50',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FDX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '30',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FE';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '5',
    persistence = '45',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FFH.TO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '65',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FFIV';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '30',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FHN';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '100',
    persistence = '90',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FICO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '25',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FIS';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '100',
    persistence = '80',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FISV';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '65',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FITB';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '60',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FIVE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '100',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FIX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '60',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FLEX';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '5',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FLG';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '25',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FLR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '25',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FLS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '5',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FMS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '90',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FN';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '65',
    persistence = '75',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FND';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '45',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FNF';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '60',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FNV';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '70',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FOUR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '40',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FOXA';

UPDATE tickers 
SET 
    security_rank = 'C+',
    earnings_predictability = '25',
    persistence = '65',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FRO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '50',
    persistence = '5',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FRT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '15',
    persistence = '85',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FSLR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '95',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FSS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '90',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FSV';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '15',
    persistence = '85',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FTAI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '25',
    persistence = '100',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FTI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '100',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FTNT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '50',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FTS.TO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '60',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FTT.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '25',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FTV';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '75',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'FUJIY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '55',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'G';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '10',
    persistence = '15',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GAP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '90',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GATX';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    persistence = '60',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GD';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '40',
    persistence = '75',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GDDY';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '35',
    persistence = '10',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '35',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GEN';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '90',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GFL';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '90',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GGG';

UPDATE tickers 
SET 
    security_rank = 'C++',
    earnings_predictability = '50',
    persistence = '25',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GH';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '80',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GIBA.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '25',
    persistence = '45',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GIL';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '20',
    persistence = '30',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GILD';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '30',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GIS';

UPDATE tickers 
SET 
    security_rank = 'C++',
    earnings_predictability = '40',
    persistence = '70',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GKOS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '65',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GL';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '90',
    persistence = '65',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GLPI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '70',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GLW';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '45',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GM';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '30',
    persistence = '50',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GME';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '75',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GMED';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '60',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GNRC';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '70',
    persistence = '100',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GOOG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '55',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GPC';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '65',
    persistence = '90',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GPI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '30',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GPN';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '85',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GRMN';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '50',
    persistence = '85',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GS';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '35',
    persistence = '40',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GSAT';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '45',
    persistence = '10',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GSK';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '65',
    persistence = '40',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GTES';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '65',
    persistence = '80',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GTLS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '40',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GWO.TO';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '25',
    persistence = '65',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GWRE';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '90',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'GWW';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '10',
    persistence = '75',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'H';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '20',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HAL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '10',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HAS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '35',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HBAN';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '40',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HBM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '95',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HCA';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '90',
    persistence = '95',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HD';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '85',
    persistence = '95',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HEI';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '95',
    persistence = '60',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HESM';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '5',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HHH';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '70',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HIG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '35',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HII';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '35',
    persistence = '65',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HIMS';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '35',
    persistence = '40',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HL';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '60',
    persistence = '100',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HLI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '85',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HLNE';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '15',
    persistence = '95',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HLT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '50',
    persistence = '15',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HMC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '65',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HOLX';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '95',
    persistence = '85',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HON';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '35',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HPE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '75',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HPQ';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '70',
    persistence = '55',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HQY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '5',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '50',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HRB';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '20',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HRL';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '25',
    persistence = '30',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HSBC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '30',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HSIC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '15',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HST';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '90',
    persistence = '65',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HSY';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '45',
    persistence = '100',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HTHIY';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '90',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HUBB';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '35',
    persistence = '95',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HUBS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '55',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HUM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '15',
    persistence = '40',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HWC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '100',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HWM';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '35',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'HXL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '85',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IBKR';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '85',
    persistence = '30',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IBM';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '80',
    persistence = '80',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IBP';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '90',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ICE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '80',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ICLR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '50',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IDA';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '40',
    persistence = '40',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IDCC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '75',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IDXX';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '35',
    persistence = '90',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IESC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '70',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IEX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '5',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IFF';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '20',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IGM.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '10',
    persistence = '60',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IHG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '25',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ILMN';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '50',
    persistence = '75',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IMBBY';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '20',
    persistence = '55',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IMO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '15',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'INCY';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '75',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'INFY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '30',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'INGR';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '75',
    persistence = '65',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'INSM';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '30',
    persistence = '15',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'INTC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '100',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'INTU';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '55',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'INVH';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '15',
    persistence = '20',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IONS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '15',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IP';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '90',
    persistence = '75',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IQV';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '90',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IR';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '90',
    persistence = '60',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IRM';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '60',
    persistence = '65',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IRTC';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '75',
    persistence = '95',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ISRG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '90',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '95',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ITT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '85',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ITW';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '15',
    persistence = '10',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'IVZ';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '100',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'J';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '30',
    persistence = '10',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'JAZZ';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '75',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'JBHT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '95',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'JBL';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '85',
    persistence = '55',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'JBTM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '80',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'JCI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '75',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'JEF';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '35',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'JHG';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '55',
    persistence = '60',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'JHX';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    persistence = '65',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'JKHY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '70',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'JLL';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '100',
    persistence = '55',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'JNJ';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '70',
    persistence = '95',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'JPM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '20',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'K';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '95',
    persistence = '90',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KBR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '45',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KDP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '45',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KEX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '25',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KEY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '85',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KEYS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '55',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KGC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '10',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KHC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '30',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KIM';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '60',
    persistence = '100',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KKR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '100',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KLAC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '25',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KMB';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '30',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KMI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '55',
    persistence = '40',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KMX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '95',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KNSL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '55',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KNX';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    persistence = '65',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '65',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KR';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '30',
    persistence = '65',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'KTOS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '25',
    persistence = '65',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'L';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '65',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'L.TO';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '60',
    persistence = '80',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LAD';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '65',
    persistence = '85',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LAMR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '85',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LDOS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '10',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LEA';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '95',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LECO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '80',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LEN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '25',
    persistence = '15',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LEVI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '70',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LFUS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '75',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LH';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '45',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LHX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '80',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LII';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    persistence = '90',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LIN';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '10',
    persistence = '50',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LITE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '45',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LKQ';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '65',
    persistence = '95',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LLY';

UPDATE tickers 
SET 
    security_rank = 'C++',
    earnings_predictability = '65',
    persistence = '15',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LMND';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '70',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LMT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '10',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LNC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '90',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LNG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '50',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LNT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '80',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LOGI';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '80',
    persistence = '100',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LOW';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '65',
    persistence = '100',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LPLA';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '35',
    persistence = '100',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LPX';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '100',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LRCX';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '50',
    persistence = '75',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LSCC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '60',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LULU';

UPDATE tickers 
SET 
    security_rank = 'C+',
    earnings_predictability = '10',
    persistence = '5',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LUMN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '80',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LUN.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '10',
    persistence = '5',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LUV';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '15',
    persistence = '15',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LVS';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '40',
    persistence = '45',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LW';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '20',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LYB';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '30',
    persistence = '10',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LYFT';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '20',
    persistence = '95',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'LYV';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '15',
    persistence = '10',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'M';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '90',
    persistence = '95',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MA';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '60',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MAA';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '45',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MAIN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '85',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MANH';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '80',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MAR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '75',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MAS';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '15',
    persistence = '50',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MASI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '30',
    persistence = '30',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MAT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '25',
    persistence = '20',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MBGAF';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '85',
    persistence = '90',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MCD';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '80',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MCHP';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '70',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MCK';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '90',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MCO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '5',
    persistence = '20',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MCY';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '50',
    persistence = '60',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MDB';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '55',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MDLZ';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '80',
    persistence = '20',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MDT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '100',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MEDP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '25',
    persistence = '90',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MELI';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '65',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MET';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '55',
    persistence = '75',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'META';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '55',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MFC';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '50',
    persistence = '30',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MGA';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '55',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MGM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '5',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MHK';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '30',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MIDD';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '45',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MKC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '75',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MKL';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '55',
    persistence = '50',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MKSI';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '40',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MKTX';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '55',
    persistence = '75',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MLI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '95',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MLM';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '100',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MMC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '5',
    persistence = '15',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MMM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '95',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MMSI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '30',
    persistence = '55',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MMYT';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '90',
    persistence = '80',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MNST';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '10',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '60',
    persistence = '55',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MOD';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '65',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MOGA';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '85',
    persistence = '85',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MOH';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '35',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MOS';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '25',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '65',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MPC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '35',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MPLX';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '70',
    persistence = '100',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MPWR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '40',
    persistence = '55',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MRK';

UPDATE tickers 
SET 
    security_rank = 'C+',
    earnings_predictability = '5',
    persistence = '45',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MRNA';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '75',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MRU.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '100',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MRVL';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '70',
    persistence = '95',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '85',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MSA';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '95',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MSCI';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '100',
    persistence = '100',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MSFT';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '60',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MSGS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '100',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MSI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '10',
    persistence = '40',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '30',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MTB';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '40',
    persistence = '40',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MTCH';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '75',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MTD';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '40',
    persistence = '55',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MTDR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '70',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MTG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '80',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MTH';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '75',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MTSI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '95',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MTZ';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '90',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MU';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '60',
    persistence = '85',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'MUSA';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '100',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NA.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '65',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NBIX';

UPDATE tickers 
SET 
    security_rank = 'C++',
    earnings_predictability = '10',
    persistence = '15',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NCLH';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    persistence = '95',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NDAQ';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '80',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NDSN';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '95',
    persistence = '60',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NEE';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '50',
    persistence = '50',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NEM';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '45',
    persistence = '70',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NET';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '40',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NEU';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '30',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NFG';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '70',
    persistence = '75',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NFLX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '40',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NI';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '50',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NICE';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '60',
    persistence = '40',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NKE';

UPDATE tickers 
SET 
    security_rank = 'C+',
    earnings_predictability = '5',
    persistence = '5',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NLY';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '80',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NOC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '10',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NOK';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '15',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NOV';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '30',
    persistence = '95',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NOW';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '5',
    persistence = '70',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NRG';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '5',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NSANY';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '75',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NSC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '80',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NTAP';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '30',
    persistence = '45',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NTNX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '30',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NTR';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '50',
    persistence = '80',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NTRA';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '30',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NTRS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '40',
    persistence = '60',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NUE';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '45',
    persistence = '100',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NVDA';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '70',
    persistence = '100',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NVMI';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '90',
    persistence = '80',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NVO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '95',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NVR';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '60',
    persistence = '50',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NVS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '85',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NVT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '75',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NWSA';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '85',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NXPI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '80',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NXST';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '80',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'NYT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '20',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'O';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '80',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'OC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '95',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ODFL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '30',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'OGE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '60',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'OKE';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '40',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'OKTA';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '45',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'OLED';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '55',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'OLLI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '30',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'OMC';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '80',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ON';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '30',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ONB';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '100',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ONTO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '65',
    persistence = '55',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ORA';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '100',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ORCL';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '55',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ORI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '90',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ORLY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '85',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'OSK';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '30',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'OTEX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '90',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'OTIS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '20',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'OVV';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '10',
    persistence = '20',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'OXY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '10',
    persistence = '20',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PAA';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '30',
    persistence = '45',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PAAS';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '55',
    persistence = '80',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PAG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '100',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PANW';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '50',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PAYC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '90',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PAYX';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '20',
    persistence = '50',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PBR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '80',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PCAR';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '15',
    persistence = '20',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PCG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '65',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PCTY';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '85',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PCVX';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '65',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PEG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '45',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PEGA';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '30',
    persistence = '75',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PEN';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '60',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PEP';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '20',
    persistence = '25',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PFE';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '55',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PFG';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '15',
    persistence = '85',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PFGC';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '100',
    persistence = '80',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '45',
    persistence = '100',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PGR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '100',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PH';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '25',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PHG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '85',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PHM';

UPDATE tickers 
SET 
    security_rank = 'C+',
    earnings_predictability = '25',
    persistence = '75',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '20',
    persistence = '30',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PINS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '100',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PIPR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '85',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PKG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '65',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PLD';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '35',
    persistence = '65',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PLNT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '45',
    persistence = '50',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PLTR';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    persistence = '45',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PM';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '60',
    persistence = '65',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PNC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '85',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PNR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '25',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PNW';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '75',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PODD';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '60',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'POOL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '15',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'POR';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '65',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'POST';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '45',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PPC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '30',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PPG';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '45',
    persistence = '20',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PPL';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '15',
    persistence = '35',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PPL.TO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '35',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '80',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PRI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '80',
    persistence = '45',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PRIM';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '30',
    persistence = '35',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PRMB';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '75',
    persistence = '35',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PRU';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '45',
    persistence = '55',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PSA';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '70',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PSN';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '55',
    persistence = '40',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PSO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '35',
    persistence = '85',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PSTG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '5',
    persistence = '50',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PSX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '95',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PTC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '100',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PWR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '40',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'PYPL';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '80',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'QCOM';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '60',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'QGEN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '85',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'QLYS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '45',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'QRVO';

UPDATE tickers 
SET 
    security_rank = 'C+',
    earnings_predictability = '50',
    persistence = '5',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'QS';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '80',
    persistence = '45',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'QSR';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '20',
    persistence = '35',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'QXO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '10',
    persistence = '55',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'R';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '95',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RACE';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '90',
    persistence = '85',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RBA';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '75',
    persistence = '100',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RBC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '15',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RCIB.TO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '5',
    persistence = '40',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RCL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '20',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'REG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '60',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'REGN';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '70',
    persistence = '15',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'REYN';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '20',
    persistence = '40',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'REZI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '75',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RF';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '35',
    persistence = '50',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RGA';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '50',
    persistence = '60',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RGEN';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '75',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RGLD';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '70',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RHP';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '45',
    persistence = '55',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RIO';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '80',
    persistence = '100',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RJF';

UPDATE tickers 
SET 
    security_rank = 'C++',
    earnings_predictability = '20',
    persistence = '20',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RKT';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '40',
    persistence = '50',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '90',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RLI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '20',
    persistence = '80',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RMBS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '75',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RMD';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '15',
    persistence = '65',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RNR';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '45',
    persistence = '95',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ROAD';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '80',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ROK';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '10',
    persistence = '40',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ROKU';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '95',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ROL';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '95',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ROP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '75',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ROST';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '85',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RPM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '45',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RRC';

UPDATE tickers 
SET 
    security_rank = 'C++',
    earnings_predictability = '20',
    persistence = '70',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RRR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '90',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RRX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '100',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '100',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RSG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '60',
    persistence = '65',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RTX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '60',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RVTY';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '90',
    persistence = '90',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RY.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '10',
    persistence = '45',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'RYAAY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '100',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SAIA';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '80',
    persistence = '80',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SANM';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '45',
    persistence = '70',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SAP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '5',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SAP.TO';

UPDATE tickers 
SET 
    security_rank = 'C+',
    earnings_predictability = '5',
    persistence = '10',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SATS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '25',
    persistence = '50',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SBAC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '50',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SBUX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '85',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SCCO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '85',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SCHW';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '70',
    persistence = '100',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SCI';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '20',
    persistence = '55',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SE';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '35',
    persistence = '15',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SEE';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '50',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SEIC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '100',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SF';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '55',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SFM';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '55',
    persistence = '85',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SGI';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '5',
    persistence = '35',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SHEL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '75',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SHOP';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '95',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SHW';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '45',
    persistence = '55',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SIEGY';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '30',
    persistence = '20',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SIRI';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '60',
    persistence = '65',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SITE';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '20',
    persistence = '70',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SITM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '25',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SJM';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '55',
    persistence = '20',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SLB';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '80',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SLF.TO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '75',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SLM';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '50',
    persistence = '70',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SMCI';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '35',
    persistence = '60',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SMMT';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '30',
    persistence = '35',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SMTC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '75',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SNA';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '50',
    persistence = '25',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SNAP';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '10',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SNN';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '65',
    persistence = '10',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SNOW';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '100',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SNPS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '35',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SNV';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '100',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SNX';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '45',
    persistence = '35',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SNY';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '70',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '75',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SONY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '25',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SPG';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '95',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SPGI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '45',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SPOT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '100',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SPXC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '20',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SR';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '50',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SRE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '90',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SSD';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '70',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SSNC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '100',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'STE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '85',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'STLD';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '65',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'STM';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '85',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'STN.TO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '75',
    persistence = '100',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'STRL';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '35',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'STT';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '15',
    persistence = '95',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'STX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '100',
    persistence = '45',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'STZ';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '10',
    persistence = '40',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SU.TO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '40',
    persistence = '50',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SUI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '30',
    persistence = '60',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SUN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '20',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SWK';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '30',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SWKS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '20',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SWX';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '45',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SYF';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '95',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SYK';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '50',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'SYY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '10',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'T';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '25',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'T.TO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '35',
    persistence = '15',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TAK';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '10',
    persistence = '15',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TAP';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '60',
    persistence = '60',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TD.TO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '50',
    persistence = '95',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TDG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '85',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TDY';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '65',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TEAM';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '55',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TECH';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '60',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TECKB.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '25',
    persistence = '10',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TEF';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '100',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TEL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '85',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TER';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '90',
    persistence = '20',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TEVA';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '20',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TFC';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '55',
    persistence = '80',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TFII';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '25',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TFX';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '55',
    persistence = '50',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TGT';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '55',
    persistence = '85',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'THC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '10',
    persistence = '65',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'THG';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '30',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'THO';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '5',
    persistence = '20',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TIGO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '100',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TIH.TO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '35',
    persistence = '90',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TJX';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '80',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TKR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '60',
    persistence = '85',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TM';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '65',
    persistence = '90',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TMHC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '75',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TMO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '95',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TMUS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '70',
    persistence = '85',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TOL';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '60',
    persistence = '100',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TPL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '40',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TPR';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '15',
    persistence = '60',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TRGP';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '100',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TRI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '75',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TRMB';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '65',
    persistence = '35',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TROW';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '20',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TRP';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '95',
    persistence = '60',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TRU';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '65',
    persistence = '70',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TRV';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '40',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '95',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TSCO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '75',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TSEM';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '35',
    persistence = '75',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TSLA';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '75',
    persistence = '95',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TSM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '15',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TSN';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '90',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '55',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TTC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '95',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TTD';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '10',
    persistence = '35',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TTE';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '100',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TTEK';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '75',
    persistence = '50',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TTMI';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '15',
    persistence = '75',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TTWO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '90',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TW';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '50',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TWLO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '100',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TXN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '40',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TXNM';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '40',
    persistence = '95',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TXRH';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '75',
    persistence = '70',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TXT';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '95',
    persistence = '80',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'TYL';

UPDATE tickers 
SET 
    security_rank = 'C+',
    earnings_predictability = '55',
    persistence = '5',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'U';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '5',
    persistence = '30',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UAL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '20',
    persistence = '60',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UBER';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '25',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UDR';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '60',
    persistence = '85',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UFPI';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '10',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UGI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '50',
    persistence = '70',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UHALB';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '75',
    persistence = '40',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UHS';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '65',
    persistence = '75',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UI';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '80',
    persistence = '30',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '45',
    persistence = '75',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ULTA';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '60',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UMC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '85',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UNH';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '40',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UNM';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '95',
    persistence = '85',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UNP';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '40',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UPS';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '25',
    persistence = '45',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'URBN';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '85',
    persistence = '100',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'URI';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '75',
    persistence = '10',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'USB';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '35',
    persistence = '80',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'USFD';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '85',
    persistence = '70',
    price_stability = '55',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'UTHR';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '95',
    persistence = '95',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'V';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '40',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VALE';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '65',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VEEV';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '45',
    persistence = '15',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VFC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '75',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VICI';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '30',
    persistence = '50',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VIRT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '5',
    persistence = '60',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VLO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '90',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VMC';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '70',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VMI';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '5',
    persistence = '10',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VNO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '15',
    persistence = '55',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VNOM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '60',
    persistence = '45',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VNT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '5',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VOD';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '5',
    persistence = '85',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VOYA';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '90',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VRSK';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '60',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VRSN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '80',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VRT';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '5',
    persistence = '90',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VRTX';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '5',
    persistence = '70',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VST';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '25',
    persistence = '15',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VTR';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '10',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VTRS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '15',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'VZ';

UPDATE tickers 
SET 
    security_rank = 'C++',
    earnings_predictability = '5',
    persistence = '30',
    price_stability = '5',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'W';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '95',
    persistence = '50',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WAB';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '90',
    persistence = '100',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WAT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '25',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WBS';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '65',
    persistence = '65',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WCC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '45',
    persistence = '100',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WCN';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '15',
    persistence = '75',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WDAY';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '5',
    persistence = '25',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WDC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '55',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WEC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '40',
    persistence = '55',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WELL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '25',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WES';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '75',
    persistence = '40',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WEX';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '35',
    persistence = '30',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WFC';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '15',
    persistence = '70',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WFRD';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '55',
    persistence = '95',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WH';

UPDATE tickers 
SET 
    security_rank = 'B',
    earnings_predictability = '70',
    persistence = '85',
    price_stability = '20',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WING';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '60',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WIT';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '15',
    persistence = '55',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WIX';

UPDATE tickers 
SET 
    security_rank = 'C++',
    earnings_predictability = '45',
    persistence = '70',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WK';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '60',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WLK';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '100',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '50',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WMB';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '35',
    persistence = '10',
    price_stability = '50',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WMG';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '10',
    persistence = '85',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WMS';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '100',
    persistence = '85',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WMT';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '50',
    persistence = '60',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WN.TO';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '20',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WPC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '80',
    price_stability = '60',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WPM';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '70',
    persistence = '90',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WRB';

UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '65',
    persistence = '85',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WSM';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '95',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WSO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '100',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WSP.TO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '65',
    persistence = '70',
    price_stability = '45',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WST';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '80',
    persistence = '55',
    price_stability = '65',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WTFC';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '75',
    persistence = '30',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WTRG';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '90',
    persistence = '100',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WTS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '95',
    persistence = '90',
    price_stability = '90',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WTW';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '80',
    price_stability = '70',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WWD';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '30',
    persistence = '15',
    price_stability = '85',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WY';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '5',
    persistence = '15',
    price_stability = '35',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'WYNN';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '65',
    persistence = '90',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'X.TO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '50',
    price_stability = '95',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'XEL';

UPDATE tickers 
SET 
    security_rank = 'A++',
    earnings_predictability = '5',
    persistence = '35',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'XOM';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '50',
    persistence = '55',
    price_stability = '25',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'XPO';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '80',
    persistence = '95',
    price_stability = '75',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'XYL';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '15',
    persistence = '55',
    price_stability = '10',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'XYZ';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '95',
    persistence = '85',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'YUM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '45',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'YUMC';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '55',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'Z';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '85',
    persistence = '15',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ZBH';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '60',
    persistence = '65',
    price_stability = '40',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ZBRA';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '55',
    persistence = '40',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ZION';

UPDATE tickers 
SET 
    security_rank = 'B+',
    earnings_predictability = '25',
    persistence = '15',
    price_stability = '30',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ZM';

UPDATE tickers 
SET 
    security_rank = 'B++',
    earnings_predictability = '40',
    persistence = '75',
    price_stability = '15',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ZS';

UPDATE tickers 
SET 
    security_rank = 'A',
    earnings_predictability = '100',
    persistence = '70',
    price_stability = '80',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'ZTS';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- Note: price_growth sera NULL (normal, pas de colonne séparée dans Excel)
-- "Price Growth Persistence" est UNE SEULE métrique → va dans "persistence"

SELECT 
    ticker,
    security_rank,
    earnings_predictability,
    persistence,  -- ← Contient "Price Growth Persistence" (note numérique 5-100)
    price_stability,
    price_growth,  -- ← Sera NULL (normal, pas de données disponibles)
    valueline_updated_at
FROM tickers
WHERE valueline_updated_at IS NOT NULL
ORDER BY ticker
LIMIT 20;  -- Afficher les 20 premiers pour vérification

-- Statistiques de mise à jour
SELECT 
    COUNT(*) as total_tickers,
    COUNT(security_rank) as avec_security_rank,
    COUNT(earnings_predictability) as avec_earnings_predictability,
    COUNT(persistence) as avec_persistence,  -- Devrait être ~1009
    COUNT(price_stability) as avec_price_stability,
    COUNT(price_growth) as avec_price_growth  -- Devrait être 0 (normal)
FROM tickers
WHERE valueline_updated_at IS NOT NULL;
