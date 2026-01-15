/**
 * GOB Dashboard - V0 Bootstrap v3
 * Premium UI Components & Analytics Functions
 * 
 */

(function() {
    'use strict';

    if (window.__v0BootstrapV3) return;
    window.__v0BootstrapV3 = true;

    console.log(' GOB V0 Bootstrap v3: Initializing...');

    const React = window.React;
    const { createElement: h, forwardRef, useState, useRef, useEffect } = React;

    // 
    // DESIGN TOKENS
    // 
    const colors = {
        bg: {
            primary: '#09090b',
            secondary: '#0f0f11',
            elevated: '#18181b',
            hover: '#27272a',
        },
        text: {
            primary: '#fafafa',
            secondary: '#a1a1aa',
            muted: '#71717a',
        },
        border: {
            subtle: 'rgba(255, 255, 255, 0.06)',
            default: 'rgba(255, 255, 255, 0.1)',
            accent: 'rgba(59, 130, 246, 0.3)',
        },
        accent: {
            blue: '#3b82f6',
            blueLight: '#60a5fa',
            indigo: '#6366f1',
            emerald: '#10b981',
            amber: '#f59e0b',
            red: '#ef4444',
        }
    };

    // 
    // UI COMPONENTS - Premium Shadcn Mocks
    // 
    const UI = {
        
        // Button Component - Enhanced with clear visual feedback
        Button: forwardRef((props, ref) => {
            const { variant = 'default', size = 'default', className = '', children, disabled, active, ...rest } = props;
            
            const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none';
            
            const variants = {
                default: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-500/30 shadow-lg shadow-blue-500/20 hover:-translate-y-0.5',
                secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white border border-zinc-700 hover:border-zinc-600 hover:-translate-y-0.5',
                outline: 'border border-zinc-700 bg-transparent hover:bg-zinc-800/70 hover:border-zinc-500 text-zinc-400 hover:text-white',
                ghost: 'bg-transparent hover:bg-white/10 text-zinc-400 hover:text-white',
                destructive: 'bg-red-600 text-white hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/30',
                link: 'text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline',
            };
            
            const sizes = {
                default: 'h-10 px-5 py-2 text-sm',
                sm: 'h-8 px-3 text-xs gap-1',
                lg: 'h-12 px-8 text-base',
                icon: 'h-10 w-10 p-0',
            };

            // Active/selected state override
            const activeStyles = active ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]' : '';
            
            return h('button', {
                ...rest,
                ref,
                disabled,
                'aria-pressed': active,
                className: `${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${activeStyles} ${className}`
            }, children);
        }),

        // Card Components
        Card: (props) => h('div', { 
            ...props, 
            className: `bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm ${props.className || ''}` 
        }),
        
        CardHeader: (props) => h('div', { 
            ...props, 
            className: `p-5 border-b border-zinc-800/50 ${props.className || ''}` 
        }),
        
        CardTitle: (props) => h('h3', { 
            ...props, 
            className: `text-base font-bold text-white ${props.className || ''}` 
        }),
        
        CardDescription: (props) => h('p', { 
            ...props, 
            className: `text-sm text-zinc-500 mt-1 ${props.className || ''}` 
        }),
        
        CardAction: (props) => h('div', { 
            ...props, 
            className: `absolute top-4 right-4 ${props.className || ''}` 
        }),
        
        CardContent: (props) => h('div', { 
            ...props, 
            className: `p-5 ${props.className || ''}` 
        }),
        
        CardFooter: (props) => h('div', { 
            ...props, 
            className: `p-5 border-t border-zinc-800/50 bg-zinc-900/30 ${props.className || ''}` 
        }),

        // Input Component
        Input: forwardRef((props, ref) => {
            const { className = '', type = 'text', ...rest } = props;
            return h('input', {
                ...rest,
                ref,
                type,
                className: `w-full h-10 px-4 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all ${className}`
            });
        }),

        // Badge Component
        Badge: (props) => {
            const { variant = 'default', className = '', children, ...rest } = props;
            const variants = {
                default: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                secondary: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                destructive: 'bg-red-500/10 text-red-400 border-red-500/20',
                warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            };
            return h('span', {
                ...rest,
                className: `inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${variants[variant] || variants.default} ${className}`
            }, children);
        },

        // Label Component
        Label: (props) => h('label', { 
            ...props, 
            className: `text-sm font-medium text-zinc-300 ${props.className || ''}` 
        }),

        // Checkbox Component
        Checkbox: forwardRef((props, ref) => {
            const { className = '', checked, onCheckedChange, ...rest } = props;
            return h('input', {
                ...rest,
                ref,
                type: 'checkbox',
                checked,
                onChange: (e) => onCheckedChange?.(e.target.checked),
                className: `w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer ${className}`
            });
        }),

        // Select Components
        Select: (props) => {
            const [isOpen, setIsOpen] = useState(false);
            const [value, setValue] = useState(props.value || props.defaultValue || '');
            const selectRef = useRef(null);

            useEffect(() => {
                if (props.value !== undefined) setValue(props.value);
            }, [props.value]);

            // Close on click outside
            useEffect(() => {
                const handleClickOutside = (e) => {
                    if (selectRef.current && !selectRef.current.contains(e.target)) {
                        setIsOpen(false);
                    }
                };
                if (isOpen) {
                    document.addEventListener('mousedown', handleClickOutside);
                    return () => document.removeEventListener('mousedown', handleClickOutside);
                }
            }, [isOpen]);
            
            // Close on scroll
            useEffect(() => {
                const handleScroll = () => setIsOpen(false);
                if (isOpen) {
                    window.addEventListener('scroll', handleScroll, true);
                    return () => window.removeEventListener('scroll', handleScroll, true);
                }
            }, [isOpen]);
            
            // Close on escape key
            useEffect(() => {
                const handleEscape = (e) => {
                    if (e.key === 'Escape') setIsOpen(false);
                };
                if (isOpen) {
                    document.addEventListener('keydown', handleEscape);
                    return () => document.removeEventListener('keydown', handleEscape);
                }
            }, [isOpen]);

            return h('div', { ref: selectRef, className: 'relative', 'data-select': true },
                React.Children.map(props.children, child => {
                    if (!React.isValidElement(child)) return child;
                    return React.cloneElement(child, {
                        value,
                        isOpen,
                        onOpenChange: setIsOpen,
                        onValueChange: (v) => {
                            setValue(v);
                            setIsOpen(false);
                            props.onValueChange?.(v);
                        }
                    });
                })
            );
        },

        SelectTrigger: (props) => {
            const { className = '', children, isOpen, onOpenChange, value, ...rest } = props;
            // Clone children and pass value to SelectValue
            const childrenWithValue = React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { value });
                }
                return child;
            });
            return h('button', {
                ...rest,
                type: 'button',
                onClick: () => onOpenChange?.(!isOpen),
                className: `flex h-10 w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${isOpen ? 'ring-2 ring-blue-500/30 border-blue-500/50' : ''} ${className}`
            }, 
                childrenWithValue,
                h('span', { className: `ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}` }, '')
            );
        },

        SelectValue: (props) => {
            // Map values to display labels
            const valueLabels = {
                'linear': 'Lineaire',
                'cubic-spline': 'Spline Cubique',
                'nelson-siegel': 'Nelson-Siegel',
                'monotone-cubic': 'Monotone Cubique',
            };
            const displayValue = valueLabels[props.value] || props.value || props.placeholder || 'Selectionner...';
            return h('span', { className: 'truncate' }, displayValue);
        },

        SelectContent: (props) => {
            const { isOpen, className = '', children, ...rest } = props;
            if (!isOpen) return null;
            // z-[60] to be above header sticky z-50
            return h('div', {
                ...rest,
                className: `absolute z-[60] mt-1 w-full min-w-[180px] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/50 animate-in fade-in-0 zoom-in-95 ${className}`
            }, h('div', { className: 'p-1' }, children));
        },

        SelectItem: (props) => {
            const { value, children, className = '', onValueChange, ...rest } = props;
            return h('div', {
                ...rest,
                onClick: () => onValueChange?.(value),
                className: `relative flex w-full cursor-pointer select-none items-center rounded-md py-2 px-3 text-sm text-zinc-300 outline-none hover:bg-zinc-800 hover:text-white transition-colors ${className}`
            }, children);
        },

        SelectGroup: (props) => h('div', { className: 'p-1' }, props.children),
        SelectLabel: (props) => h('div', { className: 'px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider' }, props.children),

        // Tabs Components
        Tabs: (props) => h('div', { className: props.className }, props.children),
        
        TabsList: (props) => h('div', { 
            ...props, 
            className: `inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900/50 p-1 ${props.className || ''}` 
        }),
        
        TabsTrigger: (props) => {
            const { value, active, onClick, className = '', children, ...rest } = props;
            return h('button', {
                ...rest,
                onClick,
                className: `inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 ${
                    active 
                        ? 'bg-zinc-800 text-white shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                } ${className}`
            }, children);
        },
        
        TabsContent: (props) => h('div', { className: 'mt-4' }, props.children),

        // Dialog Components (Mock - renders children directly or nothing)
        Dialog: (props) => h('div', { 'data-dialog': true }, props.children),
        DialogTrigger: (props) => {
            const { asChild, children, ...rest } = props;
            if (asChild && React.isValidElement(children)) {
                return React.cloneElement(children, rest);
            }
            return h('div', rest, children);
        },
        DialogContent: () => null, // Don't render dialog content to avoid duplication
        DialogHeader: (props) => h('div', { className: 'flex flex-col gap-1.5 text-center sm:text-left' }, props.children),
        DialogTitle: (props) => h('h3', { className: 'text-lg font-semibold text-white' }, props.children),
        DialogDescription: (props) => h('p', { className: 'text-sm text-zinc-500' }, props.children),
        DialogFooter: (props) => h('div', { className: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2 mt-4' }, props.children),

        // Table Components
        Table: (props) => h('table', { ...props, className: `w-full text-sm ${props.className || ''}` }),
        TableHeader: (props) => h('thead', { ...props, className: `border-b border-zinc-800 ${props.className || ''}` }),
        TableBody: (props) => h('tbody', { ...props, className: `divide-y divide-zinc-800/50 ${props.className || ''}` }),
        TableFooter: (props) => h('tfoot', { ...props, className: `border-t border-zinc-800 bg-zinc-900/50 ${props.className || ''}` }),
        TableRow: (props) => h('tr', { ...props, className: `hover:bg-zinc-800/30 transition-colors ${props.className || ''}` }),
        TableHead: (props) => h('th', { ...props, className: `h-12 px-4 text-left align-middle font-semibold text-zinc-400 ${props.className || ''}` }),
        TableCell: (props) => h('td', { ...props, className: `p-4 align-middle ${props.className || ''}` }),
        TableCaption: (props) => h('caption', { ...props, className: `mt-4 text-sm text-zinc-500 ${props.className || ''}` }),

        // Utility Components
        Skeleton: (props) => h('div', { 
            ...props, 
            className: `animate-pulse bg-zinc-800 rounded ${props.className || ''}` 
        }),
        
        Separator: (props) => h('div', { 
            ...props, 
            className: `h-px bg-zinc-800 ${props.className || ''}` 
        }),

        Switch: (props) => {
            const { checked, onCheckedChange, className = '' } = props;
            return h('button', {
                type: 'button',
                role: 'switch',
                'aria-checked': checked,
                onClick: () => onCheckedChange?.(!checked),
                className: `relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${checked ? 'bg-blue-600' : 'bg-zinc-700'} ${className}`
            }, 
                h('span', {
                    className: `pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`
                })
            );
        },

        Slider: (props) => {
            const { value = [50], onValueChange, min = 0, max = 100, step = 1, className = '' } = props;
            return h('input', {
                type: 'range',
                min,
                max,
                step,
                value: value[0],
                onChange: (e) => onValueChange?.([parseFloat(e.target.value)]),
                className: `w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 ${className}`
            });
        },
    };

    // Expose all UI components to window
    Object.entries(UI).forEach(([name, component]) => {
        window[name] = component;
    });

    // 
    // ANALYTICS FUNCTIONS
    // 
    
    window.isValidYield = (value) => {
        return value !== null && value !== undefined && !isNaN(value) && isFinite(value) && value > 0;
    };

    window.calculateDailyPerformance = (current, previous) => {
        const performance = {};
        if (!current) return performance;
        
        current.forEach(point => {
            if (previous) {
                const oldPoint = previous.find(p => p.maturity === point.maturity);
                if (oldPoint) {
                    performance[point.maturity] = (point.yield - oldPoint.yield) * 100;
                }
            } else {
                performance[point.maturity] = 0;
            }
        });
        return performance;
    };

    window.calculateSpreads = (points) => {
        if (!points || points.length === 0) return null;
        
        const getYield = (maturity) => points.find(p => p.maturity === maturity)?.yield;
        const y2 = getYield("2Y");
        const y3m = getYield("3M");
        const y5 = getYield("5Y");
        const y10 = getYield("10Y");
        const y30 = getYield("30Y");

        return {
            spread_2_10: (window.isValidYield(y10) && window.isValidYield(y2)) ? (y10 - y2) * 100 : 0,
            spread_2_30: (window.isValidYield(y30) && window.isValidYield(y2)) ? (y30 - y2) * 100 : 0,
            spread_3m_10: (window.isValidYield(y10) && window.isValidYield(y3m)) ? (y10 - y3m) * 100 : 0,
            spread_5_30: (window.isValidYield(y30) && window.isValidYield(y5)) ? (y30 - y5) * 100 : 0,
        };
    };

    window.calculateButterflySpreads = (points) => {
        if (!points || points.length === 0) return [];
        
        const butterflies = [];
        const getYield = (maturity) => points.find(p => p.maturity === maturity)?.yield;
        
        const y2 = getYield("2Y");
        const y5 = getYield("5Y");
        const y10 = getYield("10Y");
        const y30 = getYield("30Y");

        if (window.isValidYield(y2) && window.isValidYield(y5) && window.isValidYield(y10)) {
            butterflies.push({
                name: "2-5-10",
                value: (y2 + y10 - 2 * y5) * 100,
                short1: "2Y",
                long: "5Y",
                short2: "10Y"
            });
        }

        if (window.isValidYield(y5) && window.isValidYield(y10) && window.isValidYield(y30)) {
            butterflies.push({
                name: "5-10-30",
                value: (y5 + y30 - 2 * y10) * 100,
                short1: "5Y",
                long: "10Y",
                short2: "30Y"
            });
        }

        return butterflies;
    };

    window.calculateForwardRates = (points) => {
        if (!points || points.length < 2) return [];
        
        const sorted = [...points].sort((a, b) => a.days - b.days);
        const forwards = [];

        for (let i = 0; i < sorted.length - 1; i++) {
            const p1 = sorted[i];
            const p2 = sorted[i + 1];
            const t1 = p1.days / 365;
            const t2 = p2.days / 365;
            
            if (t2 > t1 && window.isValidYield(p1.yield) && window.isValidYield(p2.yield)) {
                const forward = (p2.yield * t2 - p1.yield * t1) / (t2 - t1);
                forwards.push({
                    maturity: `${p1.maturity}-${p2.maturity}`,
                    forward: forward,
                    startDays: p1.days,
                    endDays: p2.days
                });
            }
        }

        return forwards;
    };

    window.calculateEnhancedCurveMetrics = (points, historical) => {
        if (!points || points.length === 0) return null;
        
        const getYield = (maturity) => points.find(p => p.maturity === maturity)?.yield;
        
        const y2 = getYield("2Y");
        const y5 = getYield("5Y");
        const y10 = getYield("10Y");
        const y30 = getYield("30Y");

        if (![y2, y5, y10, y30].every(window.isValidYield)) {
            return null;
        }

        return {
            level: (y2 + y5 + y10 + y30) / 4,
            slope: y30 - y2,
            curvature: 2 * y10 - y2 - y30,
            slope_2_10: y10 - y2,
            slope_10_30: y30 - y10,
        };
    };

    // 
    // INTERPOLATION FUNCTIONS
    // 

    window.linearInterpolation = (points, targetDays) => {
        if (!points || points.length === 0) return [];
        
        const sorted = [...points]
            .filter(p => window.isValidYield(p.yield) && p.days > 0)
            .sort((a, b) => a.days - b.days);
        
        if (sorted.length === 0) return [];

        return targetDays.map(days => {
            // Find surrounding points
            let lower = sorted[0];
            let upper = sorted[sorted.length - 1];

            for (let i = 0; i < sorted.length - 1; i++) {
                if (sorted[i].days <= days && sorted[i + 1].days >= days) {
                    lower = sorted[i];
                    upper = sorted[i + 1];
                    break;
                }
            }

            // Handle edge cases
            if (days <= sorted[0].days) return { days, yield: sorted[0].yield };
            if (days >= sorted[sorted.length - 1].days) return { days, yield: sorted[sorted.length - 1].yield };
            if (lower.days === upper.days) return { days, yield: lower.yield };

            // Linear interpolation
            const t = (days - lower.days) / (upper.days - lower.days);
            return { days, yield: lower.yield + t * (upper.yield - lower.yield) };
        });
    };

    // Fallback implementations (use linear for stability in browser environment)
    window.cubicSplineInterpolation = (points, targetDays) => window.linearInterpolation(points, targetDays);
    window.nelsonSiegelInterpolation = (points, targetDays) => window.linearInterpolation(points, targetDays);
    window.monotoneCubicInterpolation = (points, targetDays) => window.linearInterpolation(points, targetDays);

    window.interpolateYieldCurve = (points, method = 'linear', numPoints = 100) => {
        if (!points || points.length === 0) return [];

        const validPoints = points.filter(p => window.isValidYield(p.yield) && p.days > 0);
        if (validPoints.length === 0) return [];

        const minDays = Math.min(...validPoints.map(p => p.days));
        const maxDays = Math.max(...validPoints.map(p => p.days));
        
        const targetDays = [];
        for (let i = 0; i <= numPoints; i++) {
            targetDays.push(minDays + (maxDays - minDays) * (i / numPoints));
        }

        switch (method) {
            case 'linear':
                return window.linearInterpolation(validPoints, targetDays);
            case 'cubic-spline':
                return window.cubicSplineInterpolation(validPoints, targetDays);
            case 'nelson-siegel':
                return window.nelsonSiegelInterpolation(validPoints, targetDays);
            case 'monotone-cubic':
                return window.monotoneCubicInterpolation(validPoints, targetDays);
            default:
                return window.linearInterpolation(validPoints, targetDays);
        }
    };

    window.maturityToMonths = (maturity) => {
        if (!maturity) return 0;
        const value = parseFloat(maturity);
        if (maturity.includes('Y')) return value * 12;
        if (maturity.includes('M')) return value;
        return value;
    };

    window.maturityToDays = (maturity) => {
        return window.maturityToMonths(maturity) * 30;
    };

    console.log(' GOB V0 Bootstrap v3: Ready');
})();
