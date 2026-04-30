"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRight, Info, AlertCircle, Calculator, Table, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ColumnMapperProps {
  headers: string[];
  sample: any;
  onConfirm: (mapping: Record<string, string>) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const FIELDS = [
  { key: 'riderId', label: 'Rider ID', required: true, aliases: ['rider id', 'id', 'riderid', 'pilot id', 'emp id'] },
  { key: 'date', label: 'Entry Date', required: true, aliases: ['date', 'batch week local', 'batch change date', 'service date'] },
  { key: 'batchNumber', label: 'Batch Number', required: true, aliases: ['batch', 'batch number', 'batch #'] },
  { key: 'singleOrders', label: 'Single Orders', required: true, aliases: ['single', 'completed pickups', 'single orders'] },
  { key: 'doubleOrders', label: 'Double Orders', required: false, aliases: ['double', 'double orders'] },
  { key: 'riderName', label: 'Rider Name', required: false, aliases: ['name', 'rider name', 'pilot name'] },
  { key: 'salesCash', label: 'Sales Cash', required: false, aliases: ['sales cash', 'sales_cash'] },
  { key: 'carRent', label: 'Car Rent', required: false, aliases: ['car rent', 'car_rent'] },
  { key: 'akama', label: 'Akama/Iqama', required: false, aliases: ['akama', 'iqama'] },
  { key: 'fine', label: 'Fine/Penalty', required: false, aliases: ['fine', 'penalty'] },
  { key: 'bankDeduction', label: 'Bank Deduction', required: false, aliases: ['bank', 'bank deduction'] },
  { key: 'bonus', label: 'Bonus/Incentive', required: false, aliases: ['bonus', 'incentive', 'bounes'] },
  { key: 'deductions', label: 'Other Deductions', required: false, aliases: ['deduction', 'other deduction'] },
  { key: 'rateSingle', label: 'Payout Rate (Single)', required: false, aliases: ['rates', 'rate', 'single rate', 'unit price'] },
  { key: 'rateDouble', label: 'Payout Rate (Double)', required: false, aliases: ['rates', 'rate', 'double rate', 'unit price double'] },
];

