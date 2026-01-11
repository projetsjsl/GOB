-- Script de suppression de 4 ETF et fonds
-- Généré le 2026-01-11T02:12:57.016Z

-- YieldMax BRK.B Option Income Strategy ETF (ETF)
UPDATE tickers SET is_active = false WHERE ticker = 'BRK.B';

-- WisdomTree True Developed International Fund (ETF)
UPDATE tickers SET is_active = false WHERE ticker = 'DOL';

-- VistaShares Electrification Supercycle ETF (ETF)
UPDATE tickers SET is_active = false WHERE ticker = 'POW';

-- Vanguard Total Stock Market Index Fund (Mutual Fund)
UPDATE tickers SET is_active = false WHERE ticker = 'VTSAX';