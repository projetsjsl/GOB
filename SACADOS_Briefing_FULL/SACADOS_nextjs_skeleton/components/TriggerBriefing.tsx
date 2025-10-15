
import { useState } from "react";

export default function TriggerBriefing() {
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<any>(null);

  async function trigger(type: "morning"|"noon"|"close", dryRun=false) {
    setLoading(true);
    const r = await fetch(`/api/briefing?type=${type}&mode=manual&dryRun=${String(dryRun)}`, {
      method: "POST",
      headers: { "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN as string }
    });
    const j = await r.json();
    setResp(j);
    setLoading(false);
  }

  return (
    <div style={{display:"grid", gap:12}}>
      <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
        <button onClick={()=>trigger("morning", true)} disabled={loading}>Prévisualiser Morning</button>
        <button onClick={()=>trigger("morning", false)} disabled={loading}>Envoyer Morning</button>
        <button onClick={()=>trigger("noon", false)} disabled={loading}>Envoyer Noon</button>
        <button onClick={()=>trigger("close", false)} disabled={loading}>Envoyer Close</button>
      </div>
      {resp && <pre style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(resp, null, 2)}</pre>}
    </div>
  );
}
