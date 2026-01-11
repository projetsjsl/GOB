import { r as reactExports, j as jsxRuntimeExports, s as ForwardRef$1, t as ForwardRef$2, u as ForwardRef$3, g as ForwardRef$4, F as ForwardRef$5, v as ForwardRef$6, w as ForwardRef$7, x as ForwardRef$8, a as ForwardRef$9, l as ForwardRef$a, m as ForwardRef$b } from "./index.js";
function CloudArrowDownIcon({
  title,
  titleId,
  ...props
}, svgRef) {
  return /* @__PURE__ */ reactExports.createElement("svg", Object.assign({
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    "aria-hidden": "true",
    "data-slot": "icon",
    ref: svgRef,
    "aria-labelledby": titleId
  }, props), title ? /* @__PURE__ */ reactExports.createElement("title", {
    id: titleId
  }, title) : null, /* @__PURE__ */ reactExports.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M12 9.75v6.75m0 0-3-3m3 3 3-3m-8.25 6a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
  }));
}
const ForwardRef = /* @__PURE__ */ reactExports.forwardRef(CloudArrowDownIcon);
const DataExplorerPanel = ({ isOpen, onClose, onSyncSelected }) => {
  const [tables, setTables] = reactExports.useState([]);
  const [selectedTable, setSelectedTable] = reactExports.useState(null);
  const [tableData, setTableData] = reactExports.useState([]);
  const [columns, setColumns] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [page, setPage] = reactExports.useState(1);
  const [totalPages, setTotalPages] = reactExports.useState(1);
  const [totalRows, setTotalRows] = reactExports.useState(0);
  const limit = 50;
  const [search, setSearch] = reactExports.useState("");
  const [sortBy, setSortBy] = reactExports.useState(void 0);
  const [sortAsc, setSortAsc] = reactExports.useState(false);
  const [activeFilters, setActiveFilters] = reactExports.useState({});
  const [showFilterBar, setShowFilterBar] = reactExports.useState(false);
  const [notifications, setNotifications] = reactExports.useState([]);
  const [selectedRows, setSelectedRows] = reactExports.useState(/* @__PURE__ */ new Set());
  const [showSyncPanel, setShowSyncPanel] = reactExports.useState(false);
  const [editingRow, setEditingRow] = reactExports.useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = reactExports.useState(false);
  const [isDeleting, setIsDeleting] = reactExports.useState(false);
  const [showSummary, setShowSummary] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen]);
  reactExports.useEffect(() => {
    if (selectedTable) {
      loadTableData();
    }
  }, [selectedTable, page, sortBy, sortAsc, search]);
  const loadTables = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data-explorer?action=tables");
      const data = await res.json();
      if (data.success) {
        setTables(data.tables);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const loadTableData = async () => {
    if (!selectedTable) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        action: "data",
        table: selectedTable,
        page: page.toString(),
        limit: limit.toString(),
        ascending: sortAsc.toString()
      });
      if (sortBy) params.append("orderBy", sortBy);
      if (search) params.append("search", search);
      const res = await fetch(`/api/data-explorer?${params}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: activeFilters })
      });
      const data = await res.json();
      if (data.success) {
        setTableData(data.data);
        setColumns(data.columns);
        setTotalPages(data.pagination.totalPages);
        setTotalRows(data.pagination.total);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4e3);
  };
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(false);
    }
  };
  const toggleRowSelection = (id) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
  };
  const selectAllRows = () => {
    if (selectedRows.size === tableData.length) {
      setSelectedRows(/* @__PURE__ */ new Set());
    } else {
      setSelectedRows(new Set(tableData.map((r) => r.id || r.ticker)));
    }
  };
  const exportToExcel = async () => {
    if (!selectedTable) return;
    try {
      const res = await fetch("/api/data-explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export",
          table: selectedTable,
          format: "csv"
        })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTable}_export_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError("Export failed: " + e.message);
    }
  };
  const handleSyncSelected = () => {
    const tickers = tableData.filter((r) => selectedRows.has(r.id || r.ticker)).map((r) => r.ticker).filter((t, i, arr) => arr.indexOf(t) === i);
    if (onSyncSelected && tickers.length > 0) {
      onSyncSelected(tickers);
    }
    setShowSyncPanel(false);
  };
  const handleSaveRow = async (data) => {
    var _a;
    if (!selectedTable) return;
    setLoading(true);
    try {
      const isNew = !(editingRow == null ? void 0 : editingRow.id) && !(editingRow == null ? void 0 : editingRow.ticker);
      const action = isNew ? "insert" : "update";
      const pk = ((_a = tables.find((t) => t.name === selectedTable)) == null ? void 0 : _a.primaryKey) || "id";
      const res = await fetch(`/api/data-explorer?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: selectedTable,
          id: editingRow ? editingRow[pk] : void 0,
          data
        })
      });
      const result = await res.json();
      if (result.success) {
        addNotification("success", isNew ? "Enregistrement créé avec succès" : "Modification enregistrée");
        setIsEditModalOpen(false);
        setEditingRow(null);
        loadTableData();
        loadTables();
      } else {
        addNotification("error", result.error);
        setError(result.error);
      }
    } catch (e) {
      addNotification("error", e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteRow = async (row) => {
    if (!selectedTable) return;
    const tableConfig = tables.find((t) => t.name === selectedTable);
    const pk = (tableConfig == null ? void 0 : tableConfig.primaryKey) || "id";
    const id = row[pk] || row.id || row.ticker;
    console.log(`[DataExplorer] Deleting from ${selectedTable}, PK=${pk}, ID=${id}`, row);
    if (!id) {
      addNotification("error", `Impossible de trouver l'ID (clé primaire: ${pk}) pour cet enregistrement`);
      return;
    }
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cet enregistrement ?
Table: ${selectedTable}
ID: ${id}`)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/data-explorer?action=delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: selectedTable,
          id
        })
      });
      const result = await res.json();
      if (result.success) {
        addNotification("success", "Enregistrement supprimé");
        setTableData((prev) => prev.filter((r) => (r[pk] || r.id || r.ticker) !== id));
        loadTables();
      } else {
        console.error("Delete failed:", result);
        addNotification("error", result.error || "Erreur de suppression");
        setError(result.error);
      }
    } catch (e) {
      console.error("Delete exception:", e);
      addNotification("error", e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSyncFMP = async (ticker) => {
    if (!ticker) return;
    setLoading(true);
    addNotification("success", `Synchro FMP démarrée pour ${ticker}...`);
    try {
      const res = await fetch("/api/fmp-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync-all", symbol: ticker })
      });
      const data = await res.json();
      if (data.success) {
        addNotification("success", `Synchro terminée pour ${ticker}`);
        loadTableData();
      } else {
        addNotification("error", data.error || "Erreur inconnue");
      }
    } catch (e) {
      addNotification("error", e.message);
    } finally {
      setLoading(false);
    }
  };
  const formatValue = (value, column) => {
    if (value === null || value === void 0) return "-";
    if (typeof value === "object") {
      return JSON.stringify(value).slice(0, 100) + (JSON.stringify(value).length > 100 ? "..." : "");
    }
    if (column.includes("date") || column.includes("_at")) {
      try {
        return new Date(value).toLocaleString("fr-CA");
      } catch {
        return String(value);
      }
    }
    return String(value);
  };
  const formatLastUpdate = (dateStr) => {
    if (!dateStr) return "Jamais";
    const date = new Date(dateStr);
    const now = /* @__PURE__ */ new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1e3 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) return "Il y a moins d'une heure";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-CA");
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 border-b border-slate-700", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$1, { className: "w-6 h-6 text-blue-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-white", children: "Data Explorer" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Supabase 3P1 Tables" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        selectedTable && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => {
                setEditingRow(null);
                setIsEditModalOpen(true);
              },
              className: "flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$2, { className: "w-4 h-4" }),
                "Ajouter"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: exportToExcel,
              className: "flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm text-white transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$3, { className: "w-4 h-4" }),
                "Export Excel"
              ]
            }
          ),
          selectedRows.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setShowSyncPanel(true),
              className: "flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "w-4 h-4" }),
                "Sync (",
                selectedRows.size,
                ")"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onClose,
            className: "p-2 hover:bg-slate-700 rounded-lg transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$5, { className: "w-5 h-5 text-slate-400" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-64 border-r border-slate-700 p-4 overflow-y-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setSelectedTable(null);
              setShowSummary(true);
            },
            className: `w-full text-left p-3 rounded-xl mb-4 transition-all ${showSummary && !selectedTable ? "bg-emerald-600/20 border border-emerald-500/50" : "hover:bg-slate-800 border border-transparent"}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$1, { className: "w-5 h-5 text-emerald-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-white", children: "Rapport Global" })
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider", children: "Tables" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: tables.map((table) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => {
              setSelectedTable(table.name);
              setPage(1);
              setSelectedRows(/* @__PURE__ */ new Set());
            },
            className: `w-full text-left p-3 rounded-xl transition-all ${selectedTable === table.name ? "bg-blue-600/20 border border-blue-500/50" : "hover:bg-slate-800 border border-transparent"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg", children: table.icon }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-white truncate", children: table.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-400", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      table.count.toLocaleString(),
                      " rows"
                    ] }),
                    table.error && /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$6, { className: "w-3 h-3 text-red-400" })
                  ] })
                ] })
              ] }),
              table.lastUpdate && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 mt-2 text-xs text-slate-500", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$7, { className: "w-3 h-3" }),
                formatLastUpdate(table.lastUpdate)
              ] })
            ]
          },
          table.name
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: loadTables,
            className: "w-full mt-4 p-2 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "w-4 h-4" }),
              "Actualiser"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex flex-col overflow-hidden", children: selectedTable ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 p-4 border-b border-slate-700 bg-slate-800/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 max-w-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$8, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                placeholder: "Rechercher...",
                value: search,
                onChange: (e) => {
                  setSearch(e.target.value);
                  setPage(1);
                },
                className: "w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setShowFilterBar(!showFilterBar),
              className: `p-2 rounded-lg border transition-all ${showFilterBar || Object.keys(activeFilters).length > 0 ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-slate-900 border-slate-600 text-slate-400 hover:text-white"}`,
              title: "Filtres avancés",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$9, { className: "w-5 h-5" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-slate-400", children: [
            totalRows.toLocaleString(),
            " enregistrements"
          ] })
        ] }),
        showFilterBar && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex flex-wrap gap-2 items-center animate-in slide-in-from-top duration-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold text-slate-500 uppercase flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$9, { className: "w-3 h-3" }),
            "Filtres:"
          ] }),
          columns.slice(0, 5).map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-[150px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: col.name,
              value: activeFilters[col.name] || "",
              onChange: (e) => {
                const val = e.target.value;
                setActiveFilters((prev) => {
                  const next = { ...prev };
                  if (val) next[col.name] = val;
                  else delete next[col.name];
                  return next;
                });
              },
              className: "w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none"
            }
          ) }, col.name)),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                setActiveFilters({});
                loadTableData();
              },
              className: "text-xs text-slate-400 hover:text-white px-2 py-1 underline",
              children: "Effacer tout"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: loadTableData,
              className: "bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded-lg font-bold transition-all",
              children: "Appliquer"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "w-8 h-8 text-blue-400 animate-spin" }) }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center h-full text-red-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$6, { className: "w-6 h-6 mr-2" }),
          error
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-slate-800 sticky top-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: selectedRows.size === tableData.length && tableData.length > 0,
                onChange: selectAllRows,
                className: "rounded bg-slate-700 border-slate-600"
              }
            ) }),
            columns.slice(0, 8).map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "th",
              {
                onClick: () => handleSort(col.name),
                className: "p-3 text-left text-slate-300 cursor-pointer hover:text-white transition-colors",
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate max-w-[120px]", children: col.name }),
                  sortBy === col.name && (sortAsc ? /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$a, { className: "w-3 h-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$b, { className: "w-3 h-3" }))
                ] })
              },
              col.name
            )),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right text-slate-300", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: tableData.map((row, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "tr",
            {
              className: `border-b border-slate-800 hover:bg-slate-800/50 ${selectedRows.has(row.id || row.ticker) ? "bg-blue-600/10" : ""}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: selectedRows.has(row.id || row.ticker),
                    onChange: () => toggleRowSelection(row.id || row.ticker),
                    className: "rounded bg-slate-700 border-slate-600"
                  }
                ) }),
                columns.slice(0, 8).map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-slate-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate max-w-[200px]", title: formatValue(row[col.name], col.name), children: formatValue(row[col.name], col.name) }) }, col.name)),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => {
                        setEditingRow(row);
                        setIsEditModalOpen(true);
                      },
                      className: "p-1 hover:bg-slate-700 rounded text-blue-400 transition-colors",
                      title: "Modifier",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" }) })
                    }
                  ),
                  row.ticker && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => handleSyncFMP(row.ticker),
                      className: "p-1 hover:bg-slate-700 rounded text-green-400 transition-colors",
                      title: "Synchroniser FMP",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "w-4 h-4" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => handleDeleteRow(row),
                      className: "p-1 hover:bg-slate-700 rounded text-red-400 transition-colors",
                      title: "Supprimer",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) })
                    }
                  )
                ] }) })
              ]
            },
            row.id || idx
          )) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 border-t border-slate-700 bg-slate-800/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-slate-400", children: [
            "Page ",
            page,
            " sur ",
            totalPages
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setPage(Math.max(1, page - 1)),
                disabled: page === 1,
                className: "px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm",
                children: "Précédent"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setPage(Math.min(totalPages, page + 1)),
                disabled: page === totalPages,
                className: "px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm",
                children: "Suivant"
              }
            )
          ] })
        ] })
      ] }) : showSummary ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-white mb-2", children: "Rapport de Données 3P1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 mb-8", children: "Vue d'ensemble de la santé des tables Supabase et colonnes visibles." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: tables.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `p-6 rounded-2xl border ${t.error ? "bg-red-900/10 border-red-800" : "bg-slate-800/50 border-slate-700"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: t.icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-white", children: t.label })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-2 py-1 rounded text-xs font-bold ${t.error ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`, children: t.error ? "ERREUR" : "ACTIF" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: "Total Lignes:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-mono", children: t.count.toLocaleString() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: "Dernière Sync:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white", children: formatLastUpdate(t.lastUpdate) })
            ] }),
            t.error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 p-3 bg-red-950/50 border border-red-900 rounded-lg text-red-300 text-xs font-mono", children: t.error })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 pt-4 border-t border-slate-700/50 flex gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                setSelectedTable(t.name);
                setShowSummary(false);
              },
              className: "flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-lg transition-colors border border-blue-500/30",
              children: "Explorer"
            }
          ) })
        ] }, t.name)) })
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center text-slate-500", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$1, { className: "w-16 h-16 mx-auto mb-4 opacity-50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg", children: "Sélectionnez une table" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm mt-2", children: "pour visualiser les données" })
      ] }) }) })
    ] }),
    showSyncPanel && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-white mb-4", children: "Synchroniser les sélections" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-300 mb-4", children: [
        selectedRows.size,
        " élément(s) sélectionné(s) pour synchronisation."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setShowSyncPanel(false),
            className: "flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white",
            children: "Annuler"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleSyncSelected,
            className: "flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white",
            children: "Confirmer"
          }
        )
      ] })
    ] }) }),
    isEditModalOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditModal,
      {
        title: editingRow ? "Modifier l'enregistrement" : "Nouvel enregistrement",
        initialData: editingRow || {},
        columns,
        onClose: () => setIsEditModalOpen(false),
        onSave: handleSaveRow
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed bottom-6 right-6 z-[100] flex flex-col gap-2", children: notifications.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 ${n.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`,
        children: [
          n.type === "success" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$2, { className: "w-5 h-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$6, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: n.message }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setNotifications((prev) => prev.filter((x) => x.id !== n.id)),
              className: "ml-4 p-1 hover:bg-black/10 rounded",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$5, { className: "w-4 h-4" })
            }
          )
        ]
      },
      n.id
    )) })
  ] }) });
};
const EditModal = ({ title, initialData, columns, onClose, onSave }) => {
  const [formData, setFormData] = reactExports.useState({ ...initialData });
  const [loadingField, setLoadingField] = reactExports.useState(null);
  const [tickerResults, setTickerResults] = reactExports.useState([]);
  const [showTickerResults, setShowTickerResults] = reactExports.useState(false);
  const [fmpValues, setFmpValues] = reactExports.useState({});
  const tickerInputRef = useRef(null);
  const FMP_MAPPING = {
    price: "currentPrice",
    current_price: "currentPrice",
    sector: "info.sector",
    industry: "info.industry",
    description: "info.description",
    beta: "info.beta",
    market_cap: "info.mktCap",
    marketCap: "info.mktCap",
    website: "info.website",
    ceo: "info.ceo",
    exchange: "info.exchange",
    country: "info.country",
    full_time_employees: "info.fullTimeEmployees",
    image: "info.image",
    currency: "info.currency"
  };
  reactExports.useEffect(() => {
    const handleClickOutside = (event) => {
      if (tickerInputRef.current && !tickerInputRef.current.contains(event.target)) {
        setTimeout(() => setShowTickerResults(false), 200);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleTickerSearch = async (query) => {
    setFormData((prev) => ({ ...prev, ticker: query.toUpperCase() }));
    if (query.length < 2) {
      setTickerResults([]);
      setShowTickerResults(false);
      return;
    }
    try {
      const res = await fetch(`/api/fmp-search?query=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickerResults(data);
        setShowTickerResults(true);
      } else if (data && data.results) {
        setTickerResults(data.results);
        setShowTickerResults(true);
      }
    } catch (e) {
      console.error(e);
    }
  };
  const selectTicker = (symbol) => {
    setFormData((prev) => ({ ...prev, ticker: symbol }));
    setShowTickerResults(false);
  };
  const handleFetchField = async (fieldName) => {
    const ticker = formData.ticker;
    if (!ticker) {
      alert("Veuillez d'abord saisir un Ticker");
      return;
    }
    setLoadingField(fieldName);
    try {
      const res = await fetch(`/api/fmp-company-data?symbol=${encodeURIComponent(ticker)}`);
      const result = await res.json();
      const mapping = FMP_MAPPING[fieldName];
      let value = void 0;
      if (mapping === "currentPrice") {
        value = result.currentPrice;
      } else if (mapping.startsWith("info.")) {
        const key = mapping.split(".")[1];
        value = result.info ? result.info[key] : void 0;
      }
      if (value !== void 0 && value !== null) {
        setFmpValues((prev) => ({ ...prev, [fieldName]: value }));
      } else {
        alert("Donnée non trouvée chez FMP pour ce champ.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la récupération FMP");
    } finally {
      setLoadingField(null);
    }
  };
  const applyFmpValue = (fieldName) => {
    const val = fmpValues[fieldName];
    if (val !== void 0) {
      setFormData((prev) => ({ ...prev, [fieldName]: val }));
      const newFmpValues = { ...fmpValues };
      delete newFmpValues[fieldName];
      setFmpValues(newFmpValues);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 z-[60] bg-black/60 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-b border-slate-700 flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold text-white", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "p-2 hover:bg-slate-700 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$5, { className: "w-5 h-5" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 overflow-y-auto space-y-4", children: columns.map((col) => {
      if (["id", "created_at", "updated_at"].includes(col.name)) return null;
      const isFmpField = !!FMP_MAPPING[col.name];
      const hasFmpValue = fmpValues[col.name] !== void 0;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-slate-400 capitalize", children: col.name.replace(/_/g, " ") }),
          isFmpField && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            hasFmpValue && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-green-400 font-bold animate-pulse", children: "Valeur dispo !" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => handleFetchField(col.name),
                disabled: !!loadingField,
                className: `flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded transition-colors disabled:opacity-50 ${hasFmpValue ? "bg-green-600/20 text-green-400" : "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"}`,
                title: "Récupérer depuis FMP",
                children: [
                  loadingField === col.name ? /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "w-3 h-3" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "FMP" })
                ]
              }
            )
          ] })
        ] }),
        col.name === "ticker" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", ref: tickerInputRef, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: formData[col.name] || "",
              onChange: (e) => handleTickerSearch(e.target.value),
              className: "w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white font-bold uppercase transition-all focus:border-blue-500 outline-none",
              placeholder: "AAPL"
            }
          ),
          showTickerResults && tickerResults.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto", children: tickerResults.map((r, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => selectTicker(r.symbol),
              className: "w-full text-left px-4 py-2 hover:bg-slate-700 text-white flex justify-between items-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: r.symbol }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400 truncate max-w-[150px]", children: r.name })
              ]
            },
            idx
          )) })
        ] }) : typeof formData[col.name] === "boolean" || col.type === "boolean" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-slate-900 border border-slate-600 rounded-lg p-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setFormData({ ...formData, [col.name]: true }),
              className: `flex-1 py-2 rounded-md text-xs font-bold transition-all ${formData[col.name] === true ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`,
              children: "TRUE"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setFormData({ ...formData, [col.name]: false }),
              className: `flex-1 py-2 rounded-md text-xs font-bold transition-all ${formData[col.name] === false ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white"}`,
              children: "FALSE"
            }
          )
        ] }) : typeof formData[col.name] === "object" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: JSON.stringify(formData[col.name], null, 2),
            onChange: (e) => {
              try {
                const val = JSON.parse(e.target.value);
                setFormData({ ...formData, [col.name]: val });
              } catch {
              }
            },
            className: "w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white font-mono text-sm h-32 focus:border-blue-500 outline-none"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: col.type === "number" || typeof formData[col.name] === "number" ? "number" : "text",
              value: formData[col.name] === null ? "" : formData[col.name],
              onChange: (e) => setFormData({ ...formData, [col.name]: col.type === "number" ? parseFloat(e.target.value) : e.target.value }),
              className: `w-full bg-slate-900 border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none border ${hasFmpValue ? "border-green-500/50" : ""}`
            }
          ),
          hasFmpValue && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-full left-0 mt-1 z-10 w-full animate-in fade-in slide-in-from-top-1 duration-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-800 border border-green-500/50 rounded-lg shadow-xl p-2 flex items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-green-400 font-bold uppercase", children: "Suggestion FMP" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-mono text-sm truncate", children: String(fmpValues[col.name]) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    const newFmpValues = { ...fmpValues };
                    delete newFmpValues[col.name];
                    setFmpValues(newFmpValues);
                  },
                  className: "p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$5, { className: "w-4 h-4" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => applyFmpValue(col.name),
                  className: "px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs font-bold text-white shadow-lg",
                  children: "Appliquer"
                }
              )
            ] })
          ] }) })
        ] })
      ] }, col.name);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-t border-slate-700 flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold transition-all", children: "Annuler" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onSave(formData), className: "flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold shadow-lg shadow-blue-900/20 transition-all", children: "Enregistrer" })
    ] })
  ] }) });
};
export {
  DataExplorerPanel as default
};
