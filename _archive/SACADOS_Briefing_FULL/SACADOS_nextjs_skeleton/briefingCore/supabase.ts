
export async function archiveBriefing({ type, json, html }:{ type: "morning"|"noon"|"close"; json: unknown; html: string; }) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/briefings`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY!,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
    },
    body: JSON.stringify({ type, json, html, sent_at: new Date().toISOString() })
  });
  if (!res.ok) throw new Error(`Supabase archive failed: ${res.status} ${await res.text()}`);
}
