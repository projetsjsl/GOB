const MobileNavOverlay = ({
    items = [],
    activeTab,
    onTabChange,
    isDarkMode,
    position = 'right'  // Changed default from 'left' to 'right'
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    // Portal to body to avoid z-index issues
    const overlayRoot = document.body;

    if (!items || items.length === 0) return null;

    // Determine position classes
    const isRight = position === 'right';
    const translateClosed = isRight ? 'translate-x-12' : '-translate-x-12';
    const translateOpen = 'translate-x-0';
    
    const content = (
        <div className="fixed z-[9999]" style={{ top: '50%', [isRight ? 'right' : 'left']: '0', transform: 'translateY(-50%)' }}>
            <div className="relative flex items-center">
                
                {/* Toggle Button - Made BIGGER */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        absolute top-1/2 -translate-y-1/2
                        ${isRight ? 'right-0' : 'left-0'}
                        p-4 shadow-lg backdrop-blur-md border transition-transform duration-300
                        ${isDarkMode 
                            ? 'bg-neutral-900/90 border-neutral-700 text-white' 
                            : 'bg-white/90 border-gray-200 text-gray-900'
                        }
                        ${isRight 
                            ? 'rounded-l-xl border-r-0' 
                            : 'rounded-r-xl border-l-0'
                        }
                        ${isOpen ? (isRight ? 'translate-x-[0px]' : 'translate-x-[0px]') : ''}
                    `}
                    style={{ zIndex: 100 }}
                >
                    <window.LucideIcon 
                        name={isOpen ? (isRight ? "ChevronRight" : "ChevronLeft") : "Menu"} 
                        className="w-7 h-7" 
                    />
                </button>

                {/* Content Panel */}
                <div 
                    className={`
                        overflow-y-auto scrollbar-hide shadow-xl backdrop-blur-xl border transition-all duration-300
                        ${isDarkMode 
                            ? 'bg-neutral-900/95 border-neutral-700' 
                            : 'bg-white/95 border-gray-200'
                        }
                        ${isRight ? 'border-r-0 rounded-l-xl mr-0' : 'border-l-0 rounded-r-xl ml-0'}
                    `}
                    style={{
                        width: isOpen ? '200px' : '0px',
                        height: 'auto',
                        maxHeight: '70vh',
                        opacity: isOpen ? 1 : 0,
                        visibility: isOpen ? 'visible' : 'hidden',
                        overflow: 'hidden'
                    }}
                >
                    <div className="flex flex-col p-3 gap-2" style={{ width: '200px' }}>
                        {items.map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    setIsOpen(false);
                                }}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full text-left
                                    ${activeTab === item.id
                                        ? isDarkMode
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-emerald-50 text-emerald-600'
                                        : isDarkMode
                                            ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }
                                `}
                            >
                                <window.LucideIcon name={item.icon || 'Circle'} className="w-4 h-4 shrink-0" />
                                <span className="truncate">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(content, overlayRoot);
};

window.MobileNavOverlay = MobileNavOverlay;
