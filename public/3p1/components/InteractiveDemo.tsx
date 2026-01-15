import React, { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon,
  TableCellsIcon,
  MagnifyingGlassIcon,
  PresentationChartBarIcon
} from '@heroicons/react/24/outline';

interface InteractiveDemoProps {
  onClose: () => void;
  onSelectTicker?: () => void; // Callback pour guider vers la selection d'un ticker
  onLoadDefaultTicker?: () => void; // Callback pour charger ACN par defaut
}

type DemoStep = 1 | 2 | 3;

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const InteractiveDemo: React.FC<InteractiveDemoProps> = ({ onClose, onSelectTicker, onLoadDefaultTicker }) => {
  const [currentStep, setCurrentStep] = useState<DemoStep>(1);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Definir les elements a mettre en evidence pour chaque etape
  const stepConfig = {
    1: {
      title: "Etape 1: Selectionner un ticker",
      description: "Commencez par choisir un titre dans la barre laterale gauche. Vous pouvez rechercher par symbole (ex: AAPL) ou par nom d'entreprise.",
      highlightSelector: '[data-demo="sidebar"]',
      elementDescription: "La sidebar contient tous vos tickers. Utilisez la barre de recherche pour trouver rapidement un titre.",
      icon: MagnifyingGlassIcon,
      color: "blue"
    },
    2: {
      title: "Etape 2: Explorer les donnees historiques",
      description: "Une fois un ticker selectionne, vous verrez ses donnees financieres historiques dans le tableau principal. Les couleurs indiquent la source des donnees (vert = FMP verifie, bleu = FMP ajuste, orange = manuel, gris = calcule).",
      highlightSelector: '[data-demo="historical-table"]',
      elementDescription: "Le tableau affiche les donnees annuelles: prix, benefices, dividendes, etc. Cliquez sur une cellule pour la modifier. Consultez la legende des couleurs au-dessus du tableau.",
      icon: TableCellsIcon,
      color: "green"
    },
    3: {
      title: "Etape 3: Utiliser les fonctionnalites avancees",
      description: "Explorez les graphiques de valorisation, les metriques additionnelles, et synchronisez les donnees depuis l'API pour obtenir les informations les plus recentes.",
      highlightSelector: '[data-demo="features"]',
      elementDescription: "Les onglets en haut permettent d'acceder aux graphiques, metriques, et autres analyses. Le bouton de synchronisation met a jour les donnees depuis l'API.",
      icon: PresentationChartBarIcon,
      color: "purple"
    }
  };

  const currentConfig = stepConfig[currentStep];
  const Icon = currentConfig.icon;

  // Effet pour calculer la position de l'element a mettre en evidence
  useEffect(() => {
    const updateHighlight = () => {
      const element = document.querySelector(currentConfig.highlightSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
        // Ajouter une classe pour mettre en evidence l'element
        element.classList.add('demo-highlight');
      } else {
        setHighlightRect(null);
      }
    };

    // Mettre a jour au montage et au changement d'etape
    updateHighlight();
    
    // Mettre a jour lors du scroll ou resize
    window.addEventListener('scroll', updateHighlight, true);
    window.addEventListener('resize', updateHighlight);
    
    return () => {
      window.removeEventListener('scroll', updateHighlight, true);
      window.removeEventListener('resize', updateHighlight);
      // Nettoyer la classe highlight
      const element = document.querySelector(currentConfig.highlightSelector);
      if (element) {
        element.classList.remove('demo-highlight');
      }
    };
  }, [currentStep, currentConfig.highlightSelector]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as DemoStep);
    } else {
      // A la fin du demo, charger ACN par defaut
      if (onLoadDefaultTicker) {
        onLoadDefaultTicker();
      }
      //  Memoriser que l'utilisateur a termine le demo
      localStorage.setItem('3p1-has-closed-demo', 'true');
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as DemoStep);
    }
  };

  const handleSkip = () => {
    // Meme si on skip, charger ACN par defaut
    if (onLoadDefaultTicker) {
      onLoadDefaultTicker();
    }
    //  Memoriser que l'utilisateur a ferme le demo
    localStorage.setItem('3p1-has-closed-demo', 'true');
    onClose();
  };

  const handleSelectTicker = () => {
    if (onSelectTicker) {
      onSelectTicker();
    }
    if (currentStep === 1) {
      handleNext();
    }
  };

  // Calculer le clip-path pour creer le trou dans l'overlay
  const getClipPath = () => {
    if (!highlightRect) {
      // Si pas d'element a mettre en evidence, overlay complet
      return 'polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%)';
    }
    const { top, left, width, height } = highlightRect;
    const padding = 12; // Padding autour de l'element
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Creer un polygon qui couvre tout sauf la zone de l'element
    return `polygon(
      0% 0%, 
      0% 100%, 
      ${Math.max(0, left - padding)}px 100%, 
      ${Math.max(0, left - padding)}px ${Math.max(0, top - padding)}px, 
      ${Math.min(viewportWidth, left + width + padding)}px ${Math.max(0, top - padding)}px, 
      ${Math.min(viewportWidth, left + width + padding)}px ${Math.min(viewportHeight, top + height + padding)}px, 
      ${Math.max(0, left - padding)}px ${Math.min(viewportHeight, top + height + padding)}px, 
      ${Math.max(0, left - padding)}px 100%, 
      100% 100%, 
      100% 0%
    )`;
  };

  return (
    <>
      {/* Overlay assombri avec trou pour l'element mis en evidence */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/70 z-[9998] pointer-events-auto transition-all duration-300"
        style={{
          clipPath: getClipPath(),
          WebkitClipPath: getClipPath()
        }}
      />

      {/* Guide interactif */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-2xl mx-4 pointer-events-auto">
        <div 
          className="bg-white rounded-2xl shadow-2xl border-4 p-6 sm:p-8"
          style={{
            borderColor: currentStep === 1 ? '#3b82f6' : currentStep === 2 ? '#10b981' : '#a855f7'
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-xl"
                style={{
                  backgroundColor: currentStep === 1 ? '#dbeafe' : currentStep === 2 ? '#d1fae5' : '#f3e8ff'
                }}
              >
                <Icon 
                  className="w-8 h-8"
                  style={{
                    color: currentStep === 1 ? '#2563eb' : currentStep === 2 ? '#059669' : '#9333ea'
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-500">Etape {currentStep} sur 3</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: step === currentStep
                            ? (step === 1 ? '#3b82f6' : step === 2 ? '#10b981' : '#a855f7')
                            : step < currentStep
                            ? '#9ca3af'
                            : '#e5e7eb'
                        }}
                      />
                    ))}
                  </div>
                </div>
                <h3 
                  className="text-xl sm:text-2xl font-bold"
                  style={{
                    color: currentStep === 1 ? '#1e40af' : currentStep === 2 ? '#047857' : '#7e22ce'
                  }}
                >
                  {currentConfig.title}
                </h3>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Fermer le guide"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Contenu */}
          <div className="mb-6">
            <p className="text-gray-700 text-base sm:text-lg mb-4 leading-relaxed">
              {currentConfig.description}
            </p>
            <div 
              className="p-4 rounded-r-lg border-l-4"
              style={{
                backgroundColor: currentStep === 1 ? '#eff6ff' : currentStep === 2 ? '#f0fdf4' : '#faf5ff',
                borderColor: currentStep === 1 ? '#3b82f6' : currentStep === 2 ? '#10b981' : '#a855f7'
              }}
            >
              <p className="text-sm text-gray-700">
                <strong> Astuce:</strong> {currentConfig.elementDescription}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ChevronLeftIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Precedent</span>
            </button>

            <div className="flex gap-2">
              {currentStep === 1 && onSelectTicker && (
                <button
                  onClick={handleSelectTicker}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                  <span>Ouvrir la sidebar</span>
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors text-white"
                style={{
                  backgroundColor: currentStep === 3
                    ? '#16a34a'
                    : currentStep === 1
                    ? '#2563eb'
                    : '#059669'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <span>{currentStep === 3 ? 'Commencer' : 'Suivant'}</span>
                {currentStep < 3 && <ChevronRightIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Styles pour mettre en evidence l'element */}
      <style>{`
        .demo-highlight {
          position: relative;
          z-index: 9999 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3) !important;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
};
