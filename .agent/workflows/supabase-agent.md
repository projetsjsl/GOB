---
description: Manage database operations via the Supabase Agent
---

The **Supabase Agent** is a specialized orchestrator agent designed to handle all database-related tasks for the 3P1 ecosystem.

### 🧠 Capabilities

1. **Dynamic discovery**: Automatically finds all tables in the `public` schema.
2. **Safe Queries**: Supports read-only SELECT queries with keyword filtering.
3. **Snapshot Management**: Interfaces with the snapshots API to archive valuation runs.
4. **Freshness Tracking**: Tracks when tickers were last synced.

### 🛠️ Common Actions

Use these commands when calling the agent through the master orchestrator:

#### List All Tables

```javascript
{ "action": "list_tables" }
```

#### Query 3P1 Snapshots

```javascript
{ 
  "action": "query_table", 
  "table": "finance_pro_snapshots",
  "filters": { "ticker": "AAPL", "is_current": true }
}
```

#### Check Sync Health

```javascript
{ 
  "action": "sync_status", 
  "tickers": ["MSFT", "GOOGL", "AMZN"] 
}
```

### ⚡ Automatic Learning

The agent uses `pg_tables` analysis to stay updated. If you modify the DB schema, simply restart the orchestrator process, and the agent will detect the changes.
