import React from 'react';
import ReactDOM from 'react-dom';

import { PlusTab } from './PlusTabMod.jsx';
import { StocksNewsTabMod } from './StocksNewsTabMod.jsx';
import { EmailBriefingsTab } from './EmailBriefingsTabMod.jsx';
import { AskEmmaTab } from './AskEmmaTabMod.jsx';
import { IntelliStocksTab } from './IntelliStocksTabMod.jsx';
import { MarketsEconomyTab } from './MarketsEconomyTabMod.jsx';
import { EmailBriefingsTabFull } from './EmailBriefingsTabFull.jsx';

// Expose pilot modules on window (no runtime swap yet)
if (typeof window !== 'undefined') {
    window.PlusTabMod = PlusTab;
    window.StocksNewsTabMod = StocksNewsTabMod;
    window.EmailBriefingsTabMod = EmailBriefingsTab;
    window.EmailBriefingsTabFull = EmailBriefingsTabFull;
    window.AskEmmaTabMod = AskEmmaTab;
    window.IntelliStocksTabMod = IntelliStocksTab;
    window.MarketsEconomyTabMod = MarketsEconomyTab;
    window.React = window.React || React;
    window.ReactDOM = window.ReactDOM || ReactDOM;
}
