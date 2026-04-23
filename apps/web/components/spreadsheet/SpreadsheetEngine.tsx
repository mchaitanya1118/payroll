"use client";

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DayData, MonthlyAdjustments, useSalaryCalculation } from '@/hooks/useSalaryCalculation';
import { cn } from '@/lib/utils';
import { Download, Printer, Save, Copy } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency } from '@/lib/format';

interface SpreadsheetProps {
  initialDays?: Record<number, DayData>;
  initialAdjustments?: MonthlyAdjustments;
  month: number;
  year: number;
  onSave?: (days: Record<number, DayData>, adjustments: MonthlyAdjustments, totals: any) => void;
  readOnly?: boolean;
}

const SpreadsheetEngine: React.FC<SpreadsheetProps> = ({
  initialDays = {},
  initialAdjustments = { salesCash: 0, fine: 0, bank: 0, carRent: 0, deduction: 0, bonus: 0 },
  month,
  year,
  onSave,
  readOnly = false
}) => {
  const [days, setDays] = useState<Record<number, DayData>>(initialDays);
  const [adjustments, setAdjustments] = useState<MonthlyAdjustments>(initialAdjustments);
  
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const calculations = useSalaryCalculation(days, adjustments, daysInMonth);

  const handleExportExcel = () => {
    const data = dayNumbers.map(day => ({
      Date: day,
      Batch: days[day]?.batch || '',
      'Single Orders': calculations.cellValues[`C${day}`] || 0,
      'Single Rate': calculations.cellValues[`D${day}`] || 0,
      'Double Orders': calculations.cellValues[`E${day}`] || 0,
      'Double Rate': calculations.cellValues[`F${day}`] || 0,
      Total: calculations.dayTotals[day] || 0
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Salary Slip");
    XLSX.writeFile(wb, `SalarySlip_${month}_${year}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDayChange = (day: number, field: keyof DayData, value: string) => {
    if (readOnly) return;
    setDays(prev => ({
      ...prev,
      [day]: {
        ...(prev[day] || { batch: '', singleOrders: 0, singleRate: 0, doubleOrders: 0, doubleRate: 0 }),
        [field]: value
      }
    }));
  };

  const handleAdjustmentChange = (field: keyof MonthlyAdjustments, value: string) => {
    if (readOnly) return;
    setAdjustments(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full overflow-hidden border-none shadow-xl bg-white/50 backdrop-blur-md">
      <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold font-outfit uppercase tracking-wider">
            Salary Slip - {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
          </CardTitle>
          <div className="flex gap-4 print:hidden">
            <Button variant="outline" size="sm" onClick={handleExportExcel} className="bg-white/10 border-white/20 hover:bg-white/20 text-white font-bold">
              <Download className="mr-2 h-4 w-4" /> EXCEL
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="bg-white/10 border-white/20 hover:bg-white/20 text-white font-bold">
              <Printer className="mr-2 h-4 w-4" /> PRINT
            </Button>
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 px-4 py-1 text-lg">
              Net: {formatCurrency(calculations.net)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead className="w-20 border font-bold text-slate-900">DATE</TableHead>
                <TableHead className="w-32 border font-bold text-slate-900">BATCH</TableHead>
                <TableHead className="w-24 border font-bold text-slate-900">SINGLE (Q)</TableHead>
                <TableHead className="w-24 border font-bold text-slate-900">RATE (S)</TableHead>
                <TableHead className="w-24 border font-bold text-slate-900">DOUBLE (Q)</TableHead>
                <TableHead className="w-24 border font-bold text-slate-900">RATE (D)</TableHead>
                <TableHead className="w-32 border font-bold text-slate-900 bg-emerald-50 text-emerald-700">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dayNumbers.map(day => (
                <TableRow key={day} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="border font-medium text-center bg-slate-50/50">{day}</TableCell>
                  <TableCell className="p-0 border">
                    <input
                      type="text"
                      className="w-full h-full p-2 bg-transparent outline-none focus:bg-yellow-50 text-center"
                      value={days[day]?.batch || ''}
                      onChange={(e) => handleDayChange(day, 'batch', e.target.value)}
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell className="p-0 border">
                    <input
                      type="text"
                      className="w-full h-full p-2 bg-transparent outline-none focus:bg-yellow-50 text-center"
                      value={days[day]?.singleOrders || ''}
                      onChange={(e) => handleDayChange(day, 'singleOrders', e.target.value)}
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell className="p-0 border">
                    <input
                      type="text"
                      className="w-full h-full p-2 bg-transparent outline-none focus:bg-yellow-50 text-center"
                      value={days[day]?.singleRate || ''}
                      onChange={(e) => handleDayChange(day, 'singleRate', e.target.value)}
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell className="p-0 border">
                    <input
                      type="text"
                      className="w-full h-full p-2 bg-transparent outline-none focus:bg-yellow-50 text-center"
                      value={days[day]?.doubleOrders || ''}
                      onChange={(e) => handleDayChange(day, 'doubleOrders', e.target.value)}
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell className="p-0 border">
                    <input
                      type="text"
                      className="w-full h-full p-2 bg-transparent outline-none focus:bg-yellow-50 text-center"
                      value={days[day]?.doubleRate || ''}
                      onChange={(e) => handleDayChange(day, 'doubleRate', e.target.value)}
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell className="p-2 border font-bold text-center bg-emerald-50/30 text-emerald-700">
                    {formatCurrency(calculations.dayTotals[day] || 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Adjustments Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-slate-50 border-t">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 uppercase tracking-tight">Earnings & Bonus</h3>
            <div className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
              <span className="text-sm font-medium text-slate-600">Gross Orders</span>
              <span className="font-bold text-lg">{formatCurrency(calculations.gross)}</span>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Monthly Bonus</label>
              <Input
                type="text"
                className="bg-white"
                value={adjustments.bonus || ''}
                onChange={(e) => handleAdjustmentChange('bonus', e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 uppercase tracking-tight">Deductions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Fine</label>
                <Input type="text" value={adjustments.fine || ''} onChange={(e) => handleAdjustmentChange('fine', e.target.value)} disabled={readOnly} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Deduction</label>
                <Input type="text" value={adjustments.deduction || ''} onChange={(e) => handleAdjustmentChange('deduction', e.target.value)} disabled={readOnly} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Car Rent</label>
                <Input type="text" value={adjustments.carRent || ''} onChange={(e) => handleAdjustmentChange('carRent', e.target.value)} disabled={readOnly} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Sales Cash</label>
                <Input type="text" value={adjustments.salesCash || ''} onChange={(e) => handleAdjustmentChange('salesCash', e.target.value)} disabled={readOnly} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 uppercase tracking-tight">Final Settlement</h3>
            <div className="p-6 bg-slate-900 text-white rounded-xl shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-slate-400">Total Payout</span>
                <span className="text-3xl font-black text-emerald-400">{formatCurrency(calculations.net)}</span>
              </div>
              {!readOnly && (
                <button
                  onClick={() => onSave?.(days, adjustments, calculations)}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all rounded-lg font-bold text-slate-900 cursor-pointer"
                >
                  SAVE SALARY SLIP
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetEngine;
