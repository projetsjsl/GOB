---
description: Manage and browse Supabase tables using the Data Explorer
---

This workflow explains how to use the Data Explorer in Finance Pro 3P1.

### 🔍 How to Access

1. Open the [Finance Pro 3P1](https://jlab.jslai.app/3p1/) application.
2. Enable **Admin Mode** (Double-click the FinancePro logo or append `?admin=true` to the URL).
3. Find the **Data Explorer** button (Emerald green) in the Sidebar.

### 📊 Features

- **Browse Tables**: Select any 3P1 table from the left sidebar.
- **Search/Filter**: Use the search bar to filter records instantly.
- **Export**: Click "Export Excel" to download the current table data as a CSV.
- **Selective Sync**:
    1. Select row(s) using the checkboxes.
    2. Click the "Sync (n)" button.
    3. Choose your sync options in the dialog.
    4. Only the selected tickers will be processed.

### 🤖 Supabase Agent Integration

The Data Explorer is powered by the **Supabase Agent**.
To interact with the agent via the orchestrator, use the following actions:

- `list_tables`: Refreshes and returns the table registry.
- `query_table`: Fetches specific rows with filters.
- `sync_status`: Evaluates which tickers are outdated.

### 🛠️ Maintenance

If you add a new table to Supabase:

- The Supabase Agent will automatically discover it on restart via the `discoverTables()` method.
- No code change is required in the backend.
- The UI will automatically list the new table in the Data Explorer sidebar.

### 🏗️ Build & Deploy

If the UI changes are not visible:

```bash
cd public/3p1
npm run build
```

Then commit and push the `dist/` folder.
