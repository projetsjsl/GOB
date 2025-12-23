/**
 * DataExplorerPanel - Excel-like grid view of Supabase 3P1 tables
 * 
 * Features:
 * - View all 3P1 tables with row counts and last update
 * - Excel-like grid with sorting, filtering
 * - Export to Excel/CSV
 * - Selective sync for specific tickers
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  XMarkIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';

interface TableInfo {
  name: string;
  label: string;
  icon: string;
  count: number;
  lastUpdate: string | null;
  error?: string;
}

interface Column {
  name: string;
  type: string;
  sample?: any;
}

interface DataExplorerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSelected?: (tickers: string[]) => void;
}

const DataExplorerPanel: React.FC<DataExplorerPanelProps> = ({ isOpen, onClose, onSyncSelected }) => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const limit = 50;
  
  // Filtering & sorting
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortAsc, setSortAsc] = useState(false);
  
  // Advanced Filtering
  const [activeFilters, setActiveFilters] = useState<{[key: string]: string}>({});
  const [showFilterBar, setShowFilterBar] = useState(false);
  
  // Feedback
  const [notifications, setNotifications] = useState<{id: number, type: 'success' | 'error', message: string}[]>([]);
  
  // Selection for sync
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showSyncPanel, setShowSyncPanel] = useState(false);

  // CRUD State
  const [editingRow, setEditingRow] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  // Load tables on mount
  useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen]);

  // Load table data when selection changes
  useEffect(() => {
    if (selectedTable) {
      loadTableData();
    }
  }, [selectedTable, page, sortBy, sortAsc, search]);

  const loadTables = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data-explorer?action=tables');
      const data = await res.json();
      if (data.success) {
        setTables(data.tables);
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async () => {
    if (!selectedTable) return;
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const params = new URLSearchParams({
        action: 'data',
        table: selectedTable,
        page: page.toString(),
        limit: limit.toString(),
        ascending: sortAsc.toString()
      });
      if (sortBy) params.append('orderBy', sortBy);
      if (search) params.append('search', search);
      
      const res = await fetch(`/api/data-explorer?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(false);
    }
  };

  const toggleRowSelection = (id: string) => {
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
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(tableData.map(r => r.id || r.ticker)));
    }
  };

  const exportToExcel = async () => {
    if (!selectedTable) return;
    
    try {
      const res = await fetch('/api/data-explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export',
          table: selectedTable,
          format: 'csv'
        })
      });
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable}_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError('Export failed: ' + e.message);
    }
  };

  const handleSyncSelected = () => {
    const tickers = tableData
      .filter(r => selectedRows.has(r.id || r.ticker))
      .map(r => r.ticker)
      .filter((t, i, arr) => arr.indexOf(t) === i); // Unique
    
    if (onSyncSelected && tickers.length > 0) {
      onSyncSelected(tickers);
    }
    setShowSyncPanel(false);
  };

  const handleSaveRow = async (data: any) => {
    if (!selectedTable) return;
    setLoading(true);
    try {
      const isNew = !editingRow?.id && !editingRow?.ticker;
      const action = isNew ? 'insert' : 'update';
      const pk = tables.find(t => t.name === selectedTable)?.primaryKey || 'id';
      
      const res = await fetch(`/api/data-explorer?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          id: editingRow ? (editingRow[pk]) : undefined,
          data
        })
      });
      
      const result = await res.json();
      if (result.success) {
        addNotification('success', isNew ? 'Enregistrement créé avec succès' : 'Modification enregistrée');
        setIsEditModalOpen(false);
        setEditingRow(null);
        loadTableData();
        loadTables(); // Refresh counts
      } else {
        addNotification('error', result.error);
        setError(result.error);
      }
    } catch (e: any) {
      addNotification('error', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRow = async (row: any) => {
    if (!selectedTable) return;
    
    // Determine ID based on table config
    const tableConfig = tables.find(t => t.name === selectedTable);
    const pk = (tableConfig as any)?.primaryKey || 'id'; // Default to id, but respect config
    // Fallback: check standard keys if pk value is missing in row
    const id = row[pk] || row.id || row.ticker;

    console.log(`[DataExplorer] Deleting from ${selectedTable}, PK=${pk}, ID=${id}`, row);

    if (!id) {
       addNotification('error', `Impossible de trouver l'ID (clé primaire: ${pk}) pour cet enregistrement`);
       return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer cet enregistrement ?\nTable: ${selectedTable}\nID: ${id}`)) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/data-explorer?action=delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          id
        })
      });
      
      const result = await res.json();
      if (result.success) {
        addNotification('success', 'Enregistrement supprimé');
        // Remove from local state immediately for better UI feedback
        setTableData(prev => prev.filter(r => (r[pk] || r.id || r.ticker) !== id));
        loadTables(); // Refresh counts in background
      } else {
        console.error('Delete failed:', result);
        addNotification('error', result.error || 'Erreur de suppression');
        setError(result.error);
      }
    } catch (e: any) {
      console.error('Delete exception:', e);
      addNotification('error', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSyncFMP = async (ticker: string) => {
    if (!ticker) return;
    setLoading(true);
    addNotification('success', `Synchro FMP démarrée pour ${ticker}...`);
    try {
      const res = await fetch('/api/fmp-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-all', symbol: ticker })
      });
      const data = await res.json();
      if (data.success) {
        addNotification('success', `Synchro terminée pour ${ticker}`);
        loadTableData();
      } else {
        addNotification('error', data.error || 'Erreur inconnue');
      }
    } catch (e: any) {
      addNotification('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') {
      return JSON.stringify(value).slice(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '');
    }
    if (column.includes('date') || column.includes('_at')) {
      try {
        return new Date(value).toLocaleString('fr-CA');
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const formatLastUpdate = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Il y a moins d\'une heure';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-CA');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <TableCellsIcon className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Data Explorer</h2>
              <p className="text-xs text-slate-400">Supabase 3P1 Tables</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedTable && (
              <>
                <button
                  onClick={() => { setEditingRow(null); setIsEditModalOpen(true); }}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors"
                >
                  <CheckIcon className="w-4 h-4" />
                  Ajouter
                </button>
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm text-white transition-colors"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Export Excel
                </button>
                {selectedRows.size > 0 && (
                  <button
                    onClick={() => setShowSyncPanel(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Sync ({selectedRows.size})
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Table List */}
          <div className="w-64 border-r border-slate-700 p-4 overflow-y-auto">
            <button
              onClick={() => { setSelectedTable(null); setShowSummary(true); }}
              className={`w-full text-left p-3 rounded-xl mb-4 transition-all ${
                showSummary && !selectedTable
                  ? 'bg-emerald-600/20 border border-emerald-500/50'
                  : 'hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <TableCellsIcon className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white">Rapport Global</span>
              </div>
            </button>

            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Tables</h3>
            <div className="space-y-2">
              {tables.map(table => (
                <button
                  key={table.name}
                  onClick={() => {
                    setSelectedTable(table.name);
                    setPage(1);
                    setSelectedRows(new Set());
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedTable === table.name
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{table.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{table.label}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{table.count.toLocaleString()} rows</span>
                        {table.error && <ExclamationCircleIcon className="w-3 h-3 text-red-400" />}
                      </div>
                    </div>
                  </div>
                  {table.lastUpdate && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                      <ClockIcon className="w-3 h-3" />
                      {formatLastUpdate(table.lastUpdate)}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={loadTables}
              className="w-full mt-4 p-2 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Actualiser
            </button>
          </div>

          {/* Main Content - Data Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedTable ? (
              <>
                {/* Toolbar */}
                <div className="flex items-center gap-4 p-4 border-b border-slate-700 bg-slate-800/50">
                  <div className="relative flex-1 max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  <button
                    onClick={() => setShowFilterBar(!showFilterBar)}
                    className={`p-2 rounded-lg border transition-all ${
                      showFilterBar || Object.keys(activeFilters).length > 0
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-slate-900 border-slate-600 text-slate-400 hover:text-white'
                    }`}
                    title="Filtres avancés"
                  >
                    <FunnelIcon className="w-5 h-5" />
                  </button>

                  <div className="text-sm text-slate-400">
                    {totalRows.toLocaleString()} enregistrements
                  </div>
                </div>

                {/* Advanced Filter Bar */}
                {showFilterBar && (
                  <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex flex-wrap gap-2 items-center animate-in slide-in-from-top duration-200">
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                      <FunnelIcon className="w-3 h-3" />
                      Filtres:
                    </span>
                    {columns.slice(0, 5).map(col => (
                      <div key={col.name} className="flex-1 min-w-[150px]">
                        <input
                          type="text"
                          placeholder={col.name}
                          value={activeFilters[col.name] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setActiveFilters(prev => {
                              const next = { ...prev };
                              if (val) next[col.name] = val;
                              else delete next[col.name];
                              return next;
                            });
                          }}
                          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => { setActiveFilters({}); loadTableData(); }}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 underline"
                    >
                      Effacer tout
                    </button>
                    <button
                      onClick={loadTableData}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded-lg font-bold transition-all"
                    >
                      Appliquer
                    </button>
                  </div>
                )}

                {/* Data Grid */}
                <div className="flex-1 overflow-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <ArrowPathIcon className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-full text-red-400">
                      <ExclamationCircleIcon className="w-6 h-6 mr-2" />
                      {error}
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-800 sticky top-0">
                        <tr>
                          <th className="p-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedRows.size === tableData.length && tableData.length > 0}
                              onChange={selectAllRows}
                              className="rounded bg-slate-700 border-slate-600"
                            />
                          </th>
                          {columns.slice(0, 8).map(col => (
                            <th
                              key={col.name}
                              onClick={() => handleSort(col.name)}
                              className="p-3 text-left text-slate-300 cursor-pointer hover:text-white transition-colors"
                            >
                              <div className="flex items-center gap-1">
                                <span className="truncate max-w-[120px]">{col.name}</span>
                                {sortBy === col.name && (
                                  sortAsc ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
                                )}
                              </div>
                            </th>
                          ))}
                          <th className="p-3 text-right text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, idx) => (
                          <tr
                            key={row.id || idx}
                            className={`border-b border-slate-800 hover:bg-slate-800/50 ${
                              selectedRows.has(row.id || row.ticker) ? 'bg-blue-600/10' : ''
                            }`}
                          >
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={selectedRows.has(row.id || row.ticker)}
                                onChange={() => toggleRowSelection(row.id || row.ticker)}
                                className="rounded bg-slate-700 border-slate-600"
                              />
                            </td>
                            {columns.slice(0, 8).map(col => (
                              <td key={col.name} className="p-3 text-slate-300">
                                <div className="truncate max-w-[200px]" title={formatValue(row[col.name], col.name)}>
                                  {formatValue(row[col.name], col.name)}
                                </div>
                              </td>
                            ))}
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => { setEditingRow(row); setIsEditModalOpen(true); }}
                                  className="p-1 hover:bg-slate-700 rounded text-blue-400 transition-colors"
                                  title="Modifier"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                {row.ticker && (
                                  <button
                                    onClick={() => handleSyncFMP(row.ticker)}
                                    className="p-1 hover:bg-slate-700 rounded text-green-400 transition-colors"
                                    title="Synchroniser FMP"
                                  >
                                    <ArrowPathIcon className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteRow(row)}
                                  className="p-1 hover:bg-slate-700 rounded text-red-400 transition-colors"
                                  title="Supprimer"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-800/50">
                  <div className="text-sm text-slate-400">
                    Page {page} sur {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </>
            ) : showSummary ? (
              <div className="flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-3xl font-bold text-white mb-2">Rapport de Données 3P1</h1>
                  <p className="text-slate-400 mb-8">Vue d'ensemble de la santé des tables Supabase et colonnes visibles.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tables.map(t => (
                      <div key={t.name} className={`p-6 rounded-2xl border ${t.error ? 'bg-red-900/10 border-red-800' : 'bg-slate-800/50 border-slate-700'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{t.icon}</span>
                            <h3 className="text-lg font-bold text-white">{t.label}</h3>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${t.error ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {t.error ? 'ERREUR' : 'ACTIF'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Lignes:</span>
                            <span className="text-white font-mono">{t.count.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Dernière Sync:</span>
                            <span className="text-white">{formatLastUpdate(t.lastUpdate)}</span>
                          </div>
                          {t.error && (
                            <div className="mt-4 p-3 bg-red-950/50 border border-red-900 rounded-lg text-red-300 text-xs font-mono">
                              {t.error}
                            </div>
                          )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700/50 flex gap-2">
                          <button
                            onClick={() => { setSelectedTable(t.name); setShowSummary(false); }}
                            className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-lg transition-colors border border-blue-500/30"
                          >
                            Explorer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <TableCellsIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Sélectionnez une table</p>
                  <p className="text-sm mt-2">pour visualiser les données</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sync Selection Panel */}
        {showSyncPanel && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-white mb-4">Synchroniser les sélections</h3>
              <p className="text-slate-300 mb-4">
                {selectedRows.size} élément(s) sélectionné(s) pour synchronisation.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSyncPanel(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSyncSelected}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
          <EditModal
            title={editingRow ? 'Modifier l\'enregistrement' : 'Nouvel enregistrement'}
            initialData={editingRow || {}}
            columns={columns}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveRow}
          />
        )}

        {/* Notifications / Toast Stack */}
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 ${
                n.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              {n.type === 'success' ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <ExclamationCircleIcon className="w-5 h-5" />
              )}
              <span className="font-medium">{n.message}</span>
              <button
                onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
                className="ml-4 p-1 hover:bg-black/10 rounded"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface EditModalProps {
  title: string;
  initialData: any;
  columns: Column[];
  onClose: () => void;
  onSave: (data: any) => void;
}

const EditModal: React.FC<EditModalProps> = ({ title, initialData, columns, onClose, onSave }) => {
  const [formData, setFormData] = useState<any>({ ...initialData });
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [tickerResults, setTickerResults] = useState<any[]>([]);
  const [showTickerResults, setShowTickerResults] = useState(false);
  const [fmpValues, setFmpValues] = useState<{[key: string]: any}>({});
  const tickerInputRef = useRef<HTMLInputElement>(null);

  // Mapping from table column names to FMP API result paths
  const FMP_MAPPING: {[key: string]: string} = {
    price: 'currentPrice',
    current_price: 'currentPrice',
    sector: 'info.sector',
    industry: 'info.industry',
    description: 'info.description',
    beta: 'info.beta',
    market_cap: 'info.mktCap',
    marketCap: 'info.mktCap',
    website: 'info.website',
    ceo: 'info.ceo',
    exchange: 'info.exchange',
    country: 'info.country',
    full_time_employees: 'info.fullTimeEmployees',
    image: 'info.image',
    currency: 'info.currency'
  };

  // Close ticker results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tickerInputRef.current && !tickerInputRef.current.contains(event.target as Node)) {
        // Delay hiding to allow click on result
        setTimeout(() => setShowTickerResults(false), 200);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTickerSearch = async (query: string) => {
    setFormData((prev: any) => ({ ...prev, ticker: query.toUpperCase() }));
    
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

  const selectTicker = (symbol: string) => {
    setFormData((prev: any) => ({ ...prev, ticker: symbol }));
    setShowTickerResults(false);
  };

  const handleFetchField = async (fieldName: string) => {
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
      let value: any = undefined;

      if (mapping === 'currentPrice') {
        value = result.currentPrice;
      } else if (mapping.startsWith('info.')) {
        const key = mapping.split('.')[1];
        value = result.info ? result.info[key] : undefined;
      }

      if (value !== undefined && value !== null) {
        // Store FMP value for selection instead of overwriting immediately
        setFmpValues(prev => ({ ...prev, [fieldName]: value }));
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

  const applyFmpValue = (fieldName: string) => {
    const val = fmpValues[fieldName];
    if (val !== undefined) {
      setFormData((prev: any) => ({ ...prev, [fieldName]: val }));
      // Clear specific FMP value after applying
      const newFmpValues = { ...fmpValues };
      delete newFmpValues[fieldName];
      setFmpValues(newFmpValues);
    }
  };

  return (
    <div className="absolute inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          {columns.map(col => {
            if (['id', 'created_at', 'updated_at'].includes(col.name)) return null;
            
            const isFmpField = !!FMP_MAPPING[col.name];
            const hasFmpValue = fmpValues[col.name] !== undefined;

            return (
              <div key={col.name} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-400 capitalize">
                    {col.name.replace(/_/g, ' ')}
                  </label>
                  {isFmpField && (
                    <div className="flex items-center gap-2">
                      {hasFmpValue && (
                        <span className="text-[10px] text-green-400 font-bold animate-pulse">
                          Valeur dispo !
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleFetchField(col.name)}
                        disabled={!!loadingField}
                        className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded transition-colors disabled:opacity-50 ${hasFmpValue ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'}`}
                        title="Récupérer depuis FMP"
                      >
                        {loadingField === col.name ? (
                          <ArrowPathIcon className="w-3 h-3 animate-spin" />
                        ) : (
                          <CloudArrowDownIcon className="w-3 h-3" />
                        )}
                        <span>FMP</span>
                      </button>
                    </div>
                  )}
                </div>

                {col.name === 'ticker' ? (
                  <div className="relative" ref={tickerInputRef as any}>
                    <input
                      type="text"
                      value={formData[col.name] || ''}
                      onChange={(e) => handleTickerSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white font-bold uppercase transition-all focus:border-blue-500 outline-none"
                      placeholder="AAPL"
                    />
                    {showTickerResults && tickerResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                        {tickerResults.map((r, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => selectTicker(r.symbol)}
                            className="w-full text-left px-4 py-2 hover:bg-slate-700 text-white flex justify-between items-center"
                          >
                            <span className="font-bold">{r.symbol}</span>
                            <span className="text-xs text-slate-400 truncate max-w-[150px]">{r.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : typeof formData[col.name] === 'boolean' || col.type === 'boolean' ? (
                  <div className="flex bg-slate-900 border border-slate-600 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, [col.name]: true })}
                      className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${formData[col.name] === true ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                      TRUE
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, [col.name]: false })}
                      className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${formData[col.name] === false ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                      FALSE
                    </button>
                  </div>
                ) : typeof formData[col.name] === 'object' ? (
                  <textarea
                    value={JSON.stringify(formData[col.name], null, 2)}
                    onChange={(e) => {
                      try {
                        const val = JSON.parse(e.target.value);
                        setFormData({ ...formData, [col.name]: val });
                      } catch {
                        // Handle invalid JSON while typing
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white font-mono text-sm h-32 focus:border-blue-500 outline-none"
                  />
                ) : (
                  <div className="relative">
                    <input
                      type={col.type === 'number' || typeof formData[col.name] === 'number' ? 'number' : 'text'}
                      value={formData[col.name] === null ? '' : formData[col.name]}
                      onChange={(e) => setFormData({ ...formData, [col.name]: col.type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                      className={`w-full bg-slate-900 border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none border ${hasFmpValue ? 'border-green-500/50' : ''}`}
                    />
                    {hasFmpValue && (
                       <div className="absolute top-full left-0 mt-1 z-10 w-full animate-in fade-in slide-in-from-top-1 duration-200">
                         <div className="bg-slate-800 border border-green-500/50 rounded-lg shadow-xl p-2 flex items-center justify-between gap-3">
                           <div className="flex flex-col">
                             <span className="text-[10px] text-green-400 font-bold uppercase">Suggestion FMP</span>
                             <span className="text-white font-mono text-sm truncate">{String(fmpValues[col.name])}</span>
                           </div>
                           <div className="flex gap-1">
                             <button
                               type="button"
                               onClick={() => {
                                 const newFmpValues = { ...fmpValues };
                                 delete newFmpValues[col.name];
                                 setFmpValues(newFmpValues);
                               }}
                               className="p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white"
                             >
                               <XMarkIcon className="w-4 h-4" />
                             </button>
                             <button
                               type="button"
                               onClick={() => applyFmpValue(col.name)}
                               className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs font-bold text-white shadow-lg"
                             >
                               Appliquer
                             </button>
                           </div>
                         </div>
                       </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold transition-all">Annuler</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold shadow-lg shadow-blue-900/20 transition-all">Enregistrer</button>
        </div>
      </div>
    </div>
  );
};

export default DataExplorerPanel;
