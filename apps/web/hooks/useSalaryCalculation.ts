import { useMemo, useEffect, useState } from 'react';
import { HyperFormula } from 'hyperformula';

export interface DayData {
  batch: string;
  singleOrders: string | number;
  singleRate: string | number;
  doubleOrders: string | number;
  doubleRate: string | number;
  total?: string | number;
}

export interface MonthlyAdjustments {
  salesCash: string | number;
  fine: string | number;
  bank: string | number;
  carRent: string | number;
  deduction: string | number;
  bonus: string | number;
}

// Map columns to standard spreadsheet layout
// A: Day, B: Batch, C: Single Q, D: Single Rate, E: Double Q, F: Double Rate, G: Total
export const useSalaryCalculation = (days: Record<number, DayData>, adjustments: MonthlyAdjustments, daysInMonth: number) => {
  const hf = useMemo(() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
    engine.addSheet('Sheet1');
    return engine;
  }, []);

  const [calculations, setCalculations] = useState<{
    dayTotals: Record<number, number>;
    totalSingle: number;
    totalDouble: number;
    gross: number;
    net: number;
    cellValues: Record<string, any>;
  }>(() => ({ dayTotals: {}, totalSingle: 0, totalDouble: 0, gross: 0, net: 0, cellValues: {} }));

  useEffect(() => {
    // Sync data to HyperFormula
    const data = [];
    
    // Add Days (Rows 1 to daysInMonth)
    for (let i = 1; i <= daysInMonth; i++) {
        const d = days[i] || {};
        const defaultTotalFormula = `= (C${i} * D${i}) + (E${i} * F${i})`;
        data.push([
            i, // A
            d.batch || '', // B
            d.singleOrders ?? 0, // C
            d.singleRate ?? 0, // D
            d.doubleOrders ?? 0, // E
            d.doubleRate ?? 0, // F
            d.total ?? defaultTotalFormula // G
        ]);
    }
    
    // Next row (daysInMonth + 1): Summary
    const summaryRow = daysInMonth + 1;
    data.push([
        "TOTAL", // A
        "", // B
        `=SUM(C1:C${daysInMonth})`, // C (Total Single Q)
        "", // D
        `=SUM(E1:E${daysInMonth})`, // E (Total Double Q)
        "", // F
        `=SUM(G1:G${daysInMonth})` // G (Gross Total)
    ]);

    // Next rows for Adjustments
    const adjRow = daysInMonth + 2;
    data.push(["Bonus", adjustments.bonus ?? 0]);
    data.push(["Fine", adjustments.fine ?? 0]);
    data.push(["Car Rent", adjustments.carRent ?? 0]);
    data.push(["Deduction", adjustments.deduction ?? 0]);
    data.push(["Sales Cash", adjustments.salesCash ?? 0]);

    // Net Total Row
    const netRow = adjRow + 5;
    data.push(["Net", `=G${summaryRow} + B${adjRow} - SUM(B${adjRow+1}:B${adjRow+4})`]);
    
    hf.setSheetContent(0, data);
    
    const dayTotals: Record<number, number> = {};
    const cellValues: Record<string, any> = {};

    for (let i = 1; i <= daysInMonth; i++) {
        dayTotals[i] = hf.getCellValue({ sheet: 0, col: 6, row: i - 1 }) as number;
        
        // Grab values for evaluating string vs computed
        cellValues[`C${i}`] = hf.getCellValue({ sheet: 0, col: 2, row: i - 1 });
        cellValues[`D${i}`] = hf.getCellValue({ sheet: 0, col: 3, row: i - 1 });
        cellValues[`E${i}`] = hf.getCellValue({ sheet: 0, col: 4, row: i - 1 });
        cellValues[`F${i}`] = hf.getCellValue({ sheet: 0, col: 5, row: i - 1 });
        cellValues[`G${i}`] = dayTotals[i];
    }
    
    setCalculations({
        dayTotals,
        cellValues,
        totalSingle: hf.getCellValue({ sheet: 0, col: 2, row: summaryRow - 1 }) as number,
        totalDouble: hf.getCellValue({ sheet: 0, col: 4, row: summaryRow - 1 }) as number,
        gross: hf.getCellValue({ sheet: 0, col: 6, row: summaryRow - 1 }) as number,
        net: hf.getCellValue({ sheet: 0, col: 1, row: netRow - 1 }) as number,
    });

  }, [days, adjustments, daysInMonth, hf]);

  return calculations;
};

