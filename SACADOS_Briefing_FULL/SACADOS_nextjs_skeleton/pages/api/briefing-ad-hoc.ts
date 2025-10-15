
import type { NextApiRequest, NextApiResponse } from "next";
import { runBriefingAdhoc } from "../../briefingCore/runBriefingAdhoc";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers["x-admin-token"];
  if (token !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });

  const {
    perplexityPromptOverride,
    gptInstructionsOverride,
    subject,
    to,
    previewOnly = false,
    validateAgainstSchema = false
  } = req.body || {};

  if (!perplexityPromptOverride || typeof perplexityPromptOverride !== "string") {
    return res.status(400).json({ error: "Missing perplexityPromptOverride" });
  }

  try {
    const recipients = Array.isArray(to) && to.length ? to : (process.env.RESEND_TO || "").split(",").map(s=>s.trim()).filter(Boolean);
    const result = await runBriefingAdhoc({
      perplexityPromptOverride,
      gptInstructionsOverride,
      subject,
      to: recipients,
      previewOnly,
      validateAgainstSchema
    });
    return res.status(200).json({ ok:true, ...result, sent: !previewOnly });
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e?.message || "unknown_error" });
  }
}
