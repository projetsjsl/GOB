"use client"

import { useState, useEffect } from "react"
import { ChevronUp, ChevronDown, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

const SECTIONS = [
  { id: "section-overview", label: "Aperçu", icon: "📊" },
  { id: "section-comparison", label: "Comparaison", icon: "📈" },
  { id: "section-analytics", label: "Analytique", icon: "🔍" },
  { id: "section-historical", label: "Historique", icon: "📉" },
]

export function SectionNavigation() {
  const [currentSection, setCurrentSection] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const sections = SECTIONS.map((s) => ({
        id: s.id,
        element: document.getElementById(s.id),
      }))

      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].element && sections[i].element!.offsetTop <= scrollPosition + 200) {
          setCurrentSection(i)
          break
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const goToPrevious = () => {
    if (currentSection > 0) {
      scrollToSection(SECTIONS[currentSection - 1].id)
    }
  }

  const goToNext = () => {
    if (currentSection < SECTIONS.length - 1) {
      scrollToSection(SECTIONS[currentSection + 1].id)
    }
  }

  return (
    <div className="fixed right-6 bottom-6 flex flex-col gap-2 z-40 md:right-8 md:bottom-8">
      {/* Mobile/Tablet: Vertical stacked buttons */}
      <div className="hidden sm:flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevious}
          disabled={currentSection === 0}
          className="h-10 w-10 rounded-full bg-card border-border/50 hover:bg-card-hover shadow-lg transition-all"
          title="Section précédente"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>

        {/* Section indicators */}
        <div className="flex flex-col gap-1">
          {SECTIONS.map((section, idx) => (
            <Button
              key={section.id}
              variant={currentSection === idx ? "default" : "outline"}
              size="sm"
              onClick={() => scrollToSection(section.id)}
              className={`h-9 px-2 rounded-full text-xs font-medium transition-all ${
                currentSection === idx
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 border-transparent shadow-lg"
                  : "bg-card border-border/50 hover:bg-card-hover"
              }`}
              title={section.label}
            >
              <span className="hidden md:inline">{section.label}</span>
              <span className="md:hidden">{section.icon}</span>
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNext}
          disabled={currentSection === SECTIONS.length - 1}
          className="h-10 w-10 rounded-full bg-card border-border/50 hover:bg-card-hover shadow-lg transition-all"
          title="Section suivante"
        >
          <ChevronDown className="h-5 w-5" />
        </Button>

        <div className="h-px bg-border/20 my-1"></div>

        <Button
          variant="outline"
          size="icon"
          onClick={scrollToTop}
          className="h-10 w-10 rounded-full bg-card border-border/50 hover:bg-card-hover shadow-lg transition-all"
          title="Haut de la page"
        >
          <Home className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile only: Compact horizontal layout */}
      <div className="sm:hidden flex gap-1 bg-card border border-border/50 rounded-full p-1 shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          disabled={currentSection === 0}
          className="h-8 w-8 rounded-full"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>

        <div className="flex gap-0.5 px-1">
          {SECTIONS.map((section, idx) => (
            <Button
              key={section.id}
              variant={currentSection === idx ? "default" : "ghost"}
              size="sm"
              onClick={() => scrollToSection(section.id)}
              className="h-7 w-7 rounded-full p-0 text-xs"
            >
              {section.icon}
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={currentSection === SECTIONS.length - 1}
          className="h-8 w-8 rounded-full"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