export default function ColumnMapper({ headers, sample, onConfirm, onCancel, isProcessing }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [formulaFields, setFormulaFields] = useState<Set<string>>(new Set());

  // Auto-match headers on mount
  useEffect(() => {
    const initialMapping: Record<string, string> = {};
    const stdHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    FIELDS.forEach(field => {
      const stdAliases = field.aliases.map(a => a.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const foundIndex = stdHeaders.findIndex(h => stdAliases.includes(h));
      if (foundIndex !== -1) {
        initialMapping[field.key] = headers[foundIndex];
      }
    });

    // Special logic for Formula Auto-Detection: Double Orders
    if (!initialMapping['doubleOrders']) {
      const dropoffsHeader = headers.find(h => h.toLowerCase().trim() === 'completed dropoffs');
      const pickupsHeader = headers.find(h => h.toLowerCase().trim() === 'completed pickups');
      
      if (dropoffsHeader && pickupsHeader) {
        initialMapping['doubleOrders'] = `{{${dropoffsHeader}}}-{{${pickupsHeader}}}`;
        setFormulaFields(prev => new Set(prev).add('doubleOrders'));
      }
    }

    setMapping(initialMapping);
  }, [headers]);

  const handleSelect = (fieldKey: string, header: string) => {
    setMapping(prev => ({ ...prev, [fieldKey]: header }));
  };

  const toggleFormula = (fieldKey: string) => {
    setFormulaFields(prev => {
        const next = new Set(prev);
        if (next.has(fieldKey)) {
            next.delete(fieldKey);
            setMapping(prevMap => ({ ...prevMap, [fieldKey]: "" }));
        } else {
            next.add(fieldKey);
            setMapping(prevMap => ({ ...prevMap, [fieldKey]: "" }));
        }
        return next;
    });
  };

  const evaluatePreview = (formula: string) => {
    try {
        let expression = formula;
        const tokenRegex = /\{\{(.*?)\}\}/g;
        expression = expression.replace(tokenRegex, (match, colName) => {
            const val = parseFloat(String(sample[colName.trim()] || 0).replace(/,/g, ''));
            return isNaN(val) ? "0" : val.toString();
        });
        const safeExpression = expression.replace(/[^0-9+\-*/.()\s]/g, '');
        if (!safeExpression.trim()) return 0;
        return new Function(`return ${safeExpression}`)();
    } catch (e) {
        return 0;
    }
  };

  const getDisplayValue = (fieldKey: string) => {
    const val = mapping[fieldKey];
    if (!val) return "---";
    if (formulaFields.has(fieldKey)) {
        return evaluatePreview(val);
    }
    return sample ? String(sample[val] || "---") : "---";
  };

  const isFormValid = FIELDS.filter(f => f.required).every(f => !!mapping[f.key]);

  return (
    <Card className="glass-card border-none shadow-2xl overflow-hidden bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60">
      <CardHeader className="bg-slate-900/5 border-b border-white/40 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-sm">
                <Table size={24} />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none mb-1">Mapping Protocol</CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500 italic">Match source Excel headers to system parameters.</CardDescription>
            </div>
          </div>
          <div className="bg-blue-500 text-white px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20">
            <Info size={14} />
            Schema Validation
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-white/20">
           {/* Left Side: Mapping Inputs */}
           <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
             {FIELDS.map((field) => (
                <div key={field.key} className="space-y-2 p-4 rounded-2xl bg-white/50 border border-transparent hover:border-blue-200 hover:bg-white transition-all group">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {mapping[field.key] ? (
                        <span className="text-[9px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-lg uppercase tracking-widest border border-emerald-100">Linked</span>
                    ) : (
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Awaiting Map</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                        {formulaFields.has(field.key) ? (
                            <div className="space-y-2">
                                <Input 
                                    placeholder="e.g. {{Total}} - {{Single}}"
                                    value={mapping[field.key] || ""}
                                    onChange={(e) => handleSelect(field.key, e.target.value)}
                                    className="h-11 text-xs font-mono rounded-xl border-slate-200 bg-white"
                                />
                                <div className="flex flex-wrap gap-1">
                                    {headers.slice(0, 8).map((h, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => handleSelect(field.key, (mapping[field.key] || "") + `{{${h}}}`)}
                                            className="text-[9px] bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors font-bold uppercase tracking-widest"
                                        >
                                            + {h}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                          <Select 
                            value={mapping[field.key] || ""} 
                            onValueChange={(val) => handleSelect(field.key, val as string)}
                          >
                            <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl font-bold text-xs shadow-sm group-hover:border-blue-400 transition-colors">
                              <SelectValue placeholder={`Assign ${field.label}...`} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                               {headers.map((h, i) => (
                                 <SelectItem key={i} value={h} className="font-bold">{h}</SelectItem>
                               ))}
                            </SelectContent>
                          </Select>
                        )}
                    </div>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => toggleFormula(field.key)}
                        className={cn(
                            "shrink-0 h-11 w-11 rounded-xl transition-all",
                            formulaFields.has(field.key) ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-inner' : 'text-slate-400 border-slate-200 hover:bg-slate-50'
                        )}
                        title={formulaFields.has(field.key) ? "Switch to Column Mode" : "Switch to Formula Mode"}
                    >
                        {formulaFields.has(field.key) ? <Table size={18} /> : <Calculator size={18} />}
                    </Button>
                  </div>
                </div>
             ))}
           </div>

           {/* Right Side: Data Preview & Summary */}
           <div className="p-6 md:p-8 bg-slate-900/5 flex flex-col">
              <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-6">Real-time Data Sync</h4>
              <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 overflow-hidden flex flex-col shadow-2xl shadow-slate-200/50">
                 <div className="bg-slate-900/5 p-4 text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-white/40 flex justify-between">
                    <span>Preview: Protocol V1</span>
                    <span>Mapped Fields: {Object.keys(mapping).length}</span>
                 </div>
                 <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    {FIELDS.filter(f => mapping[f.key]).map(f => (
                       <div key={f.key} className="flex justify-between items-start gap-4 pb-3 border-b border-slate-100 last:border-0">
                          <div className="space-y-0.5">
                             <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">{f.label}</p>
                             <p className="text-[10px] text-slate-500 italic max-w-[150px] truncate font-medium">
                                {formulaFields.has(f.key) ? `formula: ${mapping[f.key]}` : `source: ${mapping[f.key]}`}
                             </p>
                           </div>
                           <p className="text-sm font-black text-slate-900 text-right tabular-nums">
                              {getDisplayValue(f.key)}
                           </p>
                        </div>
                    ))}
                    {Object.keys(mapping).length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 opacity-50 space-y-4">
                            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center animate-pulse">
                                <ArrowRight className="rotate-180 text-slate-300" size={32} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Mapping Input</p>
                        </div>
                    )}
                 </div>
              </div>

               <div className="mt-auto pt-8 space-y-4">
                  {!isFormValid && (
                    <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl flex gap-3 text-amber-700 shadow-sm">
                       <AlertCircle size={18} className="shrink-0" />
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest">Required Fields Missing</p>
                          <p className="text-xs font-medium">Map Rider ID, Date, Batch, and Single Orders to continue.</p>
                       </div>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <Button variant="ghost" onClick={onCancel} className="flex-1 h-12 border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-white rounded-2xl transition-all">Cancel</Button>
                      <Button 
                        onClick={() => {
                            const submission: Record<string, string> = {};
                            Object.keys(mapping).forEach(k => {
                                submission[k] = formulaFields.has(k) ? `FORMULA:${mapping[k]}` : mapping[k];
                            });
                            onConfirm(submission);
                        }} 
                        disabled={!isFormValid || isProcessing}
                        className="flex-[2] bg-slate-900 hover:bg-black text-white h-14 rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-slate-900/20 transition-all active:scale-95"
                      >
                        {isProcessing ? (
                           <>
                             <Loader2 className="animate-spin mr-3" size={20} />
                             Ingesting...
                           </>
                        ) : "Execute Import"}
                      </Button>
                  </div>
               </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
