# Plan: Fix Loading Limits and Data Source Confirmation

## User Feedback

1. **"can you confirm if the loading is getting datas from supabase only ?"**
    * User wants to ensure we are prioritizing Supabase snapshots over expensive/slow FMP calls.
2. **"so stupid to use 50 wtf this is so random"**
    * User observed a limit of "50" somewhere (likely the total count in the global stats header "X/50" or in logs).
    * This is unexpected as they have ~1000 tickers.
    * Goal: Identify and remove this arbitrary limit to ensure all 1000+ tickers load.

## Analysis

- **Data Source**: The verification logic in `App.tsx` uses `loadProfilesBatchFromSupabase`. If data exists, it skips FMP. Detailed code review required to ensure this "batch load" effectively retrieves all needed data and doesn't silently fail or trigger FMP fallbacks unnecessarily.
* **The "50" Limit**:
  * Possible culprit: API call `GET /api/admin/tickers` might have a default limit.
  * Possible culprit: The batch processing loop in `App.tsx` might be stopping early?
  * Possible culprit: `listSnapshots` in logs showed `limit=50`.
  * Possible culprit: Use of `slice` or hardcoded limits in `App.tsx`.

## Proposed Changes

### 1. Remove Arbitrary Limits in `App.tsx`

- Audit `fetchTickers` / `useEffect` in `App.tsx`.
* Ensure we fetch **ALL** tickers from Supabase, not just 50.
* If pagination is needed, ensure we fetch all pages or set a strictly higher limit (e.g., 2000).

### 2. Verify and Optimize Loading Source

- Confirm `loadProfilesBatchFromSupabase` is efficient.
* Ensure logic is: `Supabase (Batch) -> If Found & Valid -> Use IT -> Else -> FMP`.
* Add explicit logging to console to prove to user: "Loaded X from Supabase", "Loaded Y from FMP".

### 3. Loading Visualization

- Ensure the "Chargement... X/Y" counter reflects the TOTAL expected tickers (1010), not a subsection.

## Verification

- Browser test to confirm "Chargement... X/1000+" is displayed.
* Logs confirming Supabase usage.
