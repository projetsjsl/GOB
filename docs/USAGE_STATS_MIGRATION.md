# Usage Stats Migration: Filesystem to Supabase

## Overview

This document describes the migration of Emma Agent's usage statistics from a filesystem-based JSON file to a Supabase database table.

## Problem

The original implementation used `config/usage_stats.json` to store tool usage statistics. This approach failed in Vercel's serverless environment due to:

- **Read-only filesystem**: Vercel's `/var/task/` directory is read-only
- **Error**: `EROFS: read-only file system, open '/var/task/config/usage_stats.json'`
- **Impact**: Statistics were not being saved, causing repeated errors in logs

## Solution

Migrated to Supabase database storage with the following components:

### 1. Database Table: `tool_usage_stats`

Created in `supabase-usage-stats.sql`:

```sql
CREATE TABLE tool_usage_stats (
    id UUID PRIMARY KEY,
    tool_id TEXT NOT NULL UNIQUE,
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    average_response_time_ms INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    success_rate DECIMAL(5,2) DEFAULT 0,
    error_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features**:
- Unique index on `tool_id` for fast lookups
- Index on `last_used` for performance queries
- Auto-updating `updated_at` timestamp via trigger
- Row Level Security (RLS) enabled with service role access
- JSONB field for error history

### 2. Code Changes: `api/emma-agent.js`

**Added**:
- Supabase client import
- `_initSupabase()`: Initializes Supabase client with service role
- Async `_loadUsageStats()`: Loads stats from database
- Async `_saveUsageStats()`: Upserts stats to database
- Stats loading in `processRequest()` on first use

**Modified**:
- Constructor: Initializes empty stats, loads asynchronously
- Save operation: Fire-and-forget async with error handling

### 3. Migration Steps

#### For Existing Deployments:

1. **Run SQL migration**:
   ```bash
   # In Supabase SQL Editor
   cat supabase-usage-stats.sql
   # Copy and execute the SQL
   ```

2. **Optional: Migrate existing data**:
   If you have valuable data in `config/usage_stats.json`:
   ```javascript
   // One-time migration script (run locally)
   const fs = require('fs');
   const { createSupabaseClient } = require('./lib/supabase-config.js');

   const stats = JSON.parse(fs.readFileSync('config/usage_stats.json', 'utf8'));
   const supabase = createSupabaseClient(true);

   for (const [toolId, data] of Object.entries(stats)) {
       await supabase.from('tool_usage_stats').upsert({
           tool_id: toolId,
           ...data
       });
   }
   ```

3. **Deploy updated code**:
   ```bash
   git add api/emma-agent.js supabase-usage-stats.sql
   git commit -m "fix: migrate usage stats to Supabase to fix EROFS error"
   git push origin main
   ```

4. **Verify in logs**:
   - No more `EROFS` errors
   - Should see: `⚠️ Supabase not available, stats not saved` only if env vars missing
   - Stats should persist across deployments

### 4. Environment Variables

Ensure these are set in Vercel:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Required for stats access
```

## Benefits

✅ **Serverless-compatible**: No filesystem writes required
✅ **Persistent**: Stats survive deployments and server restarts
✅ **Scalable**: Database can handle concurrent writes
✅ **Queryable**: Can analyze stats with SQL queries
✅ **Graceful degradation**: Works without Supabase (in-memory only)

## Rollback Plan

If issues occur:

1. The code gracefully falls back to in-memory stats if Supabase unavailable
2. No data loss - stats are optional for Emma functionality
3. To fully rollback: revert `api/emma-agent.js` to previous commit

## Testing

Test locally:
```bash
node test-emma-function-calling.js
```

Verify:
- No `EROFS` errors in logs
- Stats persist in Supabase table
- Emma responds correctly

## Monitoring

Check stats in Supabase:
```sql
-- View all tool stats
SELECT * FROM tool_usage_stats ORDER BY last_used DESC;

-- Check error rates
SELECT tool_id, success_rate, total_calls
FROM tool_usage_stats
WHERE success_rate < 80
ORDER BY total_calls DESC;
```

## Related Files

- `api/emma-agent.js` - Main agent implementation
- `supabase-usage-stats.sql` - Database schema
- `lib/supabase-config.js` - Supabase client configuration
- `config/tools_config.json` - Tool definitions (still filesystem, read-only is OK)
