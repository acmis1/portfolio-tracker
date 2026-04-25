'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Table, Info, Trash2, ArrowRight } from 'lucide-react'
import { parseCSV } from '../utils'
import { ImportPreviewRow, ImportSummary } from '../types'
import { cn } from '@/lib/utils'
import { formatVND } from '@/lib/utils/format'
import { bulkImportTransactions, validateAndPreviewImport } from '../actions'

export function ImportWizard() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'UPLOAD' | 'PARSING' | 'PREVIEW' | 'SAVING' | 'SUCCESS'>('UPLOAD')
  const [rawText, setRawText] = useState('')
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [importCount, setImportCount] = useState(0)

  const handleParse = async () => {
    setStep('PARSING')
    const rawRows = parseCSV(rawText)
    try {
      const { preview, summary } = await validateAndPreviewImport(rawRows)
      setPreviewRows(preview)
      setSummary(summary)
      setStep('PREVIEW')
    } catch (err) {
      alert('Failed to validate CSV data. Please check the format.')
      setStep('UPLOAD')
    }
  }

  const handleImport = async () => {
    setIsSaving(true)
    setStep('SAVING')
    
    try {
      const result = await bulkImportTransactions(previewRows)
      if (result.success) {
        setImportCount(result.count || 0)
        setStep('SUCCESS')
      } else {
        alert(result.error || 'Import failed')
        setStep('PREVIEW')
      }
    } catch (err) {
      alert('An unexpected error occurred during import')
      setStep('PREVIEW')
    } finally {
      setIsSaving(false)
    }
  }

  const reset = () => {
    setStep('UPLOAD')
    setRawText('')
    setPreviewRows([])
    setSummary(null)
    setIsOpen(false)
  }

  const validRowsToImport = previewRows.filter(r => r.status === 'VALID' || r.status === 'MAPPED').length

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest h-9 px-4 rounded-xl hover:bg-white/10 transition-all">
          <Upload className="h-3 w-3 mr-2" /> Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl glass-premium border-white/10 text-white overflow-hidden flex flex-col h-[80vh]">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Upload className="h-5 w-5 text-emerald-400" />
            </div>
            Transaction Ingestion
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6 py-4">
          {step === 'UPLOAD' && (
            <div className="space-y-6 h-full flex flex-col">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <FileText className="h-3 w-3" /> Step 1: Data Ingestion
                </div>
                <p className="text-xs text-slate-400">Paste your historical transaction data below. Ensure your CSV has headers: <code className="text-emerald-400 font-bold bg-white/5 px-1.5 py-0.5 rounded">date, type, symbol, quantity, price, amount, description</code></p>
              </div>
              
              <div className="flex-1 relative min-h-[300px]">
                <textarea
                  className="absolute inset-0 w-full h-full bg-slate-900/50 border border-white/5 rounded-2xl p-6 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none shadow-inner"
                  placeholder="2024-01-01,BUY,VNM,100,68500,6850000,Initial purchase&#10;2024-01-02,DIVIDEND,VNM,0,0,500000,Cash dividend&#10;2024-01-05,DEPOSIT,,0,0,10000000,Bank transfer"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Quoted commas supported
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Automatic asset matching
                  </div>
                </div>
                <Button 
                  onClick={handleParse} 
                  disabled={!rawText.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase tracking-widest h-10 px-8 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                >
                  Verify Data
                </Button>
              </div>
            </div>
          )}

          {step === 'PARSING' && (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Loader2 className="h-16 w-16 text-emerald-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="h-6 w-6 text-emerald-300" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-white">Auditing Data...</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Checking for duplicates and matching symbols</p>
              </div>
            </div>
          )}

          {step === 'PREVIEW' && summary && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Valid Rows" value={summary.validRows} subValue="Ready to import" color="emerald" />
                <StatCard label="Duplicates" value={summary.duplicateRows} subValue="Will be skipped" color="amber" />
                <StatCard label="Invalid" value={summary.invalidRows} subValue="Need fixing" color="rose" />
                <StatCard label="New Assets" value={summary.newAssets} subValue="To be created" color="blue" />
                <StatCard label="Total Vol" value={formatVND(summary.totalAmount)} subValue="VND Ingestion" color="slate" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Table className="h-3 w-3" /> Data Preview ({previewRows.length} total rows)
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep('UPLOAD')} className="text-[10px] font-black uppercase tracking-widest h-8 px-4 border border-white/5 rounded-lg hover:bg-white/5">Modify Input</Button>
                  <Button 
                    onClick={handleImport}
                    disabled={validRowsToImport === 0}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase tracking-widest h-8 px-6 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    Ingest {validRowsToImport} Rows
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 shadow-2xl">
                <div className="max-h-[400px] overflow-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="sticky top-0 bg-slate-900 z-10">
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 font-black uppercase text-slate-500 text-[9px] tracking-widest">Status</th>
                        <th className="px-4 py-3 font-black uppercase text-slate-500 text-[9px] tracking-widest">Date</th>
                        <th className="px-4 py-3 font-black uppercase text-slate-500 text-[9px] tracking-widest">Type</th>
                        <th className="px-4 py-3 font-black uppercase text-slate-500 text-[9px] tracking-widest">Asset Mapping</th>
                        <th className="px-4 py-3 text-right font-black uppercase text-slate-500 text-[9px] tracking-widest">Quantity</th>
                        <th className="px-4 py-3 text-right font-black uppercase text-slate-500 text-[9px] tracking-widest">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {previewRows.map((row) => (
                        <tr key={row.id} className={cn(
                          "hover:bg-white/5 transition-colors group",
                          row.status === 'DUPLICATE' && "opacity-40 grayscale-[0.5]",
                          row.status === 'INVALID' && "bg-rose-500/5"
                        )}>
                          <td className="px-4 py-3">
                            <StatusBadge status={row.status} errors={row.errors} />
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-mono">{row.date}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-black tracking-tighter",
                              row.type === 'BUY' ? "bg-blue-500/10 text-blue-400" : 
                              row.type === 'SELL' ? "bg-amber-500/10 text-amber-400" :
                              "bg-slate-500/10 text-slate-400"
                            )}>
                              {row.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {row.category === 'ASSET' ? (
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-white">{row.symbol}</span>
                                  {row.isNewAsset ? (
                                    <span className="text-[8px] font-black uppercase bg-blue-500 text-white px-1 rounded shadow-sm">New</span>
                                  ) : (
                                    <span className="text-[8px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-1 rounded border border-emerald-500/20">Matched</span>
                                  )}
                                </div>
                                {!row.isNewAsset && row.matchedAssetName && (
                                  <span className="text-[9px] text-slate-500 font-medium truncate max-w-[120px]">{row.matchedAssetName}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 font-black italic tracking-widest uppercase text-[9px]">Cash Only</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-300">{row.quantity ? row.quantity.toLocaleString() : '-'}</td>
                          <td className="px-4 py-3 text-right font-black tabular-nums text-emerald-400">{formatVND(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {summary.duplicateRows > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-200">Duplicates Detected</p>
                    <p className="text-[10px] text-amber-200/60 leading-relaxed">
                      We found {summary.duplicateRows} transactions that already exist in your records. These will be skipped automatically to prevent double counting your wealth.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {(step === 'SAVING' || step === 'SUCCESS') && (
            <div className="h-full flex flex-col items-center justify-center py-12 space-y-6">
              {step === 'SAVING' ? (
                <>
                  <div className="relative">
                    <Loader2 className="h-20 w-20 text-emerald-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-10 w-10 bg-emerald-500/20 rounded-full animate-ping" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl font-black text-white">Commiting Ingestion...</p>
                    <p className="text-sm text-slate-400">Updating ledgers and performing final AUM recalculations</p>
                    <div className="flex gap-1 justify-center mt-4">
                      {[1,2,3].map(i => <div key={i} className="h-1 w-8 bg-emerald-500/20 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 animate-[loading_1.5s_infinite]" style={{animationDelay: `${i*0.2}s`}} /></div>)}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-24 w-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  </div>
                  <div className="text-center space-y-3">
                    <p className="text-3xl font-black text-white tracking-tight">Ingestion Successful</p>
                    <div className="flex flex-col gap-1">
                      <p className="text-slate-400 text-sm max-w-md mx-auto">
                        Your portfolio has been synchronized with <span className="text-white font-bold">{importCount}</span> new records.
                      </p>
                      <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black">Ledgers Updated • Snapshots Rebuilt • PnL Recalculated</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6 w-full max-w-lg mt-4">
                    <SummaryStat label="Transactions" value={importCount} />
                    <SummaryStat label="Assets Impacted" value={summary?.matchedAssets || 0} />
                    <SummaryStat label="New Symbols" value={summary?.newAssets || 0} />
                  </div>

                  <Button onClick={reset} className="mt-8 bg-white text-slate-950 font-black uppercase tracking-widest h-12 px-10 rounded-2xl hover:bg-slate-200 transition-all shadow-xl active:scale-95">
                    Return to Dashboard
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatCard({ label, value, subValue, color }: { label: string, value: string | number, subValue: string, color: 'emerald' | 'amber' | 'rose' | 'blue' | 'slate' }) {
  const colors = {
    emerald: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/5 border-amber-500/10",
    rose: "text-rose-400 bg-rose-500/5 border-rose-500/10",
    blue: "text-blue-400 bg-blue-500/5 border-blue-500/10",
    slate: "text-slate-400 bg-slate-500/5 border-slate-500/10",
  }
  return (
    <div className={cn("p-4 rounded-2xl border flex flex-col gap-1 shadow-sm", colors[color])}>
      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</span>
      <span className="text-lg font-black tracking-tighter truncate">{value}</span>
      <span className="text-[8px] font-medium opacity-50 truncate">{subValue}</span>
    </div>
  )
}

function SummaryStat({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xl font-black text-white">{value}</span>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
    </div>
  )
}

function StatusBadge({ status, errors }: { status: ImportPreviewRow['status'], errors?: string[] }) {
  if (status === 'VALID') return <div className="h-5 w-5 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20"><CheckCircle2 className="h-3 w-3 text-emerald-400" /></div>
  if (status === 'DUPLICATE') return <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/10 text-amber-400 text-[8px] font-black uppercase">Duplicate</div>
  if (status === 'INVALID') return (
    <div className="flex items-center gap-1 text-rose-500">
      <AlertCircle className="h-3 w-3" />
      <span className="text-[8px] font-bold">{errors?.[0]}</span>
    </div>
  )
  return <div className="h-5 w-5 rounded-lg bg-slate-500/20 flex items-center justify-center"><Loader2 className="h-3 w-3 text-slate-400 animate-spin" /></div>
}

function Search(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
