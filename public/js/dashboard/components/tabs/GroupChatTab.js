// Auto-converted from Next.js to React component
// Component: GroupChatTab (JSLAI RobotWeb Ultimate v5.0)

const { useState, useRef, useEffect, useCallback } = React;

const GroupChatTab = ({ isDarkMode = true, dashboardTab, onDashboardTabChange }) => {
  const [providers, setProviders] = useState({});
  const [currentProvider, setCurrentProvider] = useState('simulation');
  const [messages, setMessages] = useState([{ 
    role: 'assistant', 
    content: '🤖 **JSLAI RobotWeb Ultimate v5**\n\nAdvanced AI browser automation.\n\n**Try:** Hotels in Paris • React on GitHub • iPhone on Amazon' 
  }]);
  const [actions, setActions] = useState([]);
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [screenshot, setScreenshot] = useState('');
  const [currentUrl, setCurrentUrl] = useState('about:blank');
  const [debugUrl, setDebugUrl] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [input, setInput] = useState('');
  const [activePanel, setActivePanel] = useState('chat');
  const [activeTab, setActiveTab] = useState('main');
  const [expertMode, setExpertMode] = useState(false);
  const [stats, setStats] = useState(null);
  const [themes, setThemes] = useState({});
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [workflows, setWorkflows] = useState([]);
  const [workflowCategory, setWorkflowCategory] = useState('all');
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [adminSection, setAdminSection] = useState('providers');
  const msgEndRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    // Charger la configuration
    fetch('/api/groupchat/config')
      .then(r => {
        if (!r.ok) throw new Error('Config fetch failed');
        return r.json();
      })
      .then(d => { 
        if (d && d.providers) {
          setProviders(d.providers); 
          setCurrentProvider(d.defaultProvider || 'simulation'); 
        }
      })
      .catch((err) => {
        console.warn('⚠️ GroupChat: Erreur chargement config, utilisation du mode simulation:', err);
        setProviders({ 
          simulation: { 
            id:'simulation', 
            name:'Simulation', 
            description:'Free demo', 
            status:'ready', 
            cost:'FREE', 
            icon:'🎭', 
            endpoint:'/api/groupchat/simulate' 
          } 
        });
        setCurrentProvider('simulation');
      });
    
    // Charger les thèmes
    fetch('/api/groupchat/admin')
      .then(r => {
        if (!r.ok) throw new Error('Admin fetch failed');
        return r.json();
      })
      .then(d => { 
        if (d && d.themes) {
          setThemes(d.themes); 
        }
      })
      .catch((err) => {
        console.warn('⚠️ GroupChat: Erreur chargement thèmes:', err);
      });
    
    // Charger les workflows
    fetch('/api/groupchat/workflows')
      .then(r => {
        if (!r.ok) throw new Error('Workflows fetch failed');
        return r.json();
      })
      .then(d => { 
        if (d && d.workflows) {
          setWorkflows(d.workflows); 
        }
      })
      .catch((err) => {
        console.warn('⚠️ GroupChat: Erreur chargement workflows:', err);
      });
  }, []);

  useEffect(() => { 
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  const provider = providers[currentProvider];

  const runTest = async (prov = 'all') => {
    setTesting(true); 
    setTestResults(null);
    try { 
      const res = await fetch('/api/groupchat/test', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ provider: prov }) 
      }); 
      setTestResults(await res.json()); 
    }
    catch (e) { 
      setTestResults({ error: e.message }); 
    }
    setTesting(false);
  };

  const executeTask = useCallback(async (task) => {
    if (!provider) return;
    setIsRunning(true); 
    setActions([]); 
    setResults([]); 
    setLogs([]); 
    setScreenshot(''); 
    setDebugUrl(''); 
    setStats(null);
    setMessages(p => [...p, { role: 'user', content: task }, { role: 'assistant', content: '🚀 Starting...' }]);
    if (expertMode) setActivePanel('logs');
    setActiveTab('main');
    abortRef.current = new AbortController();
    try {
      const res = await fetch(provider.endpoint, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ task, expertMode }), 
        signal: abortRef.current.signal 
      });
      const reader = res.body?.getReader(); 
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read(); 
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.type === 'status') setMessages(p => { 
              const n=[...p]; 
              if(n.length && n[n.length-1].role==='assistant') n[n.length-1]={...n[n.length-1],content:d.message}; 
              return n; 
            });
            else if (d.type === 'session') { if (d.debugUrl) setDebugUrl(d.debugUrl); }
            else if (d.type === 'actions') { 
              setActions(d.actions.map((a)=>({...a,status:'pending'}))); 
              if (!expertMode) setActivePanel('actions'); 
            }
            else if (d.type === 'action_start') setActions(p => p.map((a,i) => i===d.index ? {...a,status:'running'} : a));
            else if (d.type === 'action_complete') { 
              setActions(p => p.map((a,i) => i===d.index ? {...a,status:d.success?'completed':'error'} : a)); 
              if (d.screenshot) setScreenshot(d.screenshot); 
              if (d.url) setCurrentUrl(d.url); 
            }
            else if (d.type === 'log') setLogs(p => [...p, { role: 'log', content: d.message, level: d.level, time: d._t }]);
            else if (d.type === 'complete') { 
              if (d.results?.length) setResults(d.results); 
              setStats(d.stats); 
              setMessages(p => [...p, { role: 'assistant', content: `✅ **Done!** ${d.results?.length||0} results in ${((d.stats?.totalTime||0)/1000).toFixed(1)}s` }]); 
              if (d.results?.length) setActivePanel('results'); 
            }
            else if (d.type === 'error') setMessages(p => [...p, { role: 'system', content: `❌ ${d.message}` }]);
            else if (d.type === 'init' && expertMode) setLogs(p => [...p, { role: 'log', content: `Init: ${d.provider} v${d.version}`, level: 'info', time: 0 }]);
          } catch {}
        }
      }
    } catch (e) { 
      if (e.name !== 'AbortError') setMessages(p => [...p, { role: 'system', content: `❌ ${e.message}` }]); 
    }
    setIsRunning(false);
  }, [provider, expertMode]);

  const executeWorkflow = async (workflow) => {
    const value = prompt(`Enter ${workflow.variables[0]?.label || 'value'}:`, workflow.variables[0]?.placeholder || '');
    if (!value) return;
    const vars = {}; 
    vars[workflow.variables[0]?.name || 'input'] = value;
    let task = workflow.taskTemplate;
    for (const [k, v] of Object.entries(vars)) task = task.replace(`{${k}}`, String(v));
    await executeTask(task);
  };

  const handleSubmit = (e) => { 
    e.preventDefault(); 
    if (input.trim() && !isRunning) { 
      executeTask(input.trim()); 
      setInput(''); 
    } 
  };
  const stopExec = () => { 
    abortRef.current?.abort(); 
    setIsRunning(false); 
    setMessages(p => [...p, { role: 'system', content: '⏹ Stopped' }]); 
  };

  const icons = { navigate:'🌐', click:'👆', type:'⌨️', scroll:'📜', extract:'📋', wait:'⏳', press:'⏎', hover:'👋' };
  const fmt = (s) => s.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');

  // Styles adaptés au thème du dashboard
  const themeStyles = {
    bg: isDarkMode ? 'var(--theme-bg, #030306)' : 'var(--theme-bg, #f5f5f7)',
    surface: isDarkMode ? 'var(--theme-surface, #0a0a0f)' : 'var(--theme-surface, #ffffff)',
    text: isDarkMode ? 'var(--theme-text, #fafaff)' : 'var(--theme-text, #1d1d1f)',
    primary: 'var(--theme-primary, #00e5ff)',
    border: 'var(--theme-border, rgba(255,255,255,0.05))',
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background: themeStyles.bg, color: themeStyles.text }}>
            {/* Navigation Secondaire */}
            {window.SecondaryNavBar && (
                <window.SecondaryNavBar 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab} 
                    isDarkMode={isDarkMode} 
                />
            )}


      <header style={{ background: `linear-gradient(180deg,${themeStyles.surface},${themeStyles.bg})`, padding:'8px 16px', display:'flex', alignItems:'center', gap:12, borderBottom:`1px solid ${themeStyles.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="anim-float" style={{ fontSize:26 }}>🤖</span>
          <div><div style={{ fontSize:18, fontWeight:800 }} className="gradient-text">JSLAI RobotWeb</div><div style={{ fontSize:9, color:'var(--theme-text-secondary, #a0a0b0)', letterSpacing:'1px' }}>ULTIMATE v5.0</div></div>
        </div>
        <div style={{ display:'flex', gap:2, background:themeStyles.surface, borderRadius:'8px', padding:3, marginLeft:16 }}>
          {[{id:'main',icon:'🎯',label:'Main'},{id:'workflows',icon:'⚡',label:'Workflows'},{id:'admin',icon:'⚙️',label:'Admin'}].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ padding:'6px 14px', borderRadius:'8px', border:'none', background: activeTab===t.id ? themeStyles.surface : 'transparent', color: activeTab===t.id ? themeStyles.primary : 'var(--theme-text-secondary, #a0a0b0)', cursor:'pointer', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>{t.icon} {t.label}</button>
          ))}
        </div>
        <div style={{ flex:1 }}/>
        <select value={currentProvider} onChange={e=>setCurrentProvider(e.target.value)} disabled={isRunning} style={{ background:themeStyles.surface, border:`1px solid ${themeStyles.border}`, borderRadius:'8px', padding:'6px 24px 6px 10px', color:themeStyles.text, fontSize:12, cursor:'pointer' }}>
          {Object.values(providers).map(p => <option key={p.id} value={p.id} disabled={p.status!=='ready'}>{p.icon} {p.name}</option>)}
        </select>
        <button onClick={()=>setExpertMode(!expertMode)} style={{ padding:'6px 10px', borderRadius:'8px', border:`1px solid ${themeStyles.border}`, background: expertMode ? 'rgba(179,136,255,0.15)' : themeStyles.surface, color: expertMode ? '#b388ff' : 'var(--theme-text-secondary, #a0a0b0)', cursor:'pointer', fontSize:11, fontWeight:600 }}>{expertMode ? '🔬' : '👤'}</button>
        {debugUrl && <a href={debugUrl} target="_blank" className="anim-glow" style={{ padding:'5px 10px', background:'rgba(255,82,82,0.1)', border:'1px solid rgba(255,82,82,.3)', borderRadius:'8px', color:'#ff5252', fontSize:10, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}><span className="status-dot running anim-pulse"/> LIVE</a>}
        <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', background:themeStyles.surface, borderRadius:'8px', border:`1px solid ${themeStyles.border}` }}><span className={`status-dot ${isRunning ? 'running' : provider?.status==='ready' ? 'ready' : 'error'}`} style={isRunning ? {animation:'pulse 1s infinite'} : {}}/><span style={{ fontSize:10, color:'var(--theme-text-secondary, #a0a0b0)' }}>{isRunning ? 'Running' : 'Ready'}</span></div>
      </header>

      {provider && activeTab === 'main' && <div style={{ background: currentProvider==='simulation' ? 'rgba(179,136,255,0.15)' : 'rgba(0,229,255,0.15)', borderBottom:`1px solid ${themeStyles.border}`, padding:'5px 16px', display:'flex', alignItems:'center', gap:8, fontSize:11 }}>
        <span>{provider.icon}</span><span><strong>{provider.name}</strong> — {provider.description}</span>
        <span style={{ marginLeft:'auto', color: currentProvider==='simulation' ? '#b388ff' : '#00e676', fontWeight:600 }}>{provider.cost}</span>
        {stats && <span style={{ color:'var(--theme-text-secondary, #a0a0b0)' }}>• {(stats.totalTime/1000).toFixed(1)}s • {stats.results} results</span>}
      </div>}

      <main style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {activeTab === 'main' && <>
          <section style={{ flex:'0 0 65%', display:'flex', flexDirection:'column', borderRight:`1px solid ${themeStyles.border}` }}>
            <div style={{ padding:'6px 12px', background:themeStyles.surface, borderBottom:`1px solid ${themeStyles.border}`, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', gap:4 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#ff5f57' }}/><span style={{ width:10, height:10, borderRadius:'50%', background:'#febc2e' }}/><span style={{ width:10, height:10, borderRadius:'50%', background:'#28c840' }}/></div>
              <div style={{ flex:1, display:'flex', alignItems:'center', background:themeStyles.bg, border:`1px solid ${themeStyles.border}`, borderRadius:'8px', padding:'6px 10px', gap:5 }}>
                <span style={{ color: currentUrl.startsWith('https') ? '#00e676' : 'var(--theme-text-secondary, #a0a0b0)', fontSize:11 }}>{currentUrl.startsWith('https') ? '🔒' : '🔓'}</span>
                <span style={{ fontSize:11, color:themeStyles.text, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'monospace' }}>{currentUrl}</span>
              </div>
            </div>
            <div style={{ flex:1, overflow:'hidden', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
              {screenshot ? <img src={screenshot} alt="Browser" style={{ maxWidth:'100%', maxHeight:'100%', borderRadius:'12px', boxShadow:'0 4px 24px rgba(0,0,0,0.4)' }}/> : <div style={{ textAlign:'center', color:'var(--theme-text-secondary, #a0a0b0)', maxWidth:320 }}><div className="anim-float" style={{ fontSize:56, marginBottom:16, opacity:.3 }}>🤖</div><div style={{ fontSize:18, marginBottom:8, color:themeStyles.text, fontWeight:700 }}>JSLAI RobotWeb Ultimate</div><div style={{ fontSize:12, lineHeight:1.5, color:'var(--theme-text-secondary, #a0a0b0)' }}>Enter a task or select a workflow</div></div>}
            </div>
          </section>
          <aside style={{ flex:'0 0 35%', display:'flex', flexDirection:'column', background:themeStyles.surface }}>
            <div className="tabs" style={{ margin:8, marginBottom:0 }}>
              {(['chat','actions','results', ...(expertMode ? ['logs'] : [])]).map(tab => (
                <button key={tab} onClick={()=>setActivePanel(tab)} className={`tab ${activePanel===tab ? 'active' : ''}`} style={{ padding:'6px 12px', borderRadius:'8px', border:'none', background: activePanel===tab ? themeStyles.surface : 'transparent', color: activePanel===tab ? themeStyles.primary : 'var(--theme-text-secondary, #a0a0b0)', cursor:'pointer', fontSize:11, fontWeight:600 }}>{tab==='chat' ? '💬' : tab==='actions' ? '⚡' : tab==='results' ? '📊' : '📜'} {tab}{tab==='actions' && actions.length ? ` (${actions.length})` : ''}{tab==='results' && results.length ? ` (${results.length})` : ''}</button>
              ))}
            </div>
            <div style={{ flex:1, overflow:'auto', padding:10 }}>
              {activePanel==='chat' && <div style={{ display:'flex', flexDirection:'column', gap:6 }}>{messages.map((m,i) => <div key={i} className="anim-slide" style={{ padding:'8px 10px', borderRadius:'8px', background: m.role==='user' ? themeStyles.primary : m.role==='system' ? 'rgba(255,82,82,0.1)' : themeStyles.surface, color: m.role==='user' ? '#000' : m.role==='system' ? '#ff5252' : themeStyles.text, marginLeft: m.role==='user' ? 'auto' : 0, maxWidth:'85%', fontSize:12, lineHeight:1.5 }} dangerouslySetInnerHTML={{ __html: fmt(m.content) }}/>)}<div ref={msgEndRef}/></div>}
              {activePanel==='actions' && <div style={{ display:'flex', flexDirection:'column', gap:5 }}>{!actions.length ? <div style={{ textAlign:'center', color:'var(--theme-text-secondary, #a0a0b0)', padding:32 }}><div style={{ fontSize:32, marginBottom:10, opacity:.3 }}>⚡</div><div style={{ fontSize:11 }}>Actions appear here</div></div> : actions.map((a,i) => <div key={i} className="anim-slideX" style={{ padding:'8px 10px', borderLeft:`3px solid ${a.status==='completed' ? '#00e676' : a.status==='running' ? '#ffc400' : a.status==='error' ? '#ff5252' : 'var(--theme-text-secondary, #a0a0b0)'}`, display:'flex', gap:8, alignItems:'center', background:themeStyles.surface, borderRadius:'8px' }}><span style={{ fontSize:14 }}>{icons[a.type]||'⚡'}</span><div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', color:themeStyles.primary }}>{a.type}</div><div style={{ fontSize:10, color:'var(--theme-text-secondary, #a0a0b0)' }} className="truncate">{a.description}</div></div><span className={`status-dot ${a.status==='completed' ? 'ready' : a.status==='running' ? 'running' : a.status==='error' ? 'error' : 'pending'}`} style={a.status==='running' ? {animation:'pulse 1s infinite'} : {}}/></div>)}</div>}
              {activePanel==='results' && <div style={{ display:'flex', flexDirection:'column', gap:6 }}>{!results.length ? <div style={{ textAlign:'center', color:'var(--theme-text-secondary, #a0a0b0)', padding:32 }}><div style={{ fontSize:32, marginBottom:10, opacity:.3 }}>📊</div><div style={{ fontSize:11 }}>Results appear here</div></div> : <>{results.length > 0 && <div style={{ alignSelf:'flex-start', marginBottom:4, padding:'4px 8px', background:'rgba(0,230,118,0.1)', borderRadius:'4px', color:'#00e676', fontSize:10, fontWeight:600 }}>✅ {results.length} results</div>}{results.map((r,i) => <div key={i} className="anim-slide" onClick={()=>r.link && window.open(r.link,'_blank')} style={{ padding:10, cursor: r.link ? 'pointer' : 'default', background:themeStyles.surface, borderRadius:'8px', border:`1px solid ${themeStyles.border}` }}>{r.title && <div style={{ fontSize:12, fontWeight:600, color:themeStyles.primary, marginBottom:3 }} className="truncate">{r.title}</div>}{r.description && <div style={{ fontSize:10, color:'var(--theme-text-secondary, #a0a0b0)', lineHeight:1.4 }} className="line-clamp-2">{r.description}</div>}{(r.price || r.rating || r.stars || r.views) && <div style={{ display:'flex', gap:4, marginTop:5, flexWrap:'wrap' }}>{r.price && <span style={{ padding:'2px 6px', background:'rgba(0,230,118,0.1)', borderRadius:'4px', color:'#00e676', fontSize:9 }}>{r.price}</span>}{r.rating && <span style={{ padding:'2px 6px', background:'rgba(255,196,0,0.1)', borderRadius:'4px', color:'#ffc400', fontSize:9 }}>⭐ {r.rating}</span>}{r.stars && <span style={{ padding:'2px 6px', background:'rgba(255,196,0,0.1)', borderRadius:'4px', color:'#ffc400', fontSize:9 }}>{r.stars} ⭐</span>}{r.reviews && <span style={{ padding:'2px 6px', background:themeStyles.surface, borderRadius:'4px', color:'var(--theme-text-secondary, #a0a0b0)', fontSize:9 }}>{r.reviews}</span>}{r.views && <span style={{ padding:'2px 6px', background:themeStyles.surface, borderRadius:'4px', color:'var(--theme-text-secondary, #a0a0b0)', fontSize:9 }}>{r.views}</span>}</div>}</div>)}</>}</div>}
              {activePanel==='logs' && <div style={{ display:'flex', flexDirection:'column', gap:3, fontFamily:'monospace', fontSize:10 }}>{!logs.length ? <div style={{ textAlign:'center', color:'var(--theme-text-secondary, #a0a0b0)', padding:32 }}><div style={{ fontSize:32, marginBottom:10, opacity:.3 }}>📜</div><div style={{ fontSize:11 }}>Expert logs here</div></div> : logs.map((l,i) => <div key={i} className="anim-slide" style={{ padding:'4px 8px', background:themeStyles.surface, borderRadius:4, borderLeft:`2px solid ${l.level==='error' ? '#ff5252' : l.level==='warn' ? '#ffc400' : l.level==='debug' ? 'var(--theme-text-secondary, #a0a0b0)' : themeStyles.primary}` }}><span style={{ color:'var(--theme-text-secondary, #a0a0b0)' }}>[{l.time}ms]</span> <span style={{ color: l.level==='error' ? '#ff5252' : l.level==='warn' ? '#ffc400' : 'var(--theme-text-secondary, #a0a0b0)' }}>{l.content}</span></div>)}</div>}
            </div>
            <div style={{ padding:10, background:themeStyles.bg, borderTop:`1px solid ${themeStyles.border}` }}><form onSubmit={handleSubmit}><div style={{ display:'flex', gap:5, background:themeStyles.surface, border:`1px solid ${themeStyles.border}`, borderRadius:'12px', padding:6 }}><input type="text" value={input} onChange={e=>setInput(e.target.value)} placeholder="Describe your task..." disabled={isRunning} style={{ flex:1, border:'none', background:'transparent', padding:'6px 4px', color:themeStyles.text }} />{isRunning ? <button type="button" onClick={stopExec} style={{ padding:'6px 12px', borderRadius:'8px', border:`1px solid #ff5252`, background:'transparent', color:'#ff5252', cursor:'pointer' }}>⏹</button> : <button type="submit" disabled={!input.trim()} style={{ padding:'6px 12px', borderRadius:'8px', border:'none', background: input.trim() ? 'linear-gradient(135deg,#00e5ff 0%,#b388ff 50%,#ff80ab 100%)' : themeStyles.surface, color: input.trim() ? '#000' : 'var(--theme-text-secondary, #a0a0b0)', cursor: input.trim() ? 'pointer' : 'not-allowed', fontWeight:600 }}>Run →</button>}</div></form></div>
          </aside>
        </>}

        {activeTab === 'workflows' && <div style={{ flex:1, padding:20, overflow:'auto' }}>
          <div style={{ marginBottom:20 }}><h2 style={{ fontSize:20, fontWeight:700, marginBottom:4, color:themeStyles.text }}>⚡ Workflows</h2><p style={{ color:'var(--theme-text-secondary, #a0a0b0)', fontSize:13 }}>Pre-built automations</p></div>
          <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>{['all','travel','shopping','development','career','research','social','media'].map(cat => (<button key={cat} onClick={()=>setWorkflowCategory(cat)} style={{ padding:'6px 12px', borderRadius:'8px', border:`1px solid ${themeStyles.border}`, background: workflowCategory===cat ? themeStyles.primary : themeStyles.surface, color: workflowCategory===cat ? '#000' : themeStyles.text, cursor:'pointer', fontSize:11, fontWeight:600 }}>{cat.charAt(0).toUpperCase()+cat.slice(1)}</button>))}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>{workflows.filter(w => workflowCategory === 'all' || w.category === workflowCategory).map(w => (<div key={w.id} onClick={() => executeWorkflow(w)} style={{ cursor:'pointer', padding:12, background:themeStyles.surface, borderRadius:'12px', border:`1px solid ${themeStyles.border}` }}><div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}><span style={{ fontSize:28 }}>{w.icon}</span><div><div style={{ fontWeight:600, fontSize:14, color:themeStyles.text }}>{w.name}</div><div style={{ fontSize:11, color:'var(--theme-text-secondary, #a0a0b0)' }}>{w.description}</div></div></div><div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>{w.variables.slice(0,3).map(v => <span key={v.name} style={{ padding:'2px 6px', background:themeStyles.bg, borderRadius:'4px', color:'var(--theme-text-secondary, #a0a0b0)', fontSize:9 }}>{v.label}</span>)}</div></div>))}</div>
        </div>}

        {activeTab === 'admin' && <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          <div style={{ width:200, background:themeStyles.surface, borderRight:`1px solid ${themeStyles.border}`, padding:12 }}>{[{id:'providers',icon:'🔌',label:'Providers'},{id:'themes',icon:'🎨',label:'Themes'},{id:'llm',icon:'🧠',label:'LLM'},{id:'test',icon:'🧪',label:'Test'}].map(item => (<button key={item.id} onClick={()=>setAdminSection(item.id)} style={{ width:'100%', justifyContent:'flex-start', marginBottom:4, padding:'8px 12px', borderRadius:'8px', border:'none', background: adminSection===item.id ? themeStyles.bg : 'transparent', color: adminSection===item.id ? themeStyles.primary : themeStyles.text, cursor:'pointer', fontSize:12, fontWeight:600 }}>{item.icon} {item.label}</button>))}</div>
          <div style={{ flex:1, padding:20, overflow:'auto' }}>
            {adminSection === 'providers' && <div><h3 style={{ fontSize:18, fontWeight:700, marginBottom:16, color:themeStyles.text }}>🔌 Providers</h3><div style={{ display:'grid', gap:12 }}>{Object.values(providers).map(p => <div key={p.id} style={{ padding:12, background:themeStyles.surface, borderRadius:'12px', border:`1px solid ${themeStyles.border}` }}><div style={{ display:'flex', alignItems:'center', gap:12 }}><span style={{ fontSize:28 }}>{p.icon}</span><div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:14, color:themeStyles.text }}>{p.name}</div><div style={{ fontSize:11, color:'var(--theme-text-secondary, #a0a0b0)' }}>{p.description}</div></div><span style={{ padding:'4px 8px', borderRadius:'4px', background: p.status==='ready' ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)', color: p.status==='ready' ? '#00e676' : '#ff5252', fontSize:10, fontWeight:600 }}>{p.status==='ready' ? '✓ Ready' : '✗ Not configured'}</span></div><div style={{ marginTop:8, fontSize:11, color:'var(--theme-text-secondary, #a0a0b0)' }}>Cost: {p.cost}</div></div>)}</div></div>}
            {adminSection === 'themes' && <div><h3 style={{ fontSize:18, fontWeight:700, marginBottom:16, color:themeStyles.text }}>🎨 Themes</h3><div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>{Object.entries(themes).map(([id, t]) => (<div key={id} onClick={()=>setCurrentTheme(id)} style={{ cursor:'pointer', padding:12, background:themeStyles.surface, borderRadius:'12px', border: currentTheme===id ? `2px solid ${themeStyles.primary}` : `1px solid ${themeStyles.border}` }}><div style={{ display:'flex', gap:4, marginBottom:8 }}><div style={{ width:20, height:20, borderRadius:4, background:t.bg }}/><div style={{ width:20, height:20, borderRadius:4, background:t.primary }}/><div style={{ width:20, height:20, borderRadius:4, background:t.secondary }}/></div><div style={{ fontWeight:600, fontSize:13, color:themeStyles.text }}>{t.name}</div></div>))}</div></div>}
            {adminSection === 'llm' && <div><h3 style={{ fontSize:18, fontWeight:700, marginBottom:16, color:themeStyles.text }}>🧠 LLM Settings</h3><div style={{ padding:12, background:themeStyles.surface, borderRadius:'12px', border:`1px solid ${themeStyles.border}` }}><div style={{ marginBottom:12 }}><label style={{ fontSize:11, color:'var(--theme-text-secondary, #a0a0b0)', display:'block', marginBottom:4 }}>Model</label><select style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:`1px solid ${themeStyles.border}`, background:themeStyles.bg, color:themeStyles.text }} defaultValue="claude-sonnet-4-20250514"><option>claude-sonnet-4-20250514</option></select></div><div style={{ marginBottom:12 }}><label style={{ fontSize:11, color:'var(--theme-text-secondary, #a0a0b0)', display:'block', marginBottom:4 }}>Max Tokens</label><input type="number" style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:`1px solid ${themeStyles.border}`, background:themeStyles.bg, color:themeStyles.text }} defaultValue={4096}/></div><div><label style={{ fontSize:11, color:'var(--theme-text-secondary, #a0a0b0)', display:'block', marginBottom:4 }}>Custom Instructions</label><textarea style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:`1px solid ${themeStyles.border}`, background:themeStyles.bg, color:themeStyles.text }} rows={3} placeholder="Add instructions..."/></div></div></div>}
            {adminSection === 'test' && <div><h3 style={{ fontSize:18, fontWeight:700, marginBottom:16, color:themeStyles.text }}>🧪 Tests</h3><button onClick={()=>runTest('all')} disabled={testing} style={{ padding:'8px 16px', borderRadius:'8px', border:'none', background: testing ? themeStyles.surface : 'linear-gradient(135deg,#00e5ff 0%,#b388ff 50%,#ff80ab 100%)', color: testing ? 'var(--theme-text-secondary, #a0a0b0)' : '#000', cursor: testing ? 'not-allowed' : 'pointer', fontWeight:600, marginBottom:16 }}>{testing ? '🔄 Testing...' : '🧪 Test All'}</button>{testResults && <div style={{ padding:12, background:themeStyles.surface, borderRadius:'12px', border:`1px solid ${themeStyles.border}` }}>{testResults.tests?.map((t, i) => <div key={i} style={{ padding:'8px 0', borderBottom: i < testResults.tests.length-1 ? `1px solid ${themeStyles.border}` : 'none' }}><div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: t.hint ? 4 : 0 }}><span style={{ fontSize:13, color:themeStyles.text, fontWeight:500 }}>{t.name}</span><span style={{ padding:'4px 8px', borderRadius:'4px', background: t.status==='pass' ? 'rgba(0,230,118,0.1)' : t.status==='fail' ? 'rgba(255,82,82,0.1)' : 'rgba(255,196,0,0.1)', color: t.status==='pass' ? '#00e676' : t.status==='fail' ? '#ff5252' : '#ffc400', fontSize:10, fontWeight:600 }}>{t.status==='pass' ? '✓' : t.status==='fail' ? '✗' : '○'} {t.message}</span></div>{t.hint && <div style={{ marginTop:4, padding:'6px 8px', background:themeStyles.bg, borderRadius:'6px', fontSize:11, color:'var(--theme-text-secondary, #a0a0b0)', lineHeight:1.4, borderLeft:`3px solid ${t.status==='fail' ? '#ff5252' : '#ffc400'}` }}>💡 {t.hint}</div>}{t.latency && <div style={{ marginTop:2, fontSize:10, color:'var(--theme-text-secondary, #a0a0b0)' }}>⏱ {t.latency}ms</div>}</div>)}{testResults.summary && <div style={{ marginTop:12, padding:'8px 12px', background:themeStyles.bg, borderRadius:'8px', fontSize:12, color:'var(--theme-text-secondary, #a0a0b0)', fontWeight:600 }}>{testResults.summary}</div>}</div>}</div>}
          </div>
        </div>}
      </main>
    </div>
  );
};

window.GroupChatTab = GroupChatTab;

