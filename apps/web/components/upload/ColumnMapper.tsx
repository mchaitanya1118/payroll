"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRight, Info, AlertCircle, Calculator, Table } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
    // If no direct 'doubleOrders' match found, but 'Completed Dropoffs' and 'Completed Pickups' exist
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
        const safeExpression = expression.replace(/[^0-9\+\-\*\/\.\(\)\s]/g, '');
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
    <Card className="border-2 border-slate-200 shadow-xl overflow-hidden">
      <CardHeader className="bg-slate-50 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-black text-slate-900 tracking-tight uppercase">Map Excel Columns</CardTitle>
            <CardDescription>Match your file's columns to the payroll fields.</CardDescription>
          </div>
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Info size={12} />
            Step 2 of 2
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-100">
           {/* Left Side: Mapping Inputs */}
           <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
             {FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5 p-3 rounded-lg border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      {field.label}
                      {field.required && <span className="text-red-500 font-black">*</span>}
                    </Label>
                    {mapping[field.key] ? (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded uppercase">Connected</span>
                    ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Not Mapped</span>
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
                                    className="h-10 text-xs font-mono"
                                />
                                <div className="flex flex-wrap gap-1">
                                    {headers.slice(0, 8).map((h, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => handleSelect(field.key, (mapping[field.key] || "") + `{{${h}}}`)}
                                            className="text-[9px] bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 px-2 py-0.5 rounded border border-slate-200 transition-colors"
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
                            <SelectTrigger className="bg-white border-slate-200">
                              <SelectValue placeholder={`Select column for ${field.label}...`} />
                            </SelectTrigger>
                            <SelectContent>
                               {headers.map((h, i) => (
                                 <SelectItem key={i} value={h}>{h}</SelectItem>
                               ))}
                            </SelectContent>
                          </Select>
                        )}
                    </div>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => toggleFormula(field.key)}
                        className={`shrink-0 ${formulaFields.has(field.key) ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-slate-400'}`}
                        title={formulaFields.has(field.key) ? "Switch to Column Mode" : "Switch to Formula Mode"}
                    >
                        {formulaFields.has(field.key) ? <Table size={16} /> : <Calculator size={16} />}
                    </Button>
                  </div>
                </div>
             ))}
           </div>

           {/* Right Side: Data Preview & Summary */}
           <div className="p-6 bg-slate-50/30 flex flex-col">
              <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-4">Sample Data Review</h4>
              <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-inner">
                 <div className="bg-slate-100 p-2 text-[10px] text-slate-500 font-mono border-b border-slate-200 flex justify-between">
                    <span>Previewing Row 1</span>
                    <span>Valid Headers Found: {Object.keys(mapping).length}</span>
                 </div>
                 <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    {FIELDS.filter(f => mapping[f.key]).map(f => (
                       <div key={f.key} className="flex justify-between items-start gap-4 pb-2 border-b border-slate-50">
                          <div>
                             <p className="text-[9px] uppercase font-bold text-slate-400">{f.label}</p>
                             <p className="text-xs text-slate-500 italic max-w-40 truncate">
                                {formulaFields.has(f.key) ? `formula: ${mapping[f.key]}` : `from "${mapping[f.key]}"`}
                             </p>
                           </div>
                           <p className="text-sm font-black text-slate-800 text-right">
                              {getDisplayValue(f.key)}
                           </p>
                        </div>
                    ))}
                    {Object.keys(mapping).length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 opacity-50">
                            <ArrowRight className="mb-2 rotate-180" />
                            <p className="text-xs">Start mapping columns on the left</p>
                        </div>
                    )}
                 </div>
              </div>

              <div className="mt-8 space-y-3">
                 {!isFormValid && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded flex gap-2 text-amber-700 text-xs shadow-sm">
                       <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                       <p>Please map all <strong>required</strong> fields (Rider ID, Date, Batch, and Single Orders) to continue.</p>
                    </div>
                 )}
                 <div className="flex gap-4">
                    <Button variant="ghost" onClick={onCancel} className="flex-1 border-slate-200">Cancel</Button>
                     <Button 
                       onClick={() => {
                           const submission: Record<string, string> = {};
                           Object.keys(mapping).forEach(k => {
                               submission[k] = formulaFields.has(k) ? `FORMULA:${mapping[k]}` : mapping[k];
                           });
                           onConfirm(submission);
                       }} 
                       disabled={!isFormValid || isProcessing}
                       className="flex-2 bg-slate-900 hover:bg-black text-white px-8 font-black tracking-tight"
                     >
                       {isProcessing ? "IMPORTING..." : "CONFIRM & IMPORT"}
                     </Button>
                 </div>
              </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
