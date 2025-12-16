
import type { NextApiRequest, NextApiResponse } from "next";
import { runBriefing } from "../../briefingCore/runBriefing";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers["x-admin-token"];
  if (token !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });

  const type = (req.query.type || req.body?.type) as "morning"|"noon"|"close";
  const mode = (req.query.mode || req.body?.mode || "manual") as "manual"|"cron";
  const previewOnly = req.query.dryRun === "true" || req.body?.dryRun === true;

  if (!type || !["morning","noon","close"].includes(type)) {
    return res.status(400).json({ error: "type must be morning|noon|close" });
  }

  try {
    const to = (process.env.RESEND_TO || "").split(",").map(s=>s.trim()).filter(Boolean);
    const result = await runBriefing({ type, mode, previewOnly, to });
    return res.status(200).json({ ok: true, ...result, sent: !previewOnly });
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e?.message || "unknown_error" });
  }
}
