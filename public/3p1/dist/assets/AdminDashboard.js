import { r as reactExports, j as jsxRuntimeExports, q as ForwardRef, g as ForwardRef$1, s as ForwardRef$2 } from "./index.js";
const AdminDashboard = ({ onRepair, isRepairing }) => {
  const [activeTab, setActiveTab] = reactExports.useState("warehouse");
  const [stats, setStats] = reactExports.useState(null);
  const [details, setDetails] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [filter, setFilter] = reactExports.useState("all");
  const [inspectItem, setInspectItem] = reactExports.useState(null);
  const [users, setUsers] = reactExports.useState([]);
  const [loadingUsers, setLoadingUsers] = reactExports.useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = reactExports.useState(false);
  const [editingUser, setEditingUser] = reactExports.useState(null);
  const [currentUser] = reactExports.useState(() => {
    try {
      const stored = sessionStorage.getItem("gob-user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-warehouse-status");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setDetails(data.details);
      }
    } catch (e) {
      console.error("Failed to fetch admin status:", e);
    } finally {
      setLoading(false);
    }
  };
  const fetchUsers = async () => {
    if (!currentUser) return;
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "list_users",
          admin_username: currentUser.username
        })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        console.error("Error fetching users:", data.error);
      }
    } catch (e) {
      console.error("Failed to fetch users:", e);
    } finally {
      setLoadingUsers(false);
    }
  };
  reactExports.useEffect(() => {
    if (activeTab === "warehouse") fetchStatus();
    if (activeTab === "users") fetchUsers();
  }, [isRepairing, activeTab]);
  const filteredDetails = details.filter((item) => {
    if (filter === "healthy") return item.healthScore === 100;
    if (filter === "issue") return item.healthScore < 100;
    return true;
  });
  const getStatusColor = (score) => {
    if (score === 100) return "text-green-400";
    if (score > 50) return "text-yellow-400";
    return "text-red-400";
  };
  const handleSaveUser = async (userData) => {
    if (!currentUser) return;
    const action = editingUser ? "update_user" : "create_user";
    const payload = editingUser ? { action, admin_username: currentUser.username, target_id: editingUser.id, updates: userData } : { action, admin_username: currentUser.username, ...userData };
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsUserModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        alert("Error saving user: " + data.error);
      }
    } catch (e) {
      console.error("Save failed:", e);
      alert("Save failed");
    }
  };
  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    if (!currentUser) return;
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_user",
          admin_username: currentUser.username,
          target_id: userId
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert("Delete failed: " + data.error);
      }
    } catch (e) {
      alert("Delete failed");
    }
  };
  const BooleanPill = ({ active, label }) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] px-1.5 py-0.5 rounded border ${active ? "bg-green-900/30 border-green-800 text-green-300" : "bg-red-900/30 border-red-800 text-red-400 opacity-50"}`, children: label });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col bg-slate-900 text-white overflow-hidden relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "w-6 h-6 text-purple-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold", children: "Admin Control" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-slate-800 rounded-lg p-1 gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setActiveTab("warehouse"),
              className: `px-3 py-1 text-sm rounded-md transition-all ${activeTab === "warehouse" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-300"}`,
              children: "Warehouse"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setActiveTab("users"),
              className: `px-3 py-1 text-sm rounded-md transition-all ${activeTab === "users" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-300"}`,
              children: "Users & Roles"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: activeTab === "warehouse" ? fetchStatus : fetchUsers,
          className: "p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors",
          title: "Refresh",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$1, { className: `w-5 h-5 ${loading || loadingUsers ? "animate-spin" : ""}` })
        }
      )
    ] }),
    activeTab === "warehouse" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      stats && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-4 p-4 border-b border-slate-800 bg-slate-900/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-800/50 p-3 rounded border border-slate-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-slate-400 text-xs uppercase tracking-wider", children: "Total Tickers" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-white", children: stats.totalTickers })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-green-900/20 p-3 rounded border border-green-900/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-green-400 text-xs uppercase tracking-wider", children: "Fully Synced" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-green-400", children: stats.fullySynced })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-yellow-900/20 p-3 rounded border border-yellow-900/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-yellow-400 text-xs uppercase tracking-wider", children: "Partial Data" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-yellow-400", children: stats.partiallySynced })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-800 p-3 rounded border border-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-slate-300 text-xs uppercase tracking-wider", children: "Health Coverage" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-bold text-blue-400", children: [
            stats.coverage,
            "%"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 p-4 pb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setFilter("all"),
            className: `px-3 py-1 rounded text-sm ${filter === "all" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`,
            children: "All"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setFilter("issue"),
            className: `px-3 py-1 rounded text-sm ${filter === "issue" ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`,
            children: "Issues / Partial"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setFilter("healthy"),
            className: `px-3 py-1 rounded text-sm ${filter === "healthy" ? "bg-green-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`,
            children: "Healthy (100%)"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto p-4 pt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border-collapse text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-slate-800 sticky top-0 z-10 font-bold text-slate-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 border-b border-slate-700", children: "Ticker" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 border-b border-slate-700", children: "Health" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 border-b border-slate-700", children: "Range" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 border-b border-slate-700", children: "Data Points" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 border-b border-slate-700", children: "Last Update" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 border-b border-slate-700 text-right", children: "Action" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-800", children: [
          filteredDetails.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-800/30 transition-colors cursor-pointer", onClick: () => setInspectItem(item), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-mono font-bold text-blue-300", children: item.ticker }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `w-2 h-2 rounded-full ${item.healthScore === 100 ? "bg-green-500" : item.healthScore > 0 ? "bg-yellow-500" : "bg-red-500"}` }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: getStatusColor(item.healthScore), children: [
                item.healthScore,
                "%"
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: item.lastFinancialYear ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-xs px-2 py-0.5 rounded ${item.lastFinancialYear < (/* @__PURE__ */ new Date()).getFullYear() - 1 ? "bg-yellow-900/50 text-yellow-400" : "bg-slate-800 text-slate-300"}`, children: [
              item.lastFinancialYear,
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-500", children: [
                "(",
                item.yearsCount,
                "y)"
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "-" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(BooleanPill, { active: item.data.financials, label: "FIN" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(BooleanPill, { active: item.data.estimates, label: "EST" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(BooleanPill, { active: item.data.insider, label: "INS" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(BooleanPill, { active: item.data.institutional, label: "OWN" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(BooleanPill, { active: item.data.surprises, label: "SUR" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 text-slate-400 text-xs", children: [
              new Date(item.updatedAt).toLocaleDateString(),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] opacity-60", children: new Date(item.updatedAt).toLocaleTimeString() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  onRepair(item.ticker);
                },
                disabled: isRepairing === item.ticker,
                className: "bg-slate-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                children: isRepairing === item.ticker ? "Syncing..." : "Sync"
              }
            ) })
          ] }, item.ticker)),
          filteredDetails.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 6, className: "p-8 text-center text-slate-500", children: "No tickers found matching filter." }) })
        ] })
      ] }) })
    ] }),
    activeTab === "users" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 flex justify-between items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "User List" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setEditingUser(null);
              setIsUserModalOpen(true);
            },
            className: "bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "+ Add User" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto p-4 pt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border-collapse text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-slate-800 sticky top-0 z-10 font-bold text-slate-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 border-b border-slate-700", children: "Username" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 border-b border-slate-700", children: "Display Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 border-b border-slate-700", children: "Role" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 border-b border-slate-700", children: "Last Login" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 border-b border-slate-700 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-800", children: [
          users.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-800/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-mono text-blue-300", children: u.username }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: u.display_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-2 py-1 rounded text-xs font-bold uppercase
                                        ${u.role === "admin" ? "bg-purple-900/50 text-purple-400" : u.role === "daniel" || u.role === "gob" ? "bg-blue-900/50 text-blue-400" : "bg-slate-800 text-slate-400"}
                                    `, children: u.role }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-slate-400", children: u.last_login ? new Date(u.last_login).toLocaleDateString() : "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 text-right flex justify-end gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => {
                    setEditingUser(u);
                    setIsUserModalOpen(true);
                  },
                  className: "text-slate-400 hover:text-white",
                  children: "Edit"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => handleDeleteUser(u.id),
                  className: "text-red-400 hover:text-red-300",
                  children: "Delete"
                }
              )
            ] })
          ] }, u.id || u.username)),
          users.length === 0 && !loadingUsers && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "p-8 text-center text-slate-500", children: "No users found or permissions denied." }) })
        ] })
      ] }) })
    ] }),
    inspectItem && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-8 backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-950 border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-bold text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$2, { className: "w-5 h-5 text-blue-400" }),
          "Raw Data Inspector: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-blue-300", children: inspectItem.ticker })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setInspectItem(null),
            className: "text-slate-400 hover:text-white",
            children: "Close"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto p-4 bg-[#0d1117] text-slate-300 font-mono text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { children: JSON.stringify(inspectItem, null, 2) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 border-t border-slate-800 bg-slate-900 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            onRepair(inspectItem.ticker);
            setInspectItem(null);
          },
          className: "bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded",
          children: "Force Full Re-Sync"
        }
      ) })
    ] }) }),
    isUserModalOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      UserModal,
      {
        user: editingUser,
        onSave: handleSaveUser,
        onClose: () => setIsUserModalOpen(false)
      }
    ) })
  ] });
};
const UserModal = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = reactExports.useState({
    new_username: (user == null ? void 0 : user.username) || "",
    display_name: (user == null ? void 0 : user.display_name) || "",
    role: (user == null ? void 0 : user.role) || "invite",
    permissions: (user == null ? void 0 : user.permissions) || {
      view_dashboard: true,
      view_emma: true,
      save_conversations: false,
      view_own_history: false,
      view_all_history: false
    }
  });
  const ROLES = ["invite", "client", "daniel", "gob", "admin"];
  reactExports.useEffect(() => {
    if (!user && formData.role) {
      const defaultPerms = {
        view_dashboard: true,
        view_emma: true,
        save_conversations: false,
        view_own_history: false,
        view_all_history: false
      };
      if (["daniel", "gob", "admin"].includes(formData.role)) {
        defaultPerms.save_conversations = true;
        defaultPerms.view_own_history = true;
      }
      if (formData.role === "admin") {
        defaultPerms.view_all_history = true;
      }
      setFormData((prev) => ({ ...prev, permissions: defaultPerms }));
    }
  }, [formData.role]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold mb-4", children: user ? "Edit User" : "Create User" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs uppercase text-slate-400 mb-1", children: "Username" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: formData.new_username,
            onChange: (e) => setFormData({ ...formData, new_username: e.target.value }),
            disabled: !!user,
            className: "w-full bg-slate-900 border border-slate-700 rounded p-2 text-white",
            placeholder: "john.doe"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs uppercase text-slate-400 mb-1", children: "Display Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: formData.display_name,
            onChange: (e) => setFormData({ ...formData, display_name: e.target.value }),
            className: "w-full bg-slate-900 border border-slate-700 rounded p-2 text-white",
            placeholder: "John Doe"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "user-role-select", className: "block text-xs uppercase text-slate-400 mb-1", children: "Role" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "select",
          {
            id: "user-role-select",
            value: formData.role,
            onChange: (e) => setFormData({ ...formData, role: e.target.value }),
            className: "w-full bg-slate-900 border border-slate-700 rounded p-2 text-white",
            children: ROLES.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r, children: r.toUpperCase() }, r))
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-700 pt-4 mt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs uppercase text-slate-400 mb-2", children: "Permissions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: Object.entries(formData.permissions).map(([key, val]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer hover:bg-slate-700/50 p-1 rounded", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: val,
              onChange: (e) => setFormData({
                ...formData,
                permissions: { ...formData.permissions, [key]: e.target.checked }
              }),
              className: "rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-mono", children: key })
        ] }, key)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3 mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "px-4 py-2 text-slate-300 hover:text-white", children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onSave(formData),
          className: "px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium",
          children: "Save User"
        }
      )
    ] })
  ] });
};
export {
  AdminDashboard
};
