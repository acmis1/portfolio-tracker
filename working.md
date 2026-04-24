# Aegis Ledger - UI Polish & Symbol Abstraction

## Issue Summary
Internal system identifiers (e.g., `SJC_GOLD`, `TD_177...`) were leaking into the UI, creating "ugly" labels and duplicate-looking entries where the symbol was just a normalized version of the name.

## Root Causes Found
1. **Direct Field Binding**: UI components were rendering `symbol` and `name` separately without checking if they were redundant or synthetic.
2. **Synthetic Generation**: Backend logic generates `_` based symbols for non-ticker assets to ensure database uniqueness, but these are not meant for human consumption.

## Files Changed
- `src/lib/utils/format.ts`: Added `formatAssetDisplay` utility to unify asset label logic.
- `src/features/holdings/components/holdings-ledger.tsx`: Applied label masking to all ledger tables.
- `src/features/holdings/components/asset-header.tsx`: Cleaned up the header title/subtitle hierarchy.
- `src/features/holdings/components/top-holdings.tsx`: Standardized labels in the dashboard leaderboard.
- `src/features/portfolio/components/allocation-chart.tsx`: Cleaned up equity mix labels.

## Product Decisions Made
- **Symbol Masking**: If a symbol matches the underscored version of the name or is a `TD_` identifier, hide the symbol and prioritize the human-readable name.
- **Unified Helper**: Centralized display logic in `formatAssetDisplay` to ensure consistency across the dashboard, holdings, and detail pages.

## Next 3 Follow-up Tasks
1. **Interactive Performance Charts**: Integrate a "Performance over Time" line chart above the ledger on the holdings page.
2. **Batch Transaction Entry**: Create a high-velocity transaction logging modal to support DCA/multiple buys.
3. **Advanced Filtering**: Expand filtering options to include "Status" (Active/Matured) and "Currency" types.
