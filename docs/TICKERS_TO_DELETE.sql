-- Script de suppression de 9 tickers
-- Généré le 2026-01-11T01:56:16.440Z

-- LVMH Moët Hennessy - Louis Vuitton, Société Européenne (FR, PAR)
UPDATE tickers SET is_active = false WHERE ticker = 'MC.PA';
-- L'Oréal S.A. (FR, PAR)
UPDATE tickers SET is_active = false WHERE ticker = 'OR.PA';
-- Sunteck Realty Limited (IN, BSE)
UPDATE tickers SET is_active = false WHERE ticker = 'TECK.B';
-- SoftBank Group Corp. (JP, JPX)
UPDATE tickers SET is_active = false WHERE ticker = '9984.T';
-- Samsung Electronics Co., Ltd. (KR, IOB)
UPDATE tickers SET is_active = false WHERE ticker = 'SMSN.IL';
-- N/A (N/A, N/A)
UPDATE tickers SET is_active = false WHERE ticker = 'HSBA';
-- N/A (N/A, N/A)
UPDATE tickers SET is_active = false WHERE ticker = 'LVMH';
-- N/A (N/A, N/A)
UPDATE tickers SET is_active = false WHERE ticker = 'NESN';
-- N/A (N/A, N/A)
UPDATE tickers SET is_active = false WHERE ticker = 'ULVR';