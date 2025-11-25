# Migration 006: Create finance_snapshots Table

## ⚠️ IMPORTANT: Exécuter cette migration dans le Supabase SQL Editor

### Étapes :

1. **Allez sur** : https://supabase.com/dashboard
2. **Sélectionnez** votre projet "gob-watchlist"
3. **Cliquez** sur "SQL Editor" dans la barre latérale
4. **Créez** une nouvelle query
5. **Copiez-collez** le SQL ci-dessous
6. **Exécutez** (Run)

---

## SQL à exécuter :

```sql
-- Create finance_snapshots table
CREATE TABLE IF NOT EXISTS public.finance_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    data JSONB NOT NULL,
    assumptions JSONB NOT NULL,
    info JSONB NOT NULL,
    notes TEXT,
    is_current BOOLEAN DEFAULT true,
    auto_fetched BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_finance_snapshots_ticker ON public.finance_snapshots(ticker);
CREATE INDEX IF NOT EXISTS idx_finance_snapshots_is_current ON public.finance_snapshots(is_current);
CREATE INDEX IF NOT EXISTS idx_finance_snapshots_created_at ON public.finance_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_snapshots_ticker_current ON public.finance_snapshots(ticker, is_current);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_finance_snapshots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER finance_snapshots_updated_at
    BEFORE UPDATE ON public.finance_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_finance_snapshots_updated_at();

-- Enable RLS
ALTER TABLE public.finance_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all for authenticated users" ON public.finance_snapshots
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow read for anonymous" ON public.finance_snapshots
    FOR SELECT
    USING (true);
```

---

## Vérification :

Après l'exécution, vérifiez que la table existe :

```sql
SELECT * FROM public.finance_snapshots LIMIT 1;
```

Vous devriez voir : "Success. No rows returned"

---

## Ensuite :

Une fois la table créée, relancez le bulk-load :

```bash
cd scripts
npm run bulk-load
```

Cela devrait maintenant fonctionner ! ✅
