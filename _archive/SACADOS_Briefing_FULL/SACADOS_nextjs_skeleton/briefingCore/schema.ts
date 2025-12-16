
import { z } from "zod";

export const BriefingSchema = z.object({
  meta: z.object({
    brief_type: z.enum(["morning","noon","close"]),
    as_of_utc: z.string().min(1),
    as_of_tz: z.string().default("America/Toronto"),
    sources: z.array(z.object({ name: z.string(), url: z.string().url() })).optional(),
    warnings: z.array(z.string()).optional()
  }),
  yield_curves: z.object({
    us: z.object({
      terms: z.record(z.string(), z.number().nullable()).optional(),
      spreads: z.record(z.string(), z.number().nullable()).optional(),
      source: z.object({ name: z.string().optional(), url: z.string().url().optional() }).optional()
    }).optional(),
    ca: z.object({
      terms: z.record(z.string(), z.number().nullable()).optional(),
      spreads: z.record(z.string(), z.number().nullable()).optional(),
      source: z.object({ name: z.string().optional(), url: z.string().url().optional() }).optional()
    }).optional()
  }).optional(),
  forex: z.object({
    vs_usd: z.record(z.string(), z.number().nullable()).optional(),
    vs_cad: z.record(z.string(), z.number().nullable()).optional(),
    changes_24h_pct: z.record(z.string(), z.number().nullable()).optional(),
    sources: z.array(z.object({ name: z.string(), url: z.string().url() })).optional()
  }).optional(),
  volatility: z.any().optional(),
  indices: z.any().optional(),
  sectors: z.any().optional(),
  movers: z.any().optional(),
  macro_calendar: z.any().optional(),
  earnings_calendar: z.array(z.any()).optional(),
  ticker_news: z.array(z.any()).optional(),
  commodities: z.any().optional(),
  sentiment: z.any().optional(),
  beta_perspective: z.any().optional()
});
export type BriefingData = z.infer<typeof BriefingSchema>;
