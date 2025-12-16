
import React, { useState, useEffect } from 'react';
import { 
  ArrowPathIcon, 
  ShieldCheckIcon, 
  TableCellsIcon 
} from '@heroicons/react/24/outline';

interface RepoStatus {
  ticker: string;
  updatedAt: string;
  healthScore: number;
  yearsCount?: number;
  lastFinancialYear?: number;
  data: {
    financials: boolean;
    estimates: boolean;
    insider: boolean;
    institutional: boolean;
    surprises: boolean;
  };
}

interface AdminStats {
  totalTickers: number;
  fullySynced: number;
  partiallySynced: number;
  emptyOrLegacy: number;
  coverage: number;
}

interface AdminDashboardProps {
  onRepair: (ticker: string) => void;
  isRepairing?: string | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onRepair, isRepairing }) => {
  const [activeTab, setActiveTab] = useState<'warehouse' | 'users'>('warehouse');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [details, setDetails] = useState<RepoStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'healthy' | 'issue'>('all');
  const [inspectItem, setInspectItem] = useState<RepoStatus | null>(null);

  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [currentUser] = useState(() => {
    try {
        const stored = sessionStorage.getItem('gob-user');
        return stored ? JSON.parse(stored) : null;
    } catch(e) { return null; }
  });

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-warehouse-status');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setDetails(data.details);
      }
    } catch (e) {
      console.error('Failed to fetch admin status:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!currentUser) return;
    setLoadingUsers(true);
    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'list_users', 
                admin_username: currentUser.username 
            })
        });
        const data = await res.json();
        if (data.success) {
            setUsers(data.users);
        } else {
            console.error('Error fetching users:', data.error);
        }
    } catch (e) {
        console.error('Failed to fetch users:', e);
    } finally {
        setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'warehouse') fetchStatus();
    if (activeTab === 'users') fetchUsers();
  }, [isRepairing, activeTab]);

  const filteredDetails = details.filter(item => {
    if (filter === 'healthy') return item.healthScore === 100;
    if (filter === 'issue') return item.healthScore < 100;
    return true;
  });

  const getStatusColor = (score: number) => {
    if (score === 100) return 'text-green-400';
    if (score > 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleSaveUser = async (userData: any) => {
      if (!currentUser) return;
      
      const action = editingUser ? 'update_user' : 'create_user';
      const payload = editingUser 
        ? { action, admin_username: currentUser.username, target_id: editingUser.id, updates: userData }
        : { action, admin_username: currentUser.username, ...userData };

      try {
          const res = await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
              setIsUserModalOpen(false);
              setEditingUser(null);
              fetchUsers();
          } else {
              alert('Error saving user: ' + data.error);
          }
      } catch (e) {
          console.error('Save failed:', e);
          alert('Save failed');
      }
  };

  const handleDeleteUser = async (userId: string) => {
      if (!confirm('Are you sure you want to delete this user?')) return;
      if (!currentUser) return;

      try {
          const res = await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  action: 'delete_user', 
                  admin_username: currentUser.username,
                  target_id: userId
              })
          });
          const data = await res.json();
          if (data.success) {
              fetchUsers();
          } else {
              alert('Delete failed: ' + data.error);
          }
      } catch(e) {
          alert('Delete failed');
      }
  };

  const BooleanPill = ({ active, label }: { active: boolean, label: string }) => (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${active ? 'bg-green-900/30 border-green-800 text-green-300' : 'bg-red-900/30 border-red-800 text-red-400 opacity-50'}`}>
      {label}
    </span>
  );

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold">Admin Control</h1>
          </div>
          
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
             <button 
                onClick={() => setActiveTab('warehouse')}
                className={`px-3 py-1 text-sm rounded-md transition-all ${activeTab === 'warehouse' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}
             >
                Warehouse
             </button>
             <button 
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1 text-sm rounded-md transition-all ${activeTab === 'users' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}
             >
                Users & Roles
             </button>
          </div>
        </div>
        
        <button 
          onClick={activeTab === 'warehouse' ? fetchStatus : fetchUsers} 
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          title="Refresh"
        >
          <ArrowPathIcon className={`w-5 h-5 ${(loading || loadingUsers) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {activeTab === 'warehouse' && (
        <>
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-800 bg-slate-900/50">
                <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                    <div className="text-slate-400 text-xs uppercase tracking-wider">Total Tickers</div>
                    <div className="text-2xl font-bold text-white">{stats.totalTickers}</div>
                </div>
                <div className="bg-green-900/20 p-3 rounded border border-green-900/50">
                    <div className="text-green-400 text-xs uppercase tracking-wider">Fully Synced</div>
                    <div className="text-2xl font-bold text-green-400">{stats.fullySynced}</div>
                </div>
                <div className="bg-yellow-900/20 p-3 rounded border border-yellow-900/50">
                    <div className="text-yellow-400 text-xs uppercase tracking-wider">Partial Data</div>
                    <div className="text-2xl font-bold text-yellow-400">{stats.partiallySynced}</div>
                </div>
                <div className="bg-slate-800 p-3 rounded border border-slate-600">
                    <div className="text-slate-300 text-xs uppercase tracking-wider">Health Coverage</div>
                    <div className="text-2xl font-bold text-blue-400">{stats.coverage}%</div>
                </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 p-4 pb-2">
                <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                All
                </button>
                <button 
                onClick={() => setFilter('issue')}
                className={`px-3 py-1 rounded text-sm ${filter === 'issue' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                Issues / Partial
                </button>
                <button 
                onClick={() => setFilter('healthy')}
                className={`px-3 py-1 rounded text-sm ${filter === 'healthy' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                Healthy (100%)
                </button>
            </div>

            {/* Data Grid */}
            <div className="flex-1 overflow-auto p-4 pt-0">
                <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-800 sticky top-0 z-10 font-bold text-slate-300">
                    <tr>
                    <th className="p-3 border-b border-slate-700">Ticker</th>
                    <th className="p-3 border-b border-slate-700">Health</th>
                    <th className="p-3 border-b border-slate-700">Range</th>
                    <th className="p-3 border-b border-slate-700">Data Points</th>
                    <th className="p-3 border-b border-slate-700">Last Update</th>
                    <th className="p-3 border-b border-slate-700 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {filteredDetails.map(item => (
                    <tr key={item.ticker} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setInspectItem(item)}>
                        <td className="p-3 font-mono font-bold text-blue-300">{item.ticker}</td>
                        <td className="p-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.healthScore === 100 ? 'bg-green-500' : item.healthScore > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                            <span className={getStatusColor(item.healthScore)}>{item.healthScore}%</span>
                        </div>
                        </td>
                        <td className="p-3">
                        {item.lastFinancialYear ? (
                            <span className={`text-xs px-2 py-0.5 rounded ${item.lastFinancialYear < new Date().getFullYear() - 1 ? 'bg-yellow-900/50 text-yellow-400' : 'bg-slate-800 text-slate-300'}`}>
                            {item.lastFinancialYear} <span className="text-slate-500">({item.yearsCount}y)</span>
                            </span>
                        ) : <span className="text-slate-600">-</span>}
                        </td>
                        <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                            <BooleanPill active={item.data.financials} label="FIN" />
                            <BooleanPill active={item.data.estimates} label="EST" />
                            <BooleanPill active={item.data.insider} label="INS" />
                            <BooleanPill active={item.data.institutional} label="OWN" />
                            <BooleanPill active={item.data.surprises} label="SUR" />
                        </div>
                        </td>
                        <td className="p-3 text-slate-400 text-xs">
                        {new Date(item.updatedAt).toLocaleDateString()}
                        <div className="text-[10px] opacity-60">{new Date(item.updatedAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="p-3 text-right">
                        <button
                            onClick={(e) => {
                            e.stopPropagation();
                            onRepair(item.ticker);
                            }}
                            disabled={isRepairing === item.ticker}
                            className="bg-slate-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRepairing === item.ticker ? 'Syncing...' : 'Sync'}
                        </button>
                        </td>
                    </tr>
                    ))}
                    {filteredDetails.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500">
                                No tickers found matching filter.
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
        </>
      )}

      {activeTab === 'users' && (
          <div className="flex-1 flex flex-col">
              <div className="p-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">User List</h3>
                  <button 
                    onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                      <span>+ Add User</span>
                  </button>
              </div>

              <div className="flex-1 overflow-auto p-4 pt-0">
                <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-800 sticky top-0 z-10 font-bold text-slate-300">
                        <tr>
                            <th className="p-3 border-b border-slate-700">Username</th>
                            <th className="p-3 border-b border-slate-700">Display Name</th>
                            <th className="p-3 border-b border-slate-700">Role</th>
                            <th className="p-3 border-b border-slate-700">Last Login</th>
                            <th className="p-3 border-b border-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {users.map(u => (
                            <tr key={u.id || u.username} className="hover:bg-slate-800/30">
                                <td className="p-3 font-mono text-blue-300">{u.username}</td>
                                <td className="p-3">{u.display_name}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                        ${u.role === 'admin' ? 'bg-purple-900/50 text-purple-400' : 
                                          u.role === 'daniel' || u.role === 'gob' ? 'bg-blue-900/50 text-blue-400' :
                                          'bg-slate-800 text-slate-400'}
                                    `}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-3 text-slate-400">{u.last_login ? new Date(u.last_login).toLocaleDateString() : '-'}</td>
                                <td className="p-3 text-right flex justify-end gap-2">
                                    <button 
                                        onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {users.length === 0 && !loadingUsers && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    No users found or permissions denied.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
              </div>
          </div>
      )}

      {/* JSON Inspector Modal */}
      {inspectItem && (
        <div className="absolute inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TableCellsIcon className="w-5 h-5 text-blue-400" />
                Raw Data Inspector: <span className="font-mono text-blue-300">{inspectItem.ticker}</span>
              </h3>
              <button 
                onClick={() => setInspectItem(null)}
                className="text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[#0d1117] text-slate-300 font-mono text-xs">
              <pre>{JSON.stringify(inspectItem, null, 2)}</pre>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
               <button
                  onClick={() => {
                      onRepair(inspectItem.ticker);
                      setInspectItem(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
               >
                  Force Full Re-Sync
               </button>
            </div>
          </div>
        </div>
      )}

      {/* User Edit/Create Modal */}
      {isUserModalOpen && (
          <div className="absolute inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-sm">
             <UserModal 
                user={editingUser} 
                onSave={handleSaveUser} 
                onClose={() => setIsUserModalOpen(false)} 
             />
          </div>
      )}
    </div>
  );
};

// Subcomponent for User Modal
const UserModal = ({ user, onSave, onClose }: { user: any, onSave: (data: any) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState({
        new_username: user?.username || '',
        display_name: user?.display_name || '',
        role: user?.role || 'invite',
        permissions: user?.permissions || {
            view_dashboard: true,
            view_emma: true,
            save_conversations: false,
            view_own_history: false,
            view_all_history: false
        }
    });

    const ROLES = ['invite', 'client', 'daniel', 'gob', 'admin'];

    // Auto-set permissions based on role change
    useEffect(() => {
        if (!user && formData.role) {
             const defaultPerms: any = {
                view_dashboard: true,
                view_emma: true,
                save_conversations: false,
                view_own_history: false,
                view_all_history: false
             };
             
             if (['daniel', 'gob', 'admin'].includes(formData.role)) {
                 defaultPerms.save_conversations = true;
                 defaultPerms.view_own_history = true;
             }
             if (formData.role === 'admin') {
                 defaultPerms.view_all_history = true;
             }
             setFormData(prev => ({ ...prev, permissions: defaultPerms }));
        }
    }, [formData.role]);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{user ? 'Edit User' : 'Create User'}</h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs uppercase text-slate-400 mb-1">Username</label>
                    <input 
                        type="text" 
                        value={formData.new_username}
                        onChange={e => setFormData({...formData, new_username: e.target.value})}
                        disabled={!!user} // Cannot change username after creation easily
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                        placeholder="john.doe"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase text-slate-400 mb-1">Display Name</label>
                    <input 
                        type="text" 
                        value={formData.display_name}
                        onChange={e => setFormData({...formData, display_name: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                        placeholder="John Doe"
                    />
                </div>

                <div>
                    <label htmlFor="user-role-select" className="block text-xs uppercase text-slate-400 mb-1">Role</label>
                    <select 
                        id="user-role-select"
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    >
                        {ROLES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                    </select>
                </div>

                <div className="border-t border-slate-700 pt-4 mt-2">
                    <label className="block text-xs uppercase text-slate-400 mb-2">Permissions</label>
                    <div className="space-y-2">
                        {Object.entries(formData.permissions).map(([key, val]) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/50 p-1 rounded">
                                <input 
                                    type="checkbox" 
                                    checked={val as boolean}
                                    onChange={e => setFormData({
                                        ...formData, 
                                        permissions: { ...formData.permissions, [key]: e.target.checked }
                                    })}
                                    className="rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-mono">{key}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
                <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
                <button 
                    onClick={() => onSave(formData)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                >
                    Save User
                </button>
            </div>
        </div>
    );
};
