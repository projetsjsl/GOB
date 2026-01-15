"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import type { YieldDataPoint, Country } from "@/lib/fred-api"

interface YieldTableProps {
  points: YieldDataPoint[]
  country?: Country
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "Tresor U.S.",
  CA: "Gouvernement Canadien",
}

const COUNTRY_COLORS: Record<string, string> = {
  US: "#3b82f6",
  CA: "#ef4444",
}

export function YieldTable({ points, country = "US" }: YieldTableProps) {
  const handleExport = () => {
    const csvContent = [
      ["Maturity", "Yield (%)", "Days"],
      ...points.map((row) => [row.maturity, row.yield.toFixed(3), row.days]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${country.toLowerCase()}-yields-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-foreground flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COUNTRY_COLORS[country] }} />
            {country === "US" ? "Rendements Actuels" : "Rendements Actuels"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {country === "US"
              ? "Rendements du Tresor U.S. par maturite"
              : "Rendements par maturite du gouvernement canadien"}
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Maturite</TableHead>
              <TableHead className="text-right text-foreground">Rendement (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {points.map((point) => (
              <TableRow key={point.maturity} className="border-border">
                <TableCell className="font-medium text-foreground">{point.maturity}</TableCell>
                <TableCell className="text-right">
                  <span className="text-lg font-semibold" style={{ color: COUNTRY_COLORS[country] }}>
                    {point.yield.toFixed(3)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Source: {country === "US" ? "FRED (Federal Reserve Economic Data)" : "Banque du Canada"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
