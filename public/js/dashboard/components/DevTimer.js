window.DevTimer = function() {
    const [timeLeft, setTimeLeft] = React.useState(20 * 60); // 20 minutes
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isVisible) return null;

    return React.createElement(
        'div',
        {
            className: 'fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-4 border-2 border-white/20 animate-pulse',
            style: { fontFamily: 'monospace', fontSize: '1.2rem' }
        },
        React.createElement('span', { className: 'text-2xl' }, '👨‍💻'),
        React.createElement(
            'div',
            { className: 'flex flex-col' },
            React.createElement('span', { className: 'text-xs uppercase opacity-75 font-bold tracking-wider' }, 'Sprint IA en cours'),
            React.createElement('span', { className: 'font-bold text-xl' }, formatTime(timeLeft))
        ),
        React.createElement(
            'button',
            {
                onClick: () => setIsVisible(false),
                className: 'ml-2 text-white/50 hover:text-white transition-colors'
            },
            '✕'
        )
    );
};

// Auto-mount
const timerContainer = document.createElement('div');
timerContainer.id = 'dev-timer-root';
document.body.appendChild(timerContainer);
const root = ReactDOM.createRoot(timerContainer);
root.render(React.createElement(window.DevTimer));
