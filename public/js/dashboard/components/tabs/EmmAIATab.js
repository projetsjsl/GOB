/**
 * Component: EmmAIATab
 * Iframe integration of EmmAIA (Gemini Live Assistant) into Dashboard
 * 
 * This component loads the EmmAIA app via iframe to keep it within
 * the dashboard without opening a new page.
 */

const { useState } = React;

const EmmAIATab = ({ isDarkMode, activeTab, setActiveTab }) => {
    const [isLoading, setIsLoading] = useState(true);

    const handleIframeLoad = () => {
        void('EmmAIA iframe loaded successfully');
        setIsLoading(false);
    };

    const handleIframeError = () => {
        console.error('Error loading EmmAIA iframe');
        setIsLoading(false);
    };

    return (
        <div className="h-full w-full relative" style={{ minHeight: 'calc(100vh - 140px)' }}>



            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                        <p className="text-gray-400">Chargement de Emma IA (Gemini Live)...</p>
                    </div>
                </div>
            )}
            <iframe
                src="/emmaia-build/index.html"
                className="w-full h-full border-0"
                style={{ minHeight: 'calc(100vh - 140px)' }}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title="EmmAIA - Assistante Gemini Live"
                allow="microphone; camera"
            />
        </div>
    );
};

window.EmmAIATab = EmmAIATab;
