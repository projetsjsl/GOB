
import { BriefingSchema, BriefingData } from "./schema";
import { perplexityPrompt, gptSystem, gptUser, BriefType } from "./prompts";
import { mdToHtml } from "./render";
import { sendEmail } from "./resend";
import { archiveBriefing } from "./supabase";

async function callPerplexity(prompt: string) {
  const r = await fetch(process.env.PPLX_ENDPOINT!, {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization": `Bearer ${process.env.PPLX_API_KEY!}` },
    body: JSON.stringify({ model: "pplx-70b-online", temperature: 0.2, top_p: 0.9, messages: [{ role:"user", content: prompt }] })
  });
  const j = await r.json();
  const content = j?.choices?.[0]?.message?.content ?? j?.output ?? j;
  return typeof content === "string" ? JSON.parse(content) : content;
}

async function callGPT5(type: BriefType, data: BriefingData) {
  const r = await fetch(process.env.OPENAI_ENDPOINT!, {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY!}` },
    body: JSON.stringify({
      model: "gpt-5",
      temperature: 0.2,
      messages: [
        { role:"system", content: gptSystem },
        { role:"user", content: gptUser(type) },
        { role:"user", content: "Voici le JSON des données :" },
        { role:"user", content: JSON.stringify(data) }
      ]
    })
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content || "";
}

function idempotencyKey(type: BriefType) {
  const now = new Date();
  const slot = `${now.getUTCFullYear()}${now.getUTCMonth()+1}${now.getUTCDate()}_${now.getUTCHours()}`;
  return `${type}_${slot}`;
}
const sentCache = new Map<string, number>();

export async function runBriefing({ type, mode, previewOnly=false, to }:{ type: BriefType; mode:"manual"|"cron"; previewOnly?: boolean; to: string[]; }) {
  const key = idempotencyKey(type);
  const now = Date.now();
  if (sentCache.has(key) && now - (sentCache.get(key)!) < 5*60*1000) {
    throw new Error("Déclenchement trop rapproché. Réessaie dans quelques minutes.");
  }
  const raw = await callPerplexity(perplexityPrompt(type));
  const parsed = BriefingSchema.parse(raw);
  const markdown = await callGPT5(type, parsed);
  const html = mdToHtml(markdown);

  let emailResult: unknown = null;
  if (!previewOnly) {
    emailResult = await sendEmail({ to, subject: `SACADOS — ${type.toUpperCase()} Market Briefing`, html });
    sentCache.set(key, now);
    await archiveBriefing({ type, json: parsed, html });
  }
  return { json: parsed, markdown, html, emailResult, mode, type };
}
