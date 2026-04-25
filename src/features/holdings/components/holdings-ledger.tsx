"use client"

import { useState, useMemo } from "react";
import { type PortfolioSummary } from "@/features/portfolio/utils";
import { SummaryHeader } from "./ledger/summary-header";
import { HoldingsToolbar, type SortOption } from "./ledger/holdings-toolbar";
import { LiquidTable } from "./ledger/liquid-table";
import { TermDepositTable } from "./ledger/term-deposit-table";
import { RealEstateTable } from "./ledger/real-estate-table";
import { EmptyState } from "./ledger/empty-state";

interface HoldingsLedgerProps {
  summary: PortfolioSummary;
  fxRate: number;
}

const ITEMS_PER_PAGE = 25;

export function HoldingsLedger({ summary, fxRate }: HoldingsLedgerProps) {
  const { holdings, portfolioValue, totalRealizedPnL, assetCount } = summary;
  
  const [search, setSearch] = useState("");
  const [activeClass, setActiveClass] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("VALUE_DESC");
  const [currentPage, setCurrentPage] = useState(1);

  const assetClasses = useMemo(() => {
    const classes = new Set(holdings.map(h => h.assetClass));
    return ["ALL", ...Array.from(classes)].filter(c => c !== 'CASH');
  }, [holdings]);

  const filteredAndSortedHoldings = useMemo(() => {
    let result = holdings.filter(h => {
      const matchesSearch = 
        h.name.toLowerCase().includes(search.toLowerCase()) || 
        h.symbol.toLowerCase().includes(search.toLowerCase());
      
      const matchesClass = activeClass === "ALL" || h.assetClass === activeClass;
      const notCash = h.assetClass !== 'CASH';
      
      return matchesSearch && matchesClass && notCash;
    });

    return result.sort((a, b) => {
      const aVal = a as any;
      const bVal = b as any;
      switch (sortBy) {
        case "VALUE_DESC": return b.marketValue - a.marketValue;
        case "VALUE_ASC": return a.marketValue - b.marketValue;
        case "ROI_DESC": return (bVal.unrealizedPnLPctg ?? -Infinity) - (aVal.unrealizedPnLPctg ?? -Infinity);
        case "ROI_ASC": return (aVal.unrealizedPnLPctg ?? Infinity) - (bVal.unrealizedPnLPctg ?? Infinity);
        case "NAME_ASC": return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
  }, [holdings, search, activeClass, sortBy]);

  const liquidAssets = filteredAndSortedHoldings.filter(h => h.type === 'LIQUID' || h.type === 'GOLD');
  const termDeposits = filteredAndSortedHoldings.filter(h => h.type === 'TERM_DEPOSIT');
  const realEstate = filteredAndSortedHoldings.filter(h => h.type === 'REAL_ESTATE');

  const paginatedLiquid = useMemo(() => {
    if (liquidAssets.length <= ITEMS_PER_PAGE) return liquidAssets;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return liquidAssets.slice(start, start + ITEMS_PER_PAGE);
  }, [liquidAssets, currentPage]);

  const totalPages = Math.ceil(liquidAssets.length / ITEMS_PER_PAGE);

  const top3Concentration = useMemo(() => {
    const top3 = [...holdings]
      .filter(h => h.assetClass !== 'CASH')
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 3);
    const top3Sum = top3.reduce((sum, h) => sum + h.marketValue, 0);
    return portfolioValue > 0 ? (top3Sum / portfolioValue) * 100 : 0;
  }, [holdings, portfolioValue]);

  const hasAnyResults = filteredAndSortedHoldings.length > 0;

  return (
    <div className="space-y-8">
      <SummaryHeader 
        portfolioValue={portfolioValue}
        totalRealizedPnL={totalRealizedPnL}
        assetCount={assetCount}
        top3Concentration={top3Concentration}
      />

      <HoldingsToolbar 
        search={search}
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
        activeClass={activeClass}
        onActiveClassChange={(val) => { setActiveClass(val); setCurrentPage(1); }}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        assetClasses={assetClasses}
      />

      {!hasAnyResults ? (
        <EmptyState onReset={() => { setSearch(""); setActiveClass("ALL"); }} />
      ) : (
        <div className="space-y-16">
          {liquidAssets.length > 0 && (
            <LiquidTable 
              assets={liquidAssets}
              paginatedAssets={paginatedLiquid}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

          {termDeposits.length > 0 && (
            <TermDepositTable assets={termDeposits} />
          )}

          {realEstate.length > 0 && (
            <RealEstateTable assets={realEstate} />
          )}
        </div>
      )}
    </div>
  );
}
