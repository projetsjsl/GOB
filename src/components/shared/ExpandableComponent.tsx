import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface ExpandableComponentProps {
    children: ReactNode;
    title?: string;
    className?: string;
    icon?: string;
    isDarkMode?: boolean;
}

export const ExpandableComponent: React.FC<ExpandableComponentProps> = ({
    children,
    title = '',
    className = '',
    icon = '🔍',
    isDarkMode = false
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Gérer la touche ESC pour fermer
    useEffect(() => {
        if (!isExpanded) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsExpanded(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isExpanded]);

    // Gérer le scroll du body quand la modal est ouverte
    useEffect(() => {
        if (isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isExpanded]);

    return (
        <>
            <div className={`relative ${className}`}>
                {/* Bouton d'agrandissement */}
                <button
                    onClick={() => setIsExpanded(true)}
                    className={`absolute top-2 right-2 z-10 p-1.5 md:p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                        isDarkMode
                            ? 'bg-gray-800/90 hover:bg-gray-700 text-white border border-gray-600 shadow-lg'
                            : 'bg-white/90 hover:bg-gray-100 text-gray-700 border border-gray-300 shadow-lg'
                    }`}
                    title="Agrandir dans une fenêtre"
                >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>
                <div ref={contentRef}>
                    {children}
                </div>
            </div>

            {/* Modal fullscreen */}
            {isExpanded && (
                <div
                    ref={modalRef}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-sm"
                    onClick={() => setIsExpanded(false)}
                >
                    <div
                        className={`relative w-full h-full p-2 md:p-4 flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header avec titre et bouton fermer */}
                        <div className={`flex items-center justify-between mb-2 pb-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {icon} {title || 'Vue agrandie'}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    ESC pour fermer
                                </span>
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                        isDarkMode
                                            ? 'hover:bg-gray-800 text-white'
                                            : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                                    title="Fermer (ESC)"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Contenu agrandi */}
                        <div className="flex-1 overflow-auto min-h-0">
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExpandableComponent;













