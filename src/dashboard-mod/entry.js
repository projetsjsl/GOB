import React from 'react';
import ReactDOM from 'react-dom';

import { PlusTab } from './PlusTabMod.js';
import { StocksNewsTabMod } from './StocksNewsTabMod.js';
import { EmailBriefingsTab } from './EmailBriefingsTabMod.js';
import { AskEmmaTab } from './AskEmmaTabMod.js';
import { IntelliStocksTab } from './IntelliStocksTabMod.js';
import { MarketsEconomyTab } from './MarketsEconomyTabMod.js';
import { EmailBriefingsTabFull } from './EmailBriefingsTabFull.js';

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
