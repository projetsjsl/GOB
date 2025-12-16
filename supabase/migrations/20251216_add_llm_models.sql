-- Migration: Add LLM models table
-- File: supabase/migrations/20251216_add_llm_models.sql
create table if not exists emma_llm_models (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    provider text not null,
    -- e.g., 'openai', 'anthropic', 'gemini', 'perplexity'
    model_id text not null,
    -- model identifier used in API calls
    max_tokens integer not null default 2000,
    temperature numeric not null default 0.7,
    enabled boolean not null default true,
    description text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
-- Trigger to update updated_at on row change
create or replace function update_timestamp() returns trigger as $$ begin new.updated_at = now();
return new;
end;
$$ language plpgsql;
create trigger trg_update_timestamp before
update on emma_llm_models for each row execute function update_timestamp();