import React from 'react';
import ReactDOM from 'react-dom';

// Shim process for JSX runtime if not present
if (typeof globalThis.process === 'undefined') {
  globalThis.process = { env: {} };
} else if (!globalThis.process.env) {
  globalThis.process.env = {};
}

import { PlusTab } from './tabs/PlusTab.jsx';
import { StocksNewsTab } from './tabs/StocksNewsTab.jsx';
import { EmailBriefingsTab } from './EmailBriefingsTabMod.jsx';
import { AskEmmaTab } from './tabs/AskEmmaTab.jsx';
import { IntelliStocksTab } from './IntelliStocksTabMod.jsx';
import { MarketsEconomyTab } from './tabs/MarketsEconomyTab.jsx';
import { EmailBriefingsTabFull } from './EmailBriefingsTabFull.jsx';
import { InvestingCalendarTab } from './tabs/InvestingCalendarTab.jsx';
import { YieldCurveTab } from './tabs/YieldCurveTab.jsx';

// Expose pilot modules on window (no runtime swap yet)
if (typeof window !== 'undefined') {
    window.PlusTabMod = PlusTab;
    window.StocksNewsTabMod = StocksNewsTab;
    window.EmailBriefingsTabMod = EmailBriefingsTab;
    window.EmailBriefingsTabFull = EmailBriefingsTabFull;
    window.AskEmmaTabMod = AskEmmaTab;
    window.IntelliStocksTabMod = IntelliStocksTab;
    window.MarketsEconomyTabMod = MarketsEconomyTab;
    window.InvestingCalendarTabMod = InvestingCalendarTab;
    window.YieldCurveTabMod = YieldCurveTab;
    if (!window.MarketsEconomyTab) {
        window.MarketsEconomyTab = MarketsEconomyTab;
    }
    if (!window.InvestingCalendarTab) {
        window.InvestingCalendarTab = InvestingCalendarTab;
    }
    if (!window.YieldCurveTab) {
        window.YieldCurveTab = YieldCurveTab;
    }
    window.React = window.React || React;
    window.ReactDOM = window.ReactDOM || ReactDOM;
}
