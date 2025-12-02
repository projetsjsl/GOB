                        <div className={`flex items-center justify-around px-2 pb-safe ${
                            showEmmaAvatar ? 'pr-28' : ''
                        }`}>
                        <div className="fixed bottom-24 md:bottom-10 right-6 z-50 flex flex-col items-end gap-0.5 pointer-events-none">
                    'admin-jslai': 'iconoir-settings', // ✅ Icône valide
                { id: 'admin-jslai', label: 'Admin JSL AI', component: AdminJSLaiTab },
                        <div className={`flex items-center gap-1 px-2 pb-safe overflow-x-auto no-scrollbar ${
                            {tabs.map(tab => {
                                        className={`flex-1 min-w-[68px] flex flex-col items-center justify-center py-3 px-1 btn-ripple relative transition-all duration-300 group ${
                        {activeTab === 'admin-jslai' && <AdminJSLaiTab
