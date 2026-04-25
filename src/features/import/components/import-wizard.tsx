'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Table } from 'lucide-react'
import { parseCSV, validateImportRow } from '../utils'
import { ImportPreviewRow, RawImportRow } from '../types'
import { cn } from '@/lib/utils'
import { formatVND } from '@/lib/utils/format'
import { bulkImportTransactions } from '../actions'

export function ImportWizard() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'UPLOAD' | 'PREVIEW' | 'SAVING' | 'SUCCESS'>('UPLOAD')
  const [rawText, setRawText] = useState('')
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const handleParse = () => {
    const rawRows = parseCSV(rawText)
    const rowsWithStatus = rawRows.map((row, idx) => {
      const errors = validateImportRow(row)
      return {
        ...row,
        id: `row-${idx}`,
        status: errors.length > 0 ? 'INVALID' : 'VALID',
        errors
      } as ImportPreviewRow
    })
    setPreviewRows(rowsWithStatus)
    setStep('PREVIEW')
  }

  const handleImport = async () => {
    setIsSaving(true)
    setStep('SAVING')
    
    try {
      const result = await bulkImportTransactions(previewRows)
      if (result.success) {
        setStep('SUCCESS')
      } else {
        alert(result.error || 'Import failed')
        setStep('PREVIEW')
      }
    } catch (err) {
      alert('An unexpected error occurred')
      setStep('PREVIEW')
    } finally {
      setIsSaving(false)
    }
  }

  const reset = () => {
    setStep('UPLOAD')
    setRawText('')
    setPreviewRows([])
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest h-9">
          <Upload className="h-3 w-3 mr-2" /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl glass-premium border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-black tracking-tight">Transaction Import Wizard</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {step === 'UPLOAD' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <FileText className="h-3 w-3" /> Step 1: Provide CSV Data
              </div>
              <textarea
                className="w-full h-64 bg-slate-900/50 border border-white/5 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                placeholder="date,type,category,symbol,quantity,price,amount,description&#10;2024-01-01,BUY,ASSET,VNM,100,68500,6850000,Initial purchase&#10;2024-01-02,DEPOSIT,CASH,,0,0,10000000,Salary deposit"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500 italic">
                <span>Columns: date, type, category, symbol, quantity, price, amount, description</span>
                <Button 
                  onClick={handleParse} 
                  disabled={!rawText.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest h-9 px-6 rounded-xl"
                >
                  Parse & Preview
                </Button>
              </div>
            </div>
          )}

          {step === 'PREVIEW' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Table className="h-3 w-3" /> Step 2: Preview & Validate ({previewRows.length} rows)
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep('UPLOAD')} className="text-[10px] font-black uppercase tracking-widest h-8">Back</Button>
                  <Button 
                    onClick={handleImport}
                    disabled={previewRows.some(r => r.status === 'INVALID')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest h-8 px-4 rounded-lg"
                  >
                    Confirm Import
                  </Button>
                </div>
              </div>

              <div className="max-h-96 overflow-auto rounded-xl border border-white/5 bg-slate-900/30">
                <table className="w-full text-left text-[10px]">
                  <thead className="sticky top-0 bg-slate-900 border-b border-white/5">
                    <tr>
                      <th className="px-4 py-2 font-black uppercase text-slate-500">Status</th>
                      <th className="px-4 py-2 font-black uppercase text-slate-500">Date</th>
                      <th className="px-4 py-2 font-black uppercase text-slate-500">Type</th>
                      <th className="px-4 py-2 font-black uppercase text-slate-500">Asset</th>
                      <th className="px-4 py-2 text-right font-black uppercase text-slate-500">Qty</th>
                      <th className="px-4 py-2 text-right font-black uppercase text-slate-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {previewRows.map((row) => (
                      <tr key={row.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2">
                          {row.status === 'VALID' ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <div className="flex items-center gap-1 text-rose-500">
                              <AlertCircle className="h-3 w-3" />
                              <span className="text-[8px] font-bold">{row.errors?.[0]}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-400">{row.date}</td>
                        <td className="px-4 py-2">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-black",
                            row.type === 'BUY' ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                          )}>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-bold">{row.symbol || 'CASH'}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{row.quantity || '-'}</td>
                        <td className="px-4 py-2 text-right font-bold tabular-nums text-emerald-400">{formatVND(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(step === 'SAVING' || step === 'SUCCESS') && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              {step === 'SAVING' ? (
                <>
                  <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />
                  <p className="text-sm font-bold text-slate-300">Processing transactions...</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Updating ledgers and recalculating PnL</p>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-lg font-black text-white">Import Successful!</p>
                  <p className="text-xs text-slate-400 text-center max-w-sm">
                    {previewRows.length} transactions have been added to your portfolio. Ledgers and performance charts are being updated.
                  </p>
                  <Button onClick={reset} className="mt-6 bg-white text-slate-950 font-black uppercase tracking-widest h-10 px-8 rounded-xl hover:bg-slate-200">
                    Close Wizard
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
