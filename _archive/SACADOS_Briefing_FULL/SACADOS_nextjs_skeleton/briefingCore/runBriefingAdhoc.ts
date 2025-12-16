
import { mdToHtml } from "./render";
import { sendEmail } from "./resend";
import { archiveBriefing } from "./supabase";
import { BriefingSchema } from "./schema";

async function callPerplexityRaw(prompt: string) {
  const r = await fetch(process.env.PPLX_ENDPOINT!, {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization": `Bearer ${process.env.PPLX_API_KEY!}` },
    body: JSON.stringify({ model: "pplx-70b-online", temperature: 0.2, top_p: 0.9, messages: [{ role:"user", content: prompt }] })
  });
  const j = await r.json();
  const content = j?.choices?.[0]?.message?.content ?? j?.output ?? j;
  return typeof content === "string" ? JSON.parse(content) : content;
}

async function callGPT5Raw(system: string, user: string, jsonPayload?: unknown) {
  const r = await fetch(process.env.OPENAI_ENDPOINT!, {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY!}` },
    body: JSON.stringify({
      model: "gpt-5",
      temperature: 0.2,
      messages: [
        { role:"system", content: system },
        { role:"user", content: user },
        ...(jsonPayload ? [{ role:"user", content: "Voici le JSON des données :" }, { role:"user", content: JSON.stringify(jsonPayload) }] : [])
      ]
    })
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content || "";
}

export async function runBriefingAdhoc({
  perplexityPromptOverride,
  gptInstructionsOverride,
  subject,
  to,
  previewOnly,
  validateAgainstSchema = true
}:{
  perplexityPromptOverride: string;
  gptInstructionsOverride?: string;
  subject?: string;
  to: string[];
  previewOnly?: boolean;
  validateAgainstSchema?: boolean;
}) {
  const raw = await callPerplexityRaw(perplexityPromptOverride);
  let parsed: any = raw;
  if (validateAgainstSchema) parsed = BriefingSchema.parse(raw);

  const system = "Tu es un analyste macro-financier (niveau CFA). Tu écris en français canadien des briefings professionnels.";
  const user = gptInstructionsOverride || `Rédige un briefing email professionnel en français canadien en utilisant UNIQUEMENT les données JSON ci-dessous.
- Structure logique, titres, icônes sobres si pertinent.
- Citer les sources (URLs) quand présentes.
- Ne pas inventer de valeurs.
- Format Markdown pour conversion en HTML.`;

  const md = await callGPT5Raw(system, user, parsed);
  const html = mdToHtml(md);

  if (!previewOnly) {
    await sendEmail({ to, subject: subject || "SACADOS — Briefing ad-hoc", html });
    await archiveBriefing({ type: "morning", json: parsed, html }); // ou crée une colonne "adhoc"
  }

  return { json: parsed, markdown: md, html };
}
