"use client"

import type React from "react"

import { useState } from "react"
import { Maximize2, X } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ExpandableCardProps {
  children: React.ReactNode
  title?: string
  expandedSize?: "default" | "large" | "full"
}

export function ExpandableCard({ children, title, expandedSize = "large" }: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const sizeClasses = {
    default: "sm:max-w-3xl",
    large: "sm:max-w-6xl",
    full: "sm:max-w-[95vw]",
  }

  return (
    <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="relative group">
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-500/20 hover:text-blue-300 animate-glow-premium"
            title="Agrandir (Clic pour voir en plein ecran)"
            aria-label="Agrandir le composant"
          >
            <Maximize2 className="size-4" />
          </Button>
        </DialogTrigger>

        <div className="relative">{children}</div>
      </div>

      <DialogContent
        className={`max-h-[90vh] overflow-y-auto ${sizeClasses[expandedSize]} animate-slide-in-top shadow-2xl shadow-blue-500/20`}
        showCloseButton={true}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-blue-500/20">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h2>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-red-500/20 hover:text-red-400" aria-label="Fermer">
                <X className="size-4" />
              </Button>
            </DialogTrigger>
          </div>
        )}
        <div className="relative">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
