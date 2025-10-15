
import { useState } from "react";

export default function AdhocComposer() {
  const [pplx, setPplx] = useState("");
  const [gpt, setGpt] = useState("");
  const [subject, setSubject] = useState("SACADOS — Briefing ad-hoc");
  const [to, setTo] = useState("");
  const [preview, setPreview] = useState(true);
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    const r = await fetch("/api/briefing-ad-hoc", {
      method: "POST",
      headers: { 
        "Content-Type":"application/json",
        "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN as string
      },
      body: JSON.stringify({
        perplexityPromptOverride: pplx,
        gptInstructionsOverride: gpt || undefined,
        subject,
        to: to ? to.split(',').map(s=>s.trim()) : undefined,
        previewOnly: preview,
        validateAgainstSchema: false
      })
    });
    const j = await r.json();
    setResp(j);
    setLoading(false);
  }

  return (
    <div style={{display:"grid", gap:12}}>
      <textarea placeholder="Prompt Perplexity (obligatoire)" rows={8} value={pplx} onChange={e=>setPplx(e.target.value)} />
      <textarea placeholder="Instructions GPT-5 (optionnel)" rows={6} value={gpt} onChange={e=>setGpt(e.target.value)} />
      <input placeholder="Sujet email" value={subject} onChange={e=>setSubject(e.target.value)} />
      <input placeholder="Destinataires (séparés par des virgules)" value={to} onChange={e=>setTo(e.target.value)} />
      <label><input type="checkbox" checked={preview} onChange={e=>setPreview(e.target.checked)} /> Prévisualisation (pas d’envoi)</label>
      <button onClick={send} disabled={loading}>{preview ? "Prévisualiser" : "Envoyer"}</button>
      {resp && <pre style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(resp, null, 2)}</pre>}
    </div>
  );
}
