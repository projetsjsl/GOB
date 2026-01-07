"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import type { YieldDataPoint } from "@/lib/fred-api"

interface YieldComparisonTableProps {
  usData: YieldDataPoint[]
  caData: YieldDataPoint[]
  onExport?: () => void
}

export function YieldComparisonTable({ usData, caData, onExport }: YieldComparisonTableProps) {
  // Merge data by maturity
  const comparisonData = usData.map((usPoint) => {
    const caPoint = caData.find((p) => p.maturity === usPoint.maturity)
    const spread = caPoint ? usPoint.yield - caPoint.yield : null

    return {
      maturity: usPoint.maturity,
      days: usPoint.days,
      usYield: usPoint.yield,
      caYield: caPoint?.yield || null,
      spread,
    }
  })

  const handleExport = () => {
    const csvContent = [
      ["Maturity", "Days", "US Yield (%)", "CA Yield (%)", "Spread (bps)"],
      ...comparisonData.map((row) => [
        row.maturity,
        row.days,
        row.usYield.toFixed(3),
        row.caYield?.toFixed(3) || "N/A",
        row.spread !== null ? (row.spread * 100).toFixed(1) : "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `yield-comparison-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getSpreadIcon = (spread: number | null) => {
    if (spread === null) return null
    if (spread > 0.05) return <ArrowUpRight className="h-3 w-3 text-emerald-500" />
    if (spread < -0.05) return <ArrowDownRight className="h-3 w-3 text-red-500" />
    return <Minus className="h-3 w-3 text-gray-500" />
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Yield Comparison</CardTitle>
          <CardDescription className="text-muted-foreground">US vs Canadian government bond yields</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Maturity</TableHead>
              <TableHead className="text-right">
                <span className="flex items-center justify-end gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  US (%)
                </span>
              </TableHead>
              <TableHead className="text-right">
                <span className="flex items-center justify-end gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  CA (%)
                </span>
              </TableHead>
              <TableHead className="text-right text-foreground">Spread (bps)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisonData.map((row) => (
              <TableRow key={row.maturity} className="border-border">
                <TableCell className="font-medium text-foreground">{row.maturity}</TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold" style={{ color: "#10b981" }}>
                    {row.usYield.toFixed(3)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {row.caYield !== null ? (
                    <span className="font-semibold" style={{ color: "#f59e0b" }}>
                      {row.caYield.toFixed(3)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <span className="flex items-center justify-end gap-1">
                    {row.spread !== null ? (
                      <>
                        {getSpreadIcon(row.spread)}
                        <span
                          className="font-medium"
                          style={{ color: row.spread > 0 ? "#10b981" : row.spread < 0 ? "#ef4444" : "#6b7280" }}
                        >
                          {row.spread > 0 ? "+" : ""}
                          {(row.spread * 100).toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
