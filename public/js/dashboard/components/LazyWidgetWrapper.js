const LazyWidgetWrapper = ({ children, height = '300px', threshold = 0.1, placeholderTitle = 'Chargement...' }) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const containerRef = React.useRef(null);
    const isMountedRef = React.useRef(true);

    React.useEffect(() => {
        isMountedRef.current = true;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                // Add a small delay to avoid loading if user just scrolls past quickly
                setTimeout(() => {
                    if (isMountedRef.current && containerRef.current) {
                        setIsVisible(true);
                    }
                }, 100);
                observer.disconnect();
            }
        }, {
            rootMargin: '200px', // Preload 200px before it comes into view
            threshold
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            isMountedRef.current = false;
            observer.disconnect();
        };
    }, [threshold]);

    return React.createElement('div', { 
        ref: containerRef, 
        style: { minHeight: height, position: 'relative' },
        className: "w-full transition-all duration-300"
    }, isVisible ? children : React.createElement('div', {
        className: "flex items-center justify-center w-full bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700",
        style: { height }
    }, React.createElement('div', { className: "text-center" },
        React.createElement('div', { className: "w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" }),
        React.createElement('p', { className: "text-gray-400 text-sm font-medium" }, placeholderTitle)
    )));
};

window.LazyWidgetWrapper = LazyWidgetWrapper;
