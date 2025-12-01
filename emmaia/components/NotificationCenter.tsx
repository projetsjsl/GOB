
import React, { useState } from 'react';
import { Bell } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
    // Mock logic for demo
    const [unread, setUnread] = useState(2);
    
    return (
        <div className="fixed top-6 right-20 z-50">
            <button className="relative p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-full transition-all group">
                <Bell className="w-5 h-5 text-slate-300 group-hover:text-white" />
                {unread > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-slate-900"></span>
                )}
            </button>
        </div>
    );
};
