export const formatMetric = (value: number): string => {
  if (typeof value !== "number" || isNaN(value)) return "0"
  return Math.round(value).toString()
}

export const FORMATTING = {
  formatBasisPoints: (value: number) => {
    const bps = value * 100
    const decimal = value.toFixed(3)
    const percent = (value * 100).toFixed(2)
    return { bps: bps.toFixed(0), decimal, percent }
  },

  formatDateTime: (date: Date, locale = "fr-FR") => {
    return {
      date: date.toLocaleDateString(locale, { year: "numeric", month: "2-digit", day: "2-digit" }),
      time: date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      full: date.toLocaleString(locale),
    }
  },

  formatChangeDirection: (value: number) => ({
    icon: value > 0 ? "" : value < 0 ? "" : "->",
    color: value > 0 ? "text-red-500" : value < 0 ? "text-green-500" : "text-gray-500",
    label: value > 0 ? "Hausse" : value < 0 ? "Baisse" : "Stable",
  }),
}
