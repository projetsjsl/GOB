/**
 * Component: FinVoxTab
 * Wrapper for the FinVox Financial Assistant
 * 
 * This component embeds the built FinVox React application.
 * The FinVox app is built as a standalone bundle in public/finvox-build/
 */

const { useState, useEffect, useRef } = React;

const FinVoxTab = ({ isDarkMode }) => {
    const containerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Function to load the FinVox app
        const loadFinVox = async () => {
            try {
                // Check if assets are already loaded
                if (window.finvoxLoaded) {
                    setIsLoading(false);
                    return;
                }

                console.log('Loading FinVox assets...');

                // Load CSS if needed (though Vite usually injects it via JS in this config)
                // const link = document.createElement('link');
                // link.rel = 'stylesheet';
                // link.href = '/finvox-build/assets/index.css';
                // document.head.appendChild(link);

                // Load the main JS bundle
                // Note: We need to find the exact filename since Vite adds hashes by default,
                // but we configured rollupOptions to use fixed names 'assets/index.js'
                const script = document.createElement('script');
                script.type = 'module';
                script.src = '/finvox-build/assets/index.js';
                script.async = true;

                script.onload = () => {
                    console.log('FinVox script loaded');
                    window.finvoxLoaded = true;
                    setIsLoading(false);
                };

                script.onerror = (err) => {
                    console.error('Error loading FinVox script:', err);
                    setIsLoading(false);
                };

                document.body.appendChild(script);

            } catch (error) {
                console.error('Failed to load FinVox:', error);
                setIsLoading(false);
            }
        };

        loadFinVox();

        // Cleanup? Usually not needed for single-page app embedding unless we want to unmount the root
        return () => {
            // Optional cleanup
        };
    }, []);

    return (
        <div className="w-full h-[calc(100vh-140px)] relative rounded-2xl overflow-hidden shadow-2xl bg-slate-900">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-50">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-emerald-400 font-medium animate-pulse">Chargement de FinVox...</p>
                    </div>
                </div>
            )}

            {/* 
                The FinVox app mounts to a root element. 
                We need to ensure the build output targets a specific ID or we provide it here.
                Checking index.html of FinVox, it likely mounts to 'root'.
                Since we are inside another React app, we need to be careful about ID conflicts.
                
                Ideally, FinVox should mount to a unique ID like 'finvox-root'.
                For now, let's assume we can provide a container.
            */}
            <div id="finvox-root" className="w-full h-full overflow-auto">
                {/* FinVox app will mount here */}
            </div>
        </div>
    );
};

window.FinVoxTab = FinVoxTab;
