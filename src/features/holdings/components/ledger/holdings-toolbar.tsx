import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SortOption = "VALUE_DESC" | "VALUE_ASC" | "ROI_DESC" | "ROI_ASC" | "NAME_ASC";

interface HoldingsToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  activeClass: string;
  onActiveClassChange: (val: string) => void;
  sortBy: SortOption;
  onSortByChange: (val: SortOption) => void;
  assetClasses: string[];
}

export function HoldingsToolbar({
  search,
  onSearchChange,
  activeClass,
  onActiveClassChange,
  sortBy,
  onSortByChange,
  assetClasses
}: HoldingsToolbarProps) {
  const visibleClasses = assetClasses.slice(0, 5);
  const overflowClasses = assetClasses.slice(5);

  return (
    <div className="flex flex-col gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5 shadow-xl">
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or symbol..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap flex items-center gap-2">
            <ArrowUpDown className="h-3 w-3" />
            Sort By
          </div>
          <Select 
            value={sortBy} 
            onChange={(e) => onSortByChange(e.target.value as SortOption)}
            className="h-9 min-w-[160px] text-xs font-bold bg-white/5 border-white/10"
          >
            <option value="VALUE_DESC">Largest Value</option>
            <option value="VALUE_ASC">Smallest Value</option>
            <option value="ROI_DESC">Best ROI</option>
            <option value="ROI_ASC">Worst ROI</option>
            <option value="NAME_ASC">Name A-Z</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mr-2">
          <Filter className="h-3 w-3" />
          Class Filter
        </div>
        <div className="flex flex-wrap gap-1.5">
          {visibleClasses.map((cls) => (
            <button
              key={cls}
              onClick={() => onActiveClassChange(cls)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                activeClass === cls 
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
                  : "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
              )}
            >
              {cls.replace('_', ' ')}
            </button>
          ))}
          {overflowClasses.length > 0 && (
            <Select 
              value={overflowClasses.includes(activeClass) ? activeClass : ""}
              onChange={(e) => onActiveClassChange(e.target.value)}
              className={cn(
                "h-8 px-2 py-0 w-auto min-w-[110px] text-[10px] font-black uppercase border-0",
                overflowClasses.includes(activeClass) ? "bg-emerald-500 text-slate-950" : "bg-white/5 text-slate-400"
              )}
            >
              <option value="" disabled>More...</option>
              {overflowClasses.map(cls => (
                <option key={cls} value={cls}>{cls.replace('_', ' ')}</option>
              ))}
            </Select>
          )}
        </div>
      </div>
    </div>
  );
}
