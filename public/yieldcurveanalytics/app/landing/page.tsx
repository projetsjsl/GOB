"use client"

import Link from "next/link"
import { ArrowRight, TrendingUp, BarChart3, Zap, Shield, Lock, Globe } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            CurveWatch
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#capabilities" className="text-slate-300 hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">
              Pricing
            </a>
          </div>
          <Link
            href="/app"
            className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">Yield Curve Intelligence</h1>
              <p className="text-xl text-slate-300 leading-relaxed">
                Professional-grade analysis of US Treasury and Canadian bond yield curves with real-time data, advanced
                metrics, and institutional-level insights.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/app"
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 flex items-center gap-2"
              >
                Start Analyzing <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="px-8 py-3 rounded-lg border border-slate-600 hover:border-slate-400 text-white font-semibold transition-all duration-300 hover:bg-slate-800/50">
                Learn More
              </button>
            </div>

            {/* Trust indicators */}
            <div className="pt-8 flex items-center gap-4 text-sm text-slate-400">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 border border-slate-800"
                  />
                ))}
              </div>
              <span>Trusted by professional analysts</span>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-2xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-xl">
              <div className="space-y-4">
                <div className="flex items-end gap-1 h-32">
                  {[40, 55, 45, 65, 50, 70, 60, 75, 65, 80, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                      style={{ height: `${(h / 100) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>1M</span>
                  <span>1Y</span>
                  <span>5Y</span>
                  <span>10Y</span>
                  <span>30Y</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-slate-800/50 py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-blue-400 font-semibold text-sm tracking-wider uppercase">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold mt-2">Built for Professionals</h2>
            <p className="text-slate-400 text-lg mt-4 max-w-2xl">
              Everything you need to understand and act on yield curve dynamics in real-time.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Real-Time Curves",
                description:
                  "Live yield curve data from FRED and Bank of Canada updated automatically throughout the day.",
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description:
                  "Slope analysis, spread calculations, and custom metrics designed for fixed income professionals.",
              },
              {
                icon: Zap,
                title: "Instant Insights",
                description: "Compare US and Canadian yields, track daily changes, and identify trading opportunities.",
              },
              {
                icon: Shield,
                title: "Institutional Quality",
                description: "Data sourced from official central bank and treasury APIs with 99.9% uptime.",
              },
              {
                icon: Lock,
                title: "Secure Access",
                description: "Enterprise-grade security with encrypted connections and strict data privacy controls.",
              },
              {
                icon: Globe,
                title: "Multi-Country",
                description: "Comprehensive analysis across US Treasury and Canadian government bond markets.",
              },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={i}
                  className="group p-8 rounded-2xl border border-slate-700/50 hover:border-blue-500/50 bg-gradient-to-br from-slate-800/30 to-slate-900/30 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center mb-4 group-hover:from-blue-500/40 group-hover:to-cyan-400/40 transition-all">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-slate-800/50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { label: "Data Points", value: "19+" },
              { label: "Market Coverage", value: "2" },
              { label: "Update Frequency", value: "Real-time" },
              { label: "Uptime", value: "99.9%" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-slate-400 text-sm mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-slate-800/50 py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to analyze the curve?</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Get instant access to professional-grade yield curve analysis. No credit card required.
          </p>
          <Link
            href="/app"
            className="inline-flex px-8 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 text-lg"
          >
            Launch CurveWatch <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              CurveWatch
            </div>
            <p className="text-slate-500 text-sm mt-4 md:mt-0">
              © 2026 CurveWatch. Professional yield curve analysis platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
