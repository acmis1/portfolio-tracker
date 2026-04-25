"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Loader2, 
  ArrowRight, 
  LogOut, 
  Wallet, 
  TrendingUp, 
  Building2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Banknote
} from "lucide-react"
import { NumericFormat } from 'react-number-format'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatVND } from "@/lib/utils/format"
import { resolveTermDepositMaturity } from "../../actions"
import { ASSET_CLASSES } from "@/lib/validations"
import { formatAssetClass } from "@/lib/formatters"

const wizardSchema = z.object({
  actionDate: z.string().min(1, "Resolution date is required"),
  resolutionType: z.enum([
    'EXIT_PORTFOLIO',
    'MOVE_TO_TRACKED_CASH',
    'REINVEST_TERM_DEPOSIT',
    'INVEST_TRACKED_ASSET'
  ]),
  resolutionNote: z.string().optional().nullable(),
  
  // Reinvest Path
  bankName: z.string().optional(),
  principal: z.number().optional(),
  interestRate: z.number().optional(),
  maturityDate: z.string().optional(),

  // Invest Path
  symbol: z.string().optional(),
  name: z.string().optional(),
  assetClass: z.string().optional(),
  quantity: z.number().optional(),
  price: z.number().optional(),
  currency: z.string(),
})

type WizardFormValues = z.infer<typeof wizardSchema>

