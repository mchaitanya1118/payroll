import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Download, Save, Printer, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate, toTitleCase } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';

export default function RiderPayslipView({ riderId, month, year, onBack }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
      contentRef,
  });

  // Financial Adjustment States
  const [salesCash, setSalesCash] = useState(0);
  const [carRent, setCarRent] = useState(0);
  const [akama, setAkama] = useState(0);
  const [fine, setFine] = useState(0);
  const [bankDeduction, setBankDeduction] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [status, setStatus] = useState('DRAFT');

  useEffect(() => {
    fetchPayslip();
  }, [riderId, month, year]);

  const fetchPayslip = async () => {
    try {
      const res = await api.get(`/payslips/${riderId}/${month}/${year}`);
      setData(res.data);
      
      const p = res.data.payslip;
      setSalesCash(p.salesCash || 0);
      setCarRent(p.carRent || 0);
      setAkama(p.akama || 0);
      setFine(p.fine || 0);
      setBankDeduction(p.bankDeduction || 0);
      setDeductions(p.deductions || 0);
      setBonus(p.bonus || 0);
      setStatus(p.status || 'DRAFT');
    } catch (error) {
      toast.error('Failed to load payslip data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.patch(`/payslips/${data.payslip.id}`, {
        salesCash,
        carRent,
        akama,
        fine,
        bankDeduction,
        deductions,
        bonus,
        status
      });
      toast.success('Salary Slip adjustments saved successfully');
      fetchPayslip(); 
    } catch (error) {
      toast.error('Failed to save adjustments');
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-900" />
    </div>
  );
  
  if (!data) return <div>Error loading data.</div>;

  // Grouping Logic for the Excel-like Weekly Grid
  const getWeekKey = (dateStr: string) => {
    // Parse as UTC date to match backend
    const d = new Date(dateStr);
    const day = d.getUTCDay();
    const date = d.getUTCDate();
    const diff = date - day + (day === 0 ? -6 : 1); // Monday
    
    const monday = new Date(d.setUTCDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const groupedMap = new Map();
  if (data.entries && data.entries.length > 0) {
    data.entries.forEach((e: any) => {
      const weekKey = getWeekKey(e.date);
      const batchKey = `${weekKey}-${e.batch.batchNumber}`;
      
      if (!groupedMap.has(batchKey)) {
          groupedMap.set(batchKey, {
              date: weekKey,
              batch: e.batch.batchNumber,
              singleOrders: 0,
              doubleOrders: 0,
              rateSingle: e.autoRateSingle,
              rateDouble: e.autoRateDouble,
              amount: 0
          });
      }
      
      const week = groupedMap.get(batchKey);
      week.singleOrders += e.singleOrders;
      week.doubleOrders += e.doubleOrders;
      week.amount += e.dailyAmount;
    });
  }

  const weeklyColumns = Array.from(groupedMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const gross = data.payslip.grossAmount;
  const net = gross + bonus - (salesCash + carRent + akama + fine + bankDeduction + deductions);
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1)).toUpperCase();

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-20 font-sans">
      <div className="flex items-center justify-between px-4">
        <Button onClick={onBack} variant="ghost" className="text-slate-500 hover:text-slate-900 font-bold tracking-widest text-[10px]">
          <ArrowLeft size={16} className="mr-2" /> DISMISS
        </Button>
        <div className="flex gap-4 items-center">
            <button 
              onClick={() => setStatus(status === 'DRAFT' ? 'FINAL' : 'DRAFT')}
              className={cn(
                "h-11 px-6 rounded-xl font-black text-[10px] tracking-widest transition-all active:scale-95 border-2",
                status === 'FINAL' 
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" 
                  : "bg-slate-100 text-slate-500 border-slate-200"
              )}
            >
              STATUS: {status}
            </button>
            <Button onClick={() => handlePrint()} variant="outline" className="h-11 px-6 rounded-xl border-2 border-slate-200 hover:border-slate-900 font-black text-[10px] tracking-widest transition-all">
                <Printer size={16} className="mr-3" /> PRINT SLIP
            </Button>
            <Button onClick={handleSave} className="h-11 px-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-black text-[10px] tracking-widest shadow-xl transition-all active:scale-95">
                <Save size={16} className="mr-3" /> SAVE CHANGES
            </Button>
        </div>
      </div>

      <div ref={contentRef} className="bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] ring-1 ring-slate-200 rounded-lg overflow-hidden print:shadow-none print:ring-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: landscape; margin: 5mm; }
            body { background: white; -webkit-print-color-adjust: exact; }
            .excel-grid { border-collapse: collapse !important; width: 100% !important; }
            .excel-grid td { border: 1px solid #cbd5e1 !important; }
          }
        `}} />
        
        {/* Banner Section */}
        <div className="bg-[#fce5cd] py-6 text-center border-b border-slate-300">
           <h1 className="text-4xl font-black text-slate-900 tracking-[0.15em] uppercase">
             {year} {monthName} SALARY SLIP # {data.payslip.rider.riderId.split('-')[0]}
           </h1>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-12 text-[12px] font-black uppercase tracking-widest border-b border-slate-300">
           <div className="col-span-1 bg-[#fce5cd] p-4 border-r border-slate-300 text-center flex items-center justify-center">ID</div>
           <div className="col-span-2 p-4 border-r border-slate-300 text-center font-mono text-base bg-white flex items-center justify-center">{data.payslip.rider.riderId}</div>
           <div className="col-span-1 bg-[#fce5cd] p-4 border-r border-slate-300 text-center flex items-center justify-center">NAME</div>
           <div className="col-span-8 p-4 font-bold text-lg bg-[#d9e2f3] truncate flex items-center px-10">
             {data.payslip.rider.riderName.toUpperCase()}
           </div>
        </div>

        {/* Weekly Worksheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px] uppercase font-black excel-grid">
            <tbody>
              {/* DATE ROW */}
              <tr className="border-b border-slate-300 h-14">
                <td className="w-[180px] min-w-[180px] p-4 bg-[#fce5cd] border-r border-slate-300 text-center font-black tracking-widest sticky left-0 z-10">
                    BATCH CHANGE DATE
                </td>
                {weeklyColumns.map((w, idx) => (
                  <td key={idx} className="min-w-[100px] p-2 border-r border-slate-300 text-center bg-white font-mono text-sm">
                    {w.date}
                  </td>
                ))}
              </tr>
              
              {/* BATCH ROW */}
              <tr className="border-b border-slate-300 h-14">
                <td className="w-[180px] min-w-[180px] p-4 bg-[#fce5cd] border-r border-slate-300 text-center font-black tracking-widest sticky left-0 z-10">
                    BATCH
                </td>
                {weeklyColumns.map((w, idx) => (
                  <td key={idx} className="min-w-[100px] p-2 border-r border-slate-300 text-center bg-white text-red-600 font-extrabold text-lg">
                    {w.batch}
                  </td>
                ))}
              </tr>

              {/* SINGLE ORDERS ROW */}
              <tr className="border-b border-slate-300 h-14 bg-[#d9e2f3]/40">
                <td className="w-[180px] min-w-[180px] p-4 bg-[#fce5cd] border-r border-slate-300 sticky left-0 z-10 flex justify-between items-center h-14">
                   <span className="tracking-widest">SINGLE ORDERS</span>
                   <span className="bg-white px-2 py-0.5 rounded border border-slate-300 tabular-nums">
                     {weeklyColumns.reduce((sum, w) => sum + w.singleOrders, 0)}
                   </span>
                </td>
                {weeklyColumns.map((w, idx) => (
                  <td key={idx} className="min-w-[100px] p-2 border-r border-slate-300 text-center text-slate-800 font-black text-sm tabular-nums">
                    {w.singleOrders}
                  </td>
                ))}
              </tr>

              {/* RATES ROW (SINGLE) */}
              <tr className="border-b border-slate-300 h-14">
                <td className="w-[180px] min-w-[180px] p-4 bg-[#fce5cd] border-r border-slate-300 text-center font-black tracking-widest sticky left-0 z-10">
                    RATES
                </td>
                {weeklyColumns.map((w, idx) => (
                  <td key={idx} className="min-w-[100px] p-2 border-r border-slate-300 text-center bg-white text-slate-400 font-medium text-sm tabular-nums">
                    {w.rateSingle}
                  </td>
                ))}
              </tr>

              {/* DOUBLE ORDERS ROW */}
              <tr className="border-b border-slate-300 h-14 bg-[#ead1dc]/40">
                <td className="w-[180px] min-w-[180px] p-4 bg-[#fce5cd] border-r border-slate-300 sticky left-0 z-10 flex justify-between items-center h-14">
                   <span className="tracking-widest">DOUBLE ORDERS</span>
                   <span className="bg-white px-2 py-0.5 rounded border border-slate-300 tabular-nums">
                     {weeklyColumns.reduce((sum, w) => sum + w.doubleOrders, 0)}
                   </span>
                </td>
                {weeklyColumns.map((w, idx) => (
                  <td key={idx} className="min-w-[100px] p-2 border-r border-slate-300 text-center text-slate-800 font-black text-sm tabular-nums">
                    {w.doubleOrders}
                  </td>
                ))}
              </tr>

              {/* RATES ROW (DOUBLE) */}
              <tr className="border-b border-slate-300 h-14">
                <td className="w-[180px] min-w-[180px] p-4 bg-[#fce5cd] border-r border-slate-300 text-center font-black tracking-widest sticky left-0 z-10">
                    RATES
                </td>
                {weeklyColumns.map((w, idx) => (
                  <td key={idx} className="min-w-[100px] p-2 border-r border-slate-300 text-center bg-white text-slate-400 font-medium text-sm tabular-nums">
                    {w.rateDouble}
                  </td>
                ))}
              </tr>

              {/* AMOUNT SUMMARY ROW */}
              <tr className="border-b-2 border-slate-400 h-14 bg-[#c2d69b]/20">
                <td className="w-[180px] min-w-[180px] p-4 bg-[#c2d69b]/40 border-r border-slate-300 text-center font-black tracking-widest sticky left-0 z-10 text-emerald-900">
                    AMOUNT
                </td>
                {weeklyColumns.map((w, idx) => (
                  <td key={idx} className="min-w-[100px] p-2 border-r border-slate-300 text-center font-black text-emerald-700 text-sm tabular-nums">
                    {w.amount.toFixed(2)}
                  </td>
                ))}
                {weeklyColumns.length === 0 && (
                  <td className="p-4 text-center text-slate-400 italic font-medium" colSpan={7}>
                    No daily entries found for this period. Click "Generate All Slips" if you just uploaded data.
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Deductions Grid: Matching Reference preciesly */}
        <div className="bg-[#fce5cd]/30">
           {/* Section Amount Label */}
           <div className="h-10 border-b border-slate-300 flex justify-center items-center text-emerald-600 font-black text-base tabular-nums">
              {gross.toFixed(2)}
           </div>

           <div className="grid grid-cols-6 text-[10px] font-black uppercase tracking-widest border-b border-slate-300">
              <div className="p-3 bg-[#fce5cd] border-r border-b border-slate-300 text-center">SALES CASH</div>
              <div className="p-0 border-r border-b border-slate-300 flex">
                <input type="number" value={salesCash} onChange={e => setSalesCash(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2" />
              </div>
              <div className="p-3 bg-[#fce5cd] border-r border-b border-slate-300 text-center">CAR RENT</div>
              <div className="p-0 border-r border-b border-slate-300 flex">
                <input type="number" value={carRent} onChange={e => setCarRent(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2" />
              </div>
              <div className="p-3 bg-[#fce5cd] border-r border-b border-slate-300 text-center">AKAMA</div>
              <div className="p-0 border-b border-slate-300 flex">
                <input type="number" value={akama} onChange={e => setAkama(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2" />
              </div>

              <div className="p-3 bg-[#fce5cd] border-r border-b border-slate-300 text-center">FINE</div>
              <div className="p-0 border-r border-b border-slate-300 flex">
                <input type="number" value={fine} onChange={e => setFine(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2" />
              </div>
              <div className="p-3 bg-[#fce5cd] border-r border-b border-slate-300 text-center">DEDUCTION</div>
              <div className="p-0 border-r border-b border-slate-300 flex">
                <input type="number" value={deductions} onChange={e => setDeductions(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2" />
              </div>
              <div className="p-3 bg-[#fce5cd] border-r border-b border-slate-300 text-center">BOUNES</div>
              <div className="p-0 border-b border-slate-300 flex">
                <input type="number" value={bonus} onChange={e => setBonus(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2" />
              </div>

              <div className="col-span-1 p-3 bg-[#fce5cd] border-r border-slate-300 text-center flex items-center justify-center">BANK</div>
              <div className="col-span-5 p-0 flex">
                <input type="number" value={bankDeduction} onChange={e => setBankDeduction(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2 h-10" />
              </div>
           </div>
        </div>

        {/* Grand Total Footer */}
        <div className="bg-[#4f6228] p-5 flex justify-between items-center text-white border-t border-slate-900">
           <span className="text-3xl font-black italic tracking-[0.4em] ml-10">TOTAL</span>
           <span className="text-6xl font-black tracking-tighter mr-20 drop-shadow-lg tabular-nums">
             {net.toFixed(2)}
           </span>
        </div>
      </div>

      <div className="text-center">
         <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] leading-relaxed">
           Generated by Neqtra Payroll System &bull; Confidential &bull; Official Employee Record
         </p>
      </div>
    </div>
  );
}
