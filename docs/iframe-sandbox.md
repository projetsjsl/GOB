# Iframe sandbox policy

## Goals
- Avoid the unsafe combination of `allow-scripts` + `allow-same-origin` for third-party content.
- Keep same-origin embeds functional without relying on `contentWindow` access for cross-origin frames.

## Changes
- External iframes (Investing.com, FastGraphs) now use `sandbox="allow-scripts allow-forms ..."` without `allow-same-origin`.
- The Terminal Emma IA iframe drops `allow-same-origin`; the embedded page now resolves `API_BASE` from `document.referrer` to keep API calls working.
- Theme propagation only targets same-origin iframes (or `data-theme-sync="true"`) to avoid cross-origin `contentWindow` errors.

## Rationale
Removing `allow-same-origin` reduces the risk of sandbox escape warnings while preserving functionality through explicit API base resolution and postMessage usage.
