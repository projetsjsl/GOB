import React from 'react';

            const Icon = ({ emoji, size = 20, className = '' }) => {
                if (!isProfessionalMode) {
                    return <span className="inline-block">{emoji}</span>;
                }

                const iconClass = window.ProfessionalModeSystem.emojiToIcon[emoji];
                if (iconClass) {
                    return <i className={`iconoir-${iconClass} ${className}`} style={{ fontSize: `${size}px` }}></i>;
                }

                return <span className="inline-block">{emoji}</span>;
            };

export default Icon;
