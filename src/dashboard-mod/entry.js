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
import { MarketsEconomyTab } from './MarketsEconomyTabMod.jsx';
import { EmailBriefingsTabFull } from './EmailBriefingsTabFull.jsx';

// Expose pilot modules on window (no runtime swap yet)
if (typeof window !== 'undefined') {
    window.PlusTabMod = PlusTab;
    window.StocksNewsTabMod = StocksNewsTab;
    window.EmailBriefingsTabMod = EmailBriefingsTab;
    window.EmailBriefingsTabFull = EmailBriefingsTabFull;
    window.AskEmmaTabMod = AskEmmaTab;
    window.IntelliStocksTabMod = IntelliStocksTab;
    window.MarketsEconomyTabMod = MarketsEconomyTab;
    window.React = window.React || React;
    window.ReactDOM = window.ReactDOM || ReactDOM;
}
