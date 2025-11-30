/**
 * Component: FinVoxTab
 * Iframe integration of FinVox Financial Assistant into Dashboard
 * 
 * This component loads the FinVox app via iframe to keep it within
 * the dashboard without opening a new page.
 */

const { useState } = React;

const FinVoxTab = ({ isDarkMode }) => {
    const [isLoading, setIsLoading] = useState(true);

    const handleIframeLoad = () => {
        console.log('FinVox iframe loaded successfully');
        setIsLoading(false);
    };

    const handleIframeError = () => {
        console.error('Error loading FinVox iframe');
        setIsLoading(false);
    };

    return (
        <div className="h-full w-full relative" style={{ minHeight: 'calc(100vh - 140px)' }}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                        <p className="text-gray-400">Chargement de FinVox...</p>
                    </div>
                </div>
            )}
            <iframe
                src="/finvox-build/index.html"
                className="w-full h-full border-0"
                style={{ minHeight: 'calc(100vh - 140px)' }}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title="FinVox Financial Assistant"
                allow="microphone"
            />
        </div>
    );
};

window.FinVoxTab = FinVoxTab;