interface ResolveMaturityWizardProps {
  td: {
    id: string;
    symbol: string;
    name: string;
    principal: number;
    interestRate: number;
    startDate: Date;
    maturityDate: Date;
    accruedInterest: number;
    marketValue: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResolveMaturityWizard({ td, open, onOpenChange }: ResolveMaturityWizardProps) {
  const [step, setStep] = React.useState<"CHOICE" | "DETAILS" | "CONFIRM">("CHOICE")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      actionDate: new Date().toISOString().split('T')[0],
      resolutionType: 'EXIT_PORTFOLIO',
      resolutionNote: "",
      bankName: td.name,
      principal: td.marketValue,
      interestRate: td.interestRate,
      assetClass: "EQUITY",
      currency: "VND",
      quantity: 1,
    }
  })

  const resolutionType = form.watch("resolutionType")
  const actionDate = form.watch("actionDate")

  // Reset error when step changes
  React.useEffect(() => {
    setError(null)
  }, [step])

  const handleNext = async () => {
    if (step === "CHOICE") {
      setStep("DETAILS")
    } else if (step === "DETAILS") {
      // Validate current step fields
      const isValid = await form.trigger()
      if (isValid) {
        // Additional business logic validation
        const dateObj = new Date(actionDate)
        const maturityDateObj = new Date(td.maturityDate)
        maturityDateObj.setHours(0, 0, 0, 0)
        
        if (dateObj < maturityDateObj) {
          setError(`Resolution date cannot be before maturity date (${new Date(td.maturityDate).toLocaleDateString('vi-VN')})`)
          return
        }

        if (resolutionType === 'REINVEST_TERM_DEPOSIT') {
          const newMaturityDate = form.getValues("maturityDate")
          if (!newMaturityDate) {
            setError("Maturity date is required for reinvestment")
            return
          }
          if (new Date(newMaturityDate) <= dateObj) {
            setError("New maturity date must be after resolution date")
            return
          }
        }

        setStep("CONFIRM")
      }
    }
  }

  const handleBack = () => {
    if (step === "DETAILS") setStep("CHOICE")
    if (step === "CONFIRM") setStep("DETAILS")
  }

  async function onSubmit(data: WizardFormValues) {
    setIsSubmitting(true)
    setError(null)
    try {
      const payload = {
        termDepositId: td.id,
        actionDate: data.actionDate,
        resolutionType: data.resolutionType,
        resolutionNote: data.resolutionNote,
        newAsset: data.resolutionType === 'REINVEST_TERM_DEPOSIT' ? {
          name: data.bankName || td.name,
          assetClass: 'TERM_DEPOSIT',
          price: data.principal || td.marketValue,
          quantity: 1,
          currency: 'VND',
          interestRate: data.interestRate,
          maturityDate: data.maturityDate,
        } : data.resolutionType === 'INVEST_TRACKED_ASSET' ? {
          symbol: data.symbol,
          name: data.name || "",
          assetClass: data.assetClass || "EQUITY",
          price: data.price || 0,
          quantity: data.quantity || 1,
          currency: data.currency || 'VND',
        } : null
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await resolveTermDepositMaturity(payload as any)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onOpenChange(false)
          // Small delay to ensure state resets
          setTimeout(() => {
            setStep("CHOICE")
            setSuccess(false)
            form.reset()
          }, 300)
        }, 1500)
      } else {
        setError(result.error || "Failed to resolve maturity")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const choices = [
    {
      id: 'EXIT_PORTFOLIO',
      icon: <LogOut className="h-5 w-5 text-rose-400" />,
      label: "Exit Portfolio",
      desc: "Move outside / spent / untracked",
      info: "Use this if the proceeds were spent or moved to an untracked bank account."
    },
    {
      id: 'MOVE_TO_TRACKED_CASH',
      icon: <Wallet className="h-5 w-5 text-blue-400" />,
      label: "Tracked Cash",
      desc: "Move to tracked portfolio cash",
      info: "Use this only if you want the proceeds to remain inside Aegis Ledger as tracked cash."
    },
    {
      id: 'REINVEST_TERM_DEPOSIT',
      icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
      label: "Reinvest",
      desc: "New term deposit account",
      info: "Roll over the proceeds into a new term deposit account."
    },
    {
      id: 'INVEST_TRACKED_ASSET',
      icon: <Building2 className="h-5 w-5 text-amber-400" />,
      label: "Invest Asset",
      desc: "Buy another tracked asset",
      info: "Use proceeds to buy Gold, Stocks, or other tracked assets."
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl glass-premium border-white/10 text-white p-0 overflow-hidden">
        {/* Header Summary */}
        <div className="p-6 pb-4 border-b border-white/5 bg-white/5">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Resolve Maturity</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium text-xs mt-1">
                  {td.name} • {new Date(td.maturityDate).toLocaleDateString('vi-VN')}
                </DialogDescription>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Proceeds</div>
                <div className="text-lg font-black text-emerald-400 tabular-nums">{formatVND(td.marketValue)}</div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {success ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black uppercase">Resolution Recorded</h3>
              <p className="text-slate-400 text-sm font-medium mt-1">Your ledger has been updated successfully.</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Step Content */}
            <div className="min-h-[320px]">
              {step === "CHOICE" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Choose Resolution Path</div>
                  <div className="grid grid-cols-2 gap-3">
                    {choices.map((choice) => (
                      <button
                        key={choice.id}
                        onClick={() => {
                          form.setValue("resolutionType", choice.id as WizardFormValues["resolutionType"])
                          handleNext()
                        }}
                        className={cn(
                          "flex flex-col items-start p-4 rounded-2xl border transition-all text-left group relative overflow-hidden",
                          resolutionType === choice.id 
                            ? "bg-white/10 border-white/20 ring-1 ring-white/20" 
                            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                        )}
                      >
                        <div className="mb-3">{choice.icon}</div>
                        <div className="font-black text-sm uppercase tracking-tight">{choice.label}</div>
                        <div className="text-[10px] text-slate-500 font-bold leading-tight mt-1">{choice.desc}</div>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="pt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                    <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                      {choices.find(c => c.id === resolutionType)?.info}
                    </p>
                  </div>
                </div>
              )}

              {step === "DETAILS" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
                      {choices.find(c => c.id === resolutionType)?.icon}
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Step 2: Path Details</div>
                      <div className="text-sm font-black uppercase text-white">{choices.find(c => c.id === resolutionType)?.label}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="actionDate" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resolution Date</Label>
                      <Input 
                        id="actionDate" 
                        type="date" 
                        className="bg-white/5 border-white/10 h-10"
                        {...form.register("actionDate")} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resolutionNote" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes (Optional)</Label>
                      <Input 
                        id="resolutionNote" 
                        placeholder="Reference or reason..."
                        className="bg-white/5 border-white/10 h-10"
                        {...form.register("resolutionNote")} 
                      />
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 mt-4">
                    {resolutionType === 'REINVEST_TERM_DEPOSIT' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 col-span-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institution Name</Label>
                            <Input {...form.register("bankName")} className="bg-white/5 border-white/10 h-10" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Principal Amount</Label>
                            <Controller
                              name="principal"
                              control={form.control}
                              render={({ field }) => (
                                <NumericFormat
                                  className="bg-white/5 border-white/10 h-10 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  thousandSeparator="."
                                  decimalSeparator=","
                                  value={field.value}
                                  onValueChange={(v) => field.onChange(v.floatValue)}
                                />
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interest Rate (%)</Label>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...form.register("interestRate", { valueAsNumber: true })} 
                              className="bg-white/5 border-white/10 h-10" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Maturity Date</Label>
                            <Input type="date" {...form.register("maturityDate")} className="bg-white/5 border-white/10 h-10" />
                          </div>
                        </div>
                      </div>
                    )}

                    {resolutionType === 'INVEST_TRACKED_ASSET' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Class</Label>
                            <Select {...form.register("assetClass")} className="bg-white/5 border-white/10 h-10">
                              {ASSET_CLASSES.map(ac => (
                                <option key={ac} value={ac}>{formatAssetClass(ac)}</option>
                              ))}
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Symbol (Optional)</Label>
                            <Input {...form.register("symbol")} className="bg-white/5 border-white/10 h-10" placeholder="SJC_GOLD, BTC..." />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Name</Label>
                            <Input {...form.register("name")} className="bg-white/5 border-white/10 h-10" placeholder="e.g. SJC Gold Bar" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quantity</Label>
                            <Input type="number" step="any" {...form.register("quantity", { valueAsNumber: true })} className="bg-white/5 border-white/10 h-10" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Purchase Price</Label>
                            <Controller
                              name="price"
                              control={form.control}
                              render={({ field }) => (
                                <NumericFormat
                                  className="bg-white/5 border-white/10 h-10 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  thousandSeparator="."
                                  decimalSeparator=","
                                  value={field.value}
                                  onValueChange={(v) => field.onChange(v.floatValue)}
                                />
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {(resolutionType === 'EXIT_PORTFOLIO' || resolutionType === 'MOVE_TO_TRACKED_CASH') && (
                      <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 bg-white/5 rounded-2xl border border-white/5">
                        <Banknote className="h-10 w-10 text-slate-500 opacity-50" />
                        <div>
                          <p className="text-sm font-bold text-white">No additional details needed</p>
                          <p className="text-[11px] text-slate-500 font-medium">Proceed to confirmation to resolve the term deposit.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === "CONFIRM" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Step 3: Final Confirmation</div>
                  
                  <div className="glass-premium border-white/5 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start border-b border-white/5 pb-4">
                      <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</div>
                        <div className="text-sm font-black uppercase text-white mt-0.5">{choices.find(c => c.id === resolutionType)?.label}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</div>
                        <div className="text-sm font-black text-white mt-0.5">{new Date(actionDate).toLocaleDateString('vi-VN')}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-tight">Source Asset</span>
                        <span className="text-white font-black">{td.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-tight">Realized Proceeds</span>
                        <span className="text-emerald-400 font-black tabular-nums">{formatVND(td.marketValue)}</span>
                      </div>
                      
                      {resolutionType === 'REINVEST_TERM_DEPOSIT' && (
                        <div className="pt-2 border-t border-white/5 space-y-2">
                           <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-tight">New Principal</span>
                            <span className="text-white font-black tabular-nums">{formatVND(form.getValues("principal") || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-tight">Maturity Date</span>
                            <span className="text-white font-black">{new Date(form.getValues("maturityDate") || "").toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      )}

                      {resolutionType === 'INVEST_TRACKED_ASSET' && (
                        <div className="pt-2 border-t border-white/5 space-y-2">
                           <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-tight">New Asset</span>
                            <span className="text-white font-black">{form.getValues("name")}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-tight">Invested Amount</span>
                            <span className="text-white font-black tabular-nums">{formatVND((form.getValues("quantity") || 0) * (form.getValues("price") || 0))}</span>
                          </div>
                        </div>
                      )}

                      {resolutionType === 'MOVE_TO_TRACKED_CASH' && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-300 font-medium italic">
                          Matured proceeds will be added to your tracked portfolio cash balance.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                      This action will create a SELL transaction for the original term deposit to realize performance history. This cannot be easily undone.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <p className="text-xs text-rose-400 font-bold uppercase tracking-tight">{error}</p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/5 pt-6">
              {step !== "CHOICE" ? (
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="border-white/10 text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Back
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="border-white/10 text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
              )}
              
              {step !== "CONFIRM" ? (
                <Button 
                  variant="premium" 
                  onClick={handleNext}
                  disabled={step === "CHOICE"}
                >
                  Continue <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  variant="premium" 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className={cn(isSubmitting && "opacity-80")}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Resolving...
                    </>
                  ) : (
                    <>
                      Resolve Maturity <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
