/**
 * Component to edit Secondary Navigation (MobileNavOverlay) items
 */
const SecondaryNavEditor = ({ isOpen, onClose, activeTab, currentConfig, onSave, allOptions }) => {
    const [selectedIds, setSelectedIds] = React.useState([]);

    React.useEffect(() => {
        if (isOpen) {
            const configKey = currentConfig[activeTab] ? activeTab : 'default';
            const currentIds = currentConfig[configKey] || currentConfig['default'] || [];
            setSelectedIds(currentIds);
        }
    }, [isOpen, activeTab, currentConfig]);

    if (!isOpen) return null;

    const handleToggle = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleSave = () => {
        onSave(activeTab, selectedIds);
        onClose();
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <i className="iconoir-settings"></i> Configurer Navigation
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <i className="iconoir-xmark text-lg"></i>
                    </button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1 space-y-2">
                    <p className="text-sm text-gray-500 mb-4">
                        Sélectionnez les éléments à afficher dans le menu secondaire pour l'onglet <strong>{activeTab}</strong>.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-2">
                        {allOptions.map(option => (
                            <label 
                                key={option.id} 
                                className={`
                                    flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                    ${selectedIds.includes(option.id) 
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 ring-1 ring-emerald-500' 
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }
                                `}
                            >
                                <input 
                                    type="checkbox" 
                                    checked={selectedIds.includes(option.id)}
                                    onChange={() => handleToggle(option.id)}
                                    className="hidden"
                                />
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                                    selectedIds.includes(option.id)
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'border-gray-400 dark:border-gray-500'
                                }`}>
                                    {selectedIds.includes(option.id) && <i className="iconoir-check text-xs"></i>}
                                </div>
                                
                                <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                                    {option.label}
                                </span>
                                
                                {option.icon && <i className={`${option.icon} text-gray-400`}></i>}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
                    >
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

window.SecondaryNavEditor = SecondaryNavEditor;
