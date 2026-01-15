'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

interface Provider { id: string; name: string; description: string; status: 'ready'|'not_configured'; cost: string; icon: string; endpoint: string; }
interface Action { type: string; description: string; status: 'pending'|'running'|'completed'|'error'; }
interface Message { role: 'user'|'assistant'|'system'|'log'; content: string; level?: string; time?: number; }
interface Result { title?: string; description?: string; link?: string; price?: string; rating?: string; [k: string]: any; }
interface Workflow { id: string; name: string; description: string; icon: string; category: string; variables: any[]; taskTemplate: string; }
interface Theme { name: string; bg: string; surface: string; text: string; primary: string; secondary: string; }

export default function App() {
  const [providers, setProviders] = useState<Record<string, Provider>>({});
  const [currentProvider, setCurrentProvider] = useState('simulation');
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: ' **JSLAI RobotWeb Ultimate v5**\n\nAdvanced AI browser automation.\n\n**Try:** Hotels in Paris - React on GitHub - iPhone on Amazon' }]);
  const [actions, setActions] = useState<Action[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [logs, setLogs] = useState<Message[]>([]);
  const [screenshot, setScreenshot] = useState('');
  const [currentUrl, setCurrentUrl] = useState('about:blank');
  const [debugUrl, setDebugUrl] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [input, setInput] = useState('');
  const [activePanel, setActivePanel] = useState<'chat'|'actions'|'results'|'logs'>('chat');
  const [activeTab, setActiveTab] = useState<'main'|'workflows'|'admin'>('main');
  const [expertMode, setExpertMode] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [themes, setThemes] = useState<Record<string, Theme>>({});
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowCategory, setWorkflowCategory] = useState('all');
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [adminSection, setAdminSection] = useState('providers');
  const msgEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController|null>(null);

  useEffect(() => {
    fetch('/api/config').then(r=>r.json()).then(d=>{ setProviders(d.providers); setCurrentProvider(d.defaultProvider); }).catch(()=>{
      setProviders({ simulation: { id:'simulation', name:'Simulation', description:'Free demo', status:'ready', cost:'FREE', icon:'', endpoint:'/api/simulate' }});
    });
    fetch('/api/admin').then(r=>r.json()).then(d=>{ setThemes(d.themes); }).catch(()=>{});
    fetch('/api/workflows').then(r=>r.json()).then(d=>{ setWorkflows(d.workflows); }).catch(()=>{});
  }, []);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { document.body.className = `theme-${currentTheme}`; }, [currentTheme]);

  const provider = providers[currentProvider];

  const runTest = async (prov: string = 'all') => {
    setTesting(true); setTestResults(null);
    try { const res = await fetch('/api/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: prov }) }); setTestResults(await res.json()); }
    catch (e: any) { setTestResults({ error: e.message }); }
    setTesting(false);
  };

  const executeTask = useCallback(async (task: string) => {
    if (!provider) return;
    setIsRunning(true); setActions([]); setResults([]); setLogs([]); setScreenshot(''); setDebugUrl(''); setStats(null);
    setMessages(p => [...p, { role: 'user', content: task }, { role: 'assistant', content: ' Starting...' }]);
    if (expertMode) setActivePanel('logs');
    setActiveTab('main');
    abortRef.current = new AbortController();
    try {
      const res = await fetch(provider.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task, expertMode }), signal: abortRef.current.signal });
      const reader = res.body?.getReader(); if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.type === 'status') setMessages(p => { const n=[...p]; if(n.length && n[n.length-1].role==='assistant') n[n.length-1]={...n[n.length-1],content:d.message}; return n; });
            else if (d.type === 'session') { if (d.debugUrl) setDebugUrl(d.debugUrl); }
            else if (d.type === 'actions') { setActions(d.actions.map((a:any)=>({...a,status:'pending'}))); if (!expertMode) setActivePanel('actions'); }
            else if (d.type === 'action_start') setActions(p => p.map((a,i) => i===d.index ? {...a,status:'running'} : a));
            else if (d.type === 'action_complete') { setActions(p => p.map((a,i) => i===d.index ? {...a,status:d.success?'completed':'error'} : a)); if (d.screenshot) setScreenshot(d.screenshot); if (d.url) setCurrentUrl(d.url); }
            else if (d.type === 'log') setLogs(p => [...p, { role: 'log', content: d.message, level: d.level, time: d._t }]);
            else if (d.type === 'complete') { if (d.results?.length) setResults(d.results); setStats(d.stats); setMessages(p => [...p, { role: 'assistant', content: ` **Done!** ${d.results?.length||0} results in ${((d.stats?.totalTime||0)/1000).toFixed(1)}s` }]); if (d.results?.length) setActivePanel('results'); }
            else if (d.type === 'error') setMessages(p => [...p, { role: 'system', content: ` ${d.message}` }]);
            else if (d.type === 'init' && expertMode) setLogs(p => [...p, { role: 'log', content: `Init: ${d.provider} v${d.version}`, level: 'info', time: 0 }]);
          } catch {}
        }
      }
    } catch (e: any) { if (e.name !== 'AbortError') setMessages(p => [...p, { role: 'system', content: ` ${e.message}` }]); }
    setIsRunning(false);
  }, [provider, expertMode]);

  const executeWorkflow = async (workflow: Workflow) => {
    const value = prompt(`Enter ${workflow.variables[0]?.label || 'value'}:`, workflow.variables[0]?.placeholder || '');
    if (!value) return;
    const vars: Record<string, any> = {}; vars[workflow.variables[0]?.name || 'input'] = value;
    let task = workflow.taskTemplate;
    for (const [k, v] of Object.entries(vars)) task = task.replace(`{${k}}`, String(v));
    await executeTask(task);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (input.trim() && !isRunning) { executeTask(input.trim()); setInput(''); } };
  const stopExec = () => { abortRef.current?.abort(); setIsRunning(false); setMessages(p => [...p, { role: 'system', content: ' Stopped' }]); };

  const icons: Record<string,string> = { navigate:'', click:'', type:'', scroll:'', extract:'', wait:'', press:'', hover:'' };
  const fmt = (s: string) => s.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh' }}>
      <header style={{ background:'linear-gradient(180deg,var(--surface),var(--bg))', padding:'8px 16px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="anim-float" style={{ fontSize:26 }}></span>
          <div><div style={{ fontSize:18, fontWeight:800 }} className="gradient-text">JSLAI RobotWeb</div><div style={{ fontSize:9, color:'var(--muted)', letterSpacing:'1px' }}>ULTIMATE v5.0</div></div>
        </div>
        <div style={{ display:'flex', gap:2, background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:3, marginLeft:16 }}>
          {[{id:'main',icon:'',label:'Main'},{id:'workflows',icon:'',label:'Workflows'},{id:'admin',icon:'',label:'Admin'}].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id as any)} style={{ padding:'6px 14px', borderRadius:'var(--radius-sm)', border:'none', background: activeTab===t.id ? 'var(--surface)' : 'transparent', color: activeTab===t.id ? 'var(--primary)' : 'var(--muted)', cursor:'pointer', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>{t.icon} {t.label}</button>
          ))}
        </div>
        <div style={{ flex:1 }}/>
        <select value={currentProvider} onChange={e=>setCurrentProvider(e.target.value)} disabled={isRunning} style={{ background:'var(--elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'6px 24px 6px 10px', color:'var(--text)', fontSize:12, cursor:'pointer' }}>
          {Object.values(providers).map(p => <option key={p.id} value={p.id} disabled={p.status!=='ready'}>{p.icon} {p.name}</option>)}
        </select>
        <button onClick={()=>setExpertMode(!expertMode)} style={{ padding:'6px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background: expertMode ? 'var(--secondary-glow)' : 'var(--elevated)', color: expertMode ? 'var(--secondary)' : 'var(--text-sec)', cursor:'pointer', fontSize:11, fontWeight:600 }}>{expertMode ? '' : ''}</button>
        {debugUrl && <a href={debugUrl} target="_blank" className="anim-glow" style={{ padding:'5px 10px', background:'var(--error-bg)', border:'1px solid rgba(255,82,82,.3)', borderRadius:'var(--radius-sm)', color:'var(--error)', fontSize:10, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}><span className="status-dot running anim-pulse"/> LIVE</a>}
        <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', background:'var(--elevated)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}><span className={`status-dot ${isRunning ? 'running' : provider?.status==='ready' ? 'ready' : 'error'}`} style={isRunning ? {animation:'pulse 1s infinite'} : {}}/><span style={{ fontSize:10, color:'var(--text-sec)' }}>{isRunning ? 'Running' : 'Ready'}</span></div>
      </header>

      {provider && activeTab === 'main' && <div style={{ background: currentProvider==='simulation' ? 'var(--secondary-glow)' : 'var(--primary-glow)', borderBottom:'1px solid var(--border)', padding:'5px 16px', display:'flex', alignItems:'center', gap:8, fontSize:11 }}>
        <span>{provider.icon}</span><span><strong>{provider.name}</strong> - {provider.description}</span>
        <span style={{ marginLeft:'auto', color: currentProvider==='simulation' ? 'var(--secondary)' : 'var(--success)', fontWeight:600 }}>{provider.cost}</span>
        {stats && <span style={{ color:'var(--muted)' }}>- {(stats.totalTime/1000).toFixed(1)}s - {stats.results} results</span>}
      </div>}

      <main style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {activeTab === 'main' && <>
          <section style={{ flex:'0 0 65%', display:'flex', flexDirection:'column', borderRight:'1px solid var(--border)' }}>
            <div style={{ padding:'6px 12px', background:'var(--surface)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', gap:4 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#ff5f57' }}/><span style={{ width:10, height:10, borderRadius:'50%', background:'#febc2e' }}/><span style={{ width:10, height:10, borderRadius:'50%', background:'#28c840' }}/></div>
              <div style={{ flex:1, display:'flex', alignItems:'center', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'6px 10px', gap:5 }}>
                <span style={{ color: currentUrl.startsWith('https') ? 'var(--success)' : 'var(--muted)', fontSize:11 }}>{currentUrl.startsWith('https') ? '' : ''}</span>
                <span style={{ fontSize:11, color:'var(--text)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'monospace' }}>{currentUrl}</span>
              </div>
            </div>
            <div style={{ flex:1, overflow:'hidden', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
              {screenshot ? <img src={screenshot} alt="Browser" style={{ maxWidth:'100%', maxHeight:'100%', borderRadius:'var(--radius)', boxShadow:'var(--shadow)' }}/> : <div style={{ textAlign:'center', color:'var(--muted)', maxWidth:320 }}><div className="anim-float" style={{ fontSize:56, marginBottom:16, opacity:.3 }}></div><div style={{ fontSize:18, marginBottom:8, color:'var(--text)', fontWeight:700 }}>JSLAI RobotWeb Ultimate</div><div style={{ fontSize:12, lineHeight:1.5, color:'var(--text-sec)' }}>Enter a task or select a workflow</div></div>}
            </div>
          </section>
          <aside style={{ flex:'0 0 35%', display:'flex', flexDirection:'column', background:'var(--surface)' }}>
            <div className="tabs" style={{ margin:8, marginBottom:0 }}>
              {(['chat','actions','results', ...(expertMode ? ['logs'] : [])] as const).map(tab => (
                <button key={tab} onClick={()=>setActivePanel(tab as any)} className={`tab ${activePanel===tab ? 'active' : ''}`}>{tab==='chat' ? '' : tab==='actions' ? '' : tab==='results' ? '' : ''} {tab}{tab==='actions' && actions.length ? ` (${actions.length})` : ''}{tab==='results' && results.length ? ` (${results.length})` : ''}</button>
              ))}
            </div>
            <div style={{ flex:1, overflow:'auto', padding:10 }}>
              {activePanel==='chat' && <div style={{ display:'flex', flexDirection:'column', gap:6 }}>{messages.map((m,i) => <div key={i} className="anim-slide" style={{ padding:'8px 10px', borderRadius:'var(--radius-sm)', background: m.role==='user' ? 'var(--primary)' : m.role==='system' ? 'var(--error-bg)' : 'var(--card)', color: m.role==='user' ? '#000' : m.role==='system' ? 'var(--error)' : 'var(--text)', marginLeft: m.role==='user' ? 'auto' : 0, maxWidth:'85%', fontSize:12, lineHeight:1.5 }} dangerouslySetInnerHTML={{ __html: fmt(m.content) }}/>)}<div ref={msgEndRef}/></div>}
              {activePanel==='actions' && <div style={{ display:'flex', flexDirection:'column', gap:5 }}>{!actions.length ? <div style={{ textAlign:'center', color:'var(--muted)', padding:32 }}><div style={{ fontSize:32, marginBottom:10, opacity:.3 }}></div><div style={{ fontSize:11 }}>Actions appear here</div></div> : actions.map((a,i) => <div key={i} className="anim-slideX card" style={{ padding:'8px 10px', borderLeft:`3px solid ${a.status==='completed' ? 'var(--success)' : a.status==='running' ? 'var(--warning)' : a.status==='error' ? 'var(--error)' : 'var(--muted)'}`, display:'flex', gap:8, alignItems:'center' }}><span style={{ fontSize:14 }}>{icons[a.type]||''}</span><div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', color:'var(--primary)' }}>{a.type}</div><div style={{ fontSize:10, color:'var(--text-sec)' }} className="truncate">{a.description}</div></div><span className={`status-dot ${a.status==='completed' ? 'ready' : a.status==='running' ? 'running' : a.status==='error' ? 'error' : 'pending'}`} style={a.status==='running' ? {animation:'pulse 1s infinite'} : {}}/></div>)}</div>}
              {activePanel==='results' && <div style={{ display:'flex', flexDirection:'column', gap:6 }}>{!results.length ? <div style={{ textAlign:'center', color:'var(--muted)', padding:32 }}><div style={{ fontSize:32, marginBottom:10, opacity:.3 }}></div><div style={{ fontSize:11 }}>Results appear here</div></div> : <>{results.length > 0 && <div className="badge badge-success" style={{ alignSelf:'flex-start', marginBottom:4 }}> {results.length} results</div>}{results.map((r,i) => <div key={i} className="anim-slide card card-hover" onClick={()=>r.link && window.open(r.link,'_blank')} style={{ padding:10, cursor: r.link ? 'pointer' : 'default' }}>{r.title && <div style={{ fontSize:12, fontWeight:600, color:'var(--primary)', marginBottom:3 }} className="truncate">{r.title}</div>}{r.description && <div style={{ fontSize:10, color:'var(--text-sec)', lineHeight:1.4 }} className="line-clamp-2">{r.description}</div>}{(r.price || r.rating || r.stars || r.views) && <div style={{ display:'flex', gap:4, marginTop:5, flexWrap:'wrap' }}>{r.price && <span className="badge badge-success">{r.price}</span>}{r.rating && <span className="badge badge-warning"> {r.rating}</span>}{r.stars && <span className="badge badge-warning">{r.stars} </span>}{r.reviews && <span className="badge" style={{ background:'var(--elevated)', color:'var(--text-sec)' }}>{r.reviews}</span>}{r.views && <span className="badge" style={{ background:'var(--elevated)', color:'var(--text-sec)' }}>{r.views}</span>}</div>}</div>)}</>}</div>}
              {activePanel==='logs' && <div style={{ display:'flex', flexDirection:'column', gap:3, fontFamily:'monospace', fontSize:10 }}>{!logs.length ? <div style={{ textAlign:'center', color:'var(--muted)', padding:32 }}><div style={{ fontSize:32, marginBottom:10, opacity:.3 }}></div><div style={{ fontSize:11 }}>Expert logs here</div></div> : logs.map((l,i) => <div key={i} className="anim-slide" style={{ padding:'4px 8px', background:'var(--elevated)', borderRadius:4, borderLeft:`2px solid ${l.level==='error' ? 'var(--error)' : l.level==='warn' ? 'var(--warning)' : l.level==='debug' ? 'var(--muted)' : 'var(--primary)'}` }}><span style={{ color:'var(--muted)' }}>[{l.time}ms]</span> <span style={{ color: l.level==='error' ? 'var(--error)' : l.level==='warn' ? 'var(--warning)' : 'var(--text-sec)' }}>{l.content}</span></div>)}</div>}
            </div>
            <div style={{ padding:10, background:'var(--bg)', borderTop:'1px solid var(--border)' }}><form onSubmit={handleSubmit}><div style={{ display:'flex', gap:5, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:6 }}><input type="text" value={input} onChange={e=>setInput(e.target.value)} placeholder="Describe your task..." disabled={isRunning} className="input" style={{ flex:1, border:'none', background:'transparent', padding:'6px 4px' }}/>{isRunning ? <button type="button" onClick={stopExec} className="btn" style={{ borderColor:'var(--error)', color:'var(--error)' }}></button> : <button type="submit" disabled={!input.trim()} className={input.trim() ? 'btn btn-primary' : 'btn'}>Run -></button>}</div></form></div>
          </aside>
        </>}

        {activeTab === 'workflows' && <div style={{ flex:1, padding:20, overflow:'auto' }}>
          <div style={{ marginBottom:20 }}><h2 style={{ fontSize:20, fontWeight:700, marginBottom:4 }}> Workflows</h2><p style={{ color:'var(--text-sec)', fontSize:13 }}>Pre-built automations</p></div>
          <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>{['all','travel','shopping','development','career','research','social','media'].map(cat => (<button key={cat} onClick={()=>setWorkflowCategory(cat)} className={workflowCategory===cat ? 'btn btn-primary btn-sm' : 'btn btn-sm'}>{cat.charAt(0).toUpperCase()+cat.slice(1)}</button>))}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>{workflows.filter(w => workflowCategory === 'all' || w.category === workflowCategory).map(w => (<div key={w.id} className="card card-hover" style={{ cursor:'pointer' }} onClick={() => executeWorkflow(w)}><div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}><span style={{ fontSize:28 }}>{w.icon}</span><div><div style={{ fontWeight:600, fontSize:14 }}>{w.name}</div><div style={{ fontSize:11, color:'var(--text-sec)' }}>{w.description}</div></div></div><div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>{w.variables.slice(0,3).map(v => <span key={v.name} className="badge" style={{ background:'var(--elevated)', color:'var(--muted)' }}>{v.label}</span>)}</div></div>))}</div>
        </div>}

        {activeTab === 'admin' && <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          <div style={{ width:200, background:'var(--surface)', borderRight:'1px solid var(--border)', padding:12 }}>{[{id:'providers',icon:'',label:'Providers'},{id:'themes',icon:'',label:'Themes'},{id:'llm',icon:'',label:'LLM'},{id:'test',icon:'',label:'Test'}].map(item => (<button key={item.id} onClick={()=>setAdminSection(item.id)} className="btn btn-ghost" style={{ width:'100%', justifyContent:'flex-start', marginBottom:4, background: adminSection===item.id ? 'var(--elevated)' : 'transparent' }}>{item.icon} {item.label}</button>))}</div>
          <div style={{ flex:1, padding:20, overflow:'auto' }}>
            {adminSection === 'providers' && <div><h3 style={{ fontSize:18, fontWeight:700, marginBottom:16 }}> Providers</h3><div style={{ display:'grid', gap:12 }}>{Object.values(providers).map(p => <div key={p.id} className="card"><div style={{ display:'flex', alignItems:'center', gap:12 }}><span style={{ fontSize:28 }}>{p.icon}</span><div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:14 }}>{p.name}</div><div style={{ fontSize:11, color:'var(--text-sec)' }}>{p.description}</div></div><span className={`badge ${p.status==='ready' ? 'badge-success' : 'badge-error'}`}>{p.status==='ready' ? ' Ready' : ' Not configured'}</span></div><div style={{ marginTop:8, fontSize:11, color:'var(--muted)' }}>Cost: {p.cost}</div></div>)}</div></div>}
            {adminSection === 'themes' && <div><h3 style={{ fontSize:18, fontWeight:700, marginBottom:16 }}> Themes</h3><div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>{Object.entries(themes).map(([id, t]) => (<div key={id} onClick={()=>setCurrentTheme(id)} className="card card-hover" style={{ cursor:'pointer', border: currentTheme===id ? '2px solid var(--primary)' : undefined }}><div style={{ display:'flex', gap:4, marginBottom:8 }}><div style={{ width:20, height:20, borderRadius:4, background:t.bg }}/><div style={{ width:20, height:20, borderRadius:4, background:t.primary }}/><div style={{ width:20, height:20, borderRadius:4, background:t.secondary }}/></div><div style={{ fontWeight:600, fontSize:13 }}>{t.name}</div></div>))}</div></div>}
            {adminSection === 'llm' && <div><h3 style={{ fontSize:18, fontWeight:700, marginBottom:16 }}> LLM Settings</h3><div className="card"><div style={{ marginBottom:12 }}><label style={{ fontSize:11, color:'var(--text-sec)', display:'block', marginBottom:4 }}>Model</label><select className="input" defaultValue="claude-sonnet-4-20250514"><option>claude-sonnet-4-20250514</option></select></div><div style={{ marginBottom:12 }}><label style={{ fontSize:11, color:'var(--text-sec)', display:'block', marginBottom:4 }}>Max Tokens</label><input type="number" className="input" defaultValue={4096}/></div><div><label style={{ fontSize:11, color:'var(--text-sec)', display:'block', marginBottom:4 }}>Custom Instructions</label><textarea className="input" rows={3} placeholder="Add instructions..."/></div></div></div>}
            {adminSection === 'test' && <div><h3 style={{ fontSize:18, fontWeight:700, marginBottom:16 }}> Tests</h3><button onClick={()=>runTest('all')} disabled={testing} className="btn btn-primary" style={{ marginBottom:16 }}>{testing ? ' Testing...' : ' Test All'}</button>{testResults && <div className="card">{testResults.tests?.map((t: any, i: number) => <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom: i < testResults.tests.length-1 ? '1px solid var(--border)' : 'none' }}><span style={{ fontSize:13 }}>{t.name}</span><span className={`badge ${t.status==='pass' ? 'badge-success' : t.status==='fail' ? 'badge-error' : 'badge-warning'}`}>{t.status==='pass' ? '' : t.status==='fail' ? '' : ''} {t.message}</span></div>)}{testResults.summary && <div style={{ marginTop:12, fontSize:12, color:'var(--text-sec)' }}>{testResults.summary}</div>}</div>}</div>}
          </div>
        </div>}
      </main>
    </div>
  );
}
