interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="glass-premium rounded-2xl p-20 text-center border border-white/5">
      <h3 className="text-lg font-bold text-white mb-2">No positions found</h3>
      <p className="text-slate-500 text-sm mb-6">Try adjusting your filters or search terms.</p>
      <button 
        onClick={onReset}
        className="text-xs font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        Reset all filters
      </button>
    </div>
  );
}
