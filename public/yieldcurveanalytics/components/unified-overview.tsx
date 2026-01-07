import type { FC } from "react"
import { MarketStatus } from "./market-status"
import { formatMetric } from "@/lib/formatting"

interface UnifiedOverviewProps {
  usData: any[]
  caData: any[]
  usPolicyRate: number
  caPolicyRate: number
  lastUpdated: string
  onRefresh: () => void
}

export const UnifiedOverview: FC<UnifiedOverviewProps> = ({
  usData,
  caData,
  usPolicyRate,
  caPolicyRate,
  lastUpdated,
  onRefresh,
}) => {
  const getYield = (data: any[], maturity: string) => {
    if (!data || !Array.isArray(data)) return null
    const found = data.find((d) => d.maturity === maturity)
    if (!found && (maturity === "1Y" || maturity === "20Y")) {
      console.log(
        `[v0] No data found for maturity: ${maturity}, available:`,
        data.map((d) => d.maturity),
      )
    }
    return found
  }

  const formatPolicyRate = (rate: any) => {
    const numRate = Number(rate)
    if (isNaN(numRate) || numRate === null || numRate === undefined) {
      return { main: "—", bp: "—", decimal: "—" }
    }
    return {
      main: numRate.toFixed(3),
      bp: formatMetric(numRate * 100), // Already in % form, just multiply by 100 for basis points
      decimal: numRate.toFixed(5), // Keep as is, this IS the decimal form
    }
  }

  const usPolicyFormatted = formatPolicyRate(usPolicyRate)
  const caPolicyFormatted = formatPolicyRate(caPolicyRate)

  const maturities = ["1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]

  const slopes = {
    us_2_10:
      usData.length >= 2
        ? ((usData.find((d) => d.maturity === "2Y")?.yield || 0) -
            (usData.find((d) => d.maturity === "10Y")?.yield || 0)) *
          100
        : null,
    us_3m_10:
      usData.length >= 2
        ? ((usData.find((d) => d.maturity === "3M")?.yield || 0) -
            (usData.find((d) => d.maturity === "10Y")?.yield || 0)) *
          100
        : null,
    ca_2_10:
      caData.length >= 2
        ? ((caData.find((d) => d.maturity === "2Y")?.yield || 0) -
            (caData.find((d) => d.maturity === "10Y")?.yield || 0)) *
          100
        : null,
    ca_3m_10:
      caData.length >= 2
        ? ((caData.find((d) => d.maturity === "3M")?.yield || 0) -
            (caData.find((d) => d.maturity === "10Y")?.yield || 0)) *
          100
        : null,
  }

  return (
    <div className="space-y-2">
      {/* Market Status */}
      <div className="market-card-bg rounded-lg border border-border/50">
        <div className="bg-card-content/50 p-3 sm:p-4">
          <MarketStatus lastUpdated={lastUpdated} onRefresh={onRefresh} />
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="p-3 sm:p-4">
          {/* Title spanning both countries */}
          <div className="mb-4 pb-3 border-b border-border/30">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-3">
              <span>🇺🇸</span>
              <span className="text-blue-400">États-Unis</span>
              <span className="mx-2 text-border/50">|</span>
              <span>🇨🇦</span>
              <span className="text-red-400">Canada</span>
            </h2>
          </div>

          {/* Policy Rates Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* US Policy Rate */}
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <div className="text-xs text-foreground/60 mb-1">Taux Directeur (Fed)</div>
              <div className="text-2xl font-bold text-blue-400">{usPolicyFormatted.main}%</div>
              <div className="text-xs text-foreground/50 mt-1">
                {usPolicyFormatted.bp} bp | {usPolicyFormatted.decimal}
              </div>
            </div>

            {/* Canada Policy Rate */}
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <div className="text-xs text-foreground/60 mb-1">Taux Directeur (BOC)</div>
              <div className="text-2xl font-bold text-red-400">{caPolicyFormatted.main}%</div>
              <div className="text-xs text-foreground/50 mt-1">
                {caPolicyFormatted.bp} bp | {caPolicyFormatted.decimal}
              </div>
            </div>
          </div>

          {/* Yield Curve Maturities - Interleaved US/CA */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-foreground/60 uppercase">Courbes de Rendement par Maturité</div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {maturities.map((maturity) => {
                const usYield = getYield(usData, maturity)
                const caYield = getYield(caData, maturity)

                return (
                  <div key={maturity} className="space-y-1">
                    <div className="text-xs font-bold text-foreground/80">{maturity}</div>

                    {/* US Yield */}
                    <div className="rounded-md bg-blue-500/5 border border-blue-500/10 p-1.5 text-center">
                      <div className="text-sm font-bold text-blue-400">
                        {usYield ? (usYield.yield || 0).toFixed(2) : "—"}%
                      </div>
                      <div className="text-xs text-blue-300/60">
                        {usYield ? formatMetric(usYield.yield * 100) : "—"} bp
                      </div>
                    </div>

                    {/* Canada Yield */}
                    <div className="rounded-md bg-red-500/5 border border-red-500/10 p-1.5 text-center">
                      <div className="text-sm font-bold text-red-400">
                        {caYield ? (caYield.yield || 0).toFixed(2) : "—"}%
                      </div>
                      <div className="text-xs text-red-300/60">
                        {caYield ? formatMetric(caYield.yield * 100) : "—"} bp
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section for slopes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/30">
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2">
              <div className="text-xs text-foreground/60 font-semibold">Pente 2Y-10Y (US)</div>
              <div className="text-lg font-bold text-blue-400">
                {slopes.us_2_10 !== null ? slopes.us_2_10.toFixed(1) : "—"} bp
              </div>
            </div>
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-2">
              <div className="text-xs text-foreground/60 font-semibold">Écart 10Y US-CA</div>
              <div className="text-lg font-bold text-green-400">
                {((usData.find((d: any) => d.maturity === "10Y")?.yield || 0) -
                  (caData.find((d: any) => d.maturity === "10Y")?.yield || 0)) *
                  100 >
                0
                  ? "+"
                  : ""}
                {(
                  ((usData.find((d: any) => d.maturity === "10Y")?.yield || 0) -
                    (caData.find((d: any) => d.maturity === "10Y")?.yield || 0)) *
                  100
                ).toFixed(1)}
                bp
              </div>
              <div className="text-xs text-green-300/60">US &gt; CA</div>
            </div>
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2">
              <div className="text-xs text-foreground/60 font-semibold">Pente 3M-10Y (US)</div>
              <div className="text-lg font-bold text-blue-400">
                {slopes.us_3m_10 !== null ? slopes.us_3m_10.toFixed(1) : "—"} bp
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-4 pt-3 border-t border-border/30 text-xs text-foreground/50 space-y-1">
            <div>
              <strong>Format d'affichage:</strong> % | bp (points de base) | décimal
            </div>
            <div>
              <strong>Sources:</strong> FRED (Federal Reserve) | Banque du Canada (VALET)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
