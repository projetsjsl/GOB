import { r as reactExports, j as jsxRuntimeExports, s as ForwardRef, t as ForwardRef$1, g as ForwardRef$2, F as ForwardRef$3, u as ForwardRef$4, v as ForwardRef$5, w as ForwardRef$6, l as ForwardRef$7, m as ForwardRef$8 } from "./index.js";
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
  const [sortBy, setSortBy] = reactExports.useState("created_at");
  const [sortAsc, setSortAsc] = reactExports.useState(false);
  const [selectedRows, setSelectedRows] = reactExports.useState(/* @__PURE__ */ new Set());
  const [showSyncPanel, setShowSyncPanel] = reactExports.useState(false);
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
    try {
      const params = new URLSearchParams({
        action: "data",
        table: selectedTable,
        page: page.toString(),
        limit: limit.toString(),
        orderBy: sortBy,
        ascending: sortAsc.toString()
      });
      if (search) params.append("search", search);
      const res = await fetch(`/api/data-explorer?${params}`);
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "w-6 h-6 text-blue-400" }),
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
              onClick: exportToExcel,
              className: "flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm text-white transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$1, { className: "w-4 h-4" }),
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
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$2, { className: "w-4 h-4" }),
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
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$3, { className: "w-5 h-5 text-slate-400" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-64 border-r border-slate-700 p-4 overflow-y-auto", children: [
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
                    table.error && /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "w-3 h-3 text-red-400" })
                  ] })
                ] })
              ] }),
              table.lastUpdate && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 mt-2 text-xs text-slate-500", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$5, { className: "w-3 h-3" }),
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
              /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$2, { className: "w-4 h-4" }),
              "Actualiser"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex flex-col overflow-hidden", children: selectedTable ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 p-4 border-b border-slate-700 bg-slate-800/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 max-w-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$6, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }),
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
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-slate-400", children: [
            totalRows.toLocaleString(),
            " enregistrements"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$2, { className: "w-8 h-8 text-blue-400 animate-spin" }) }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center h-full text-red-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "w-6 h-6 mr-2" }),
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
                  sortBy === col.name && (sortAsc ? /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$7, { className: "w-3 h-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$8, { className: "w-3 h-3" }))
                ] })
              },
              col.name
            ))
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
                columns.slice(0, 8).map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-slate-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate max-w-[200px]", title: formatValue(row[col.name], col.name), children: formatValue(row[col.name], col.name) }) }, col.name))
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
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center text-slate-500", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "w-16 h-16 mx-auto mb-4 opacity-50" }),
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
    ] }) })
  ] }) });
};
export {
  DataExplorerPanel as default
};
