import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Download, Save, Printer, ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate, toTitleCase } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';
import { useCurrency } from '@/hooks/useCurrency';
import { jsPDF } from 'jspdf';
import domtoimage from 'dom-to-image-more';

export default function RiderPayslipView({ riderId, month, year, onBack }: any) {
  const { format, currencySymbol } = useCurrency();
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
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [preparedFile, setPreparedFile] = useState<File | null>(null);
  const [preparedPdf, setPreparedPdf] = useState<any>(null);

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

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      await api.post(`/payslips/${data.payslip.id}/send-email`);
      toast.success('Email sent successfully!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send email';
      toast.error(msg);
    } finally {
      setSendingEmail(false);
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
        <div className="flex flex-wrap gap-2 md:gap-4 items-center w-full md:w-auto">
            <button 
              onClick={() => setStatus(status === 'DRAFT' ? 'FINAL' : 'DRAFT')}
              className={cn(
                "h-10 md:h-11 px-4 md:px-6 rounded-xl font-black text-[9px] md:text-[10px] tracking-widest transition-all active:scale-95 border-2 flex-1 md:flex-none",
                status === 'FINAL' 
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" 
                  : "bg-slate-100 text-slate-500 border-slate-200"
              )}
            >
              STATUS: {status}
            </button>
            <Button 
                onClick={handleSendEmail} 
                disabled={sendingEmail || !data.payslip.rider.email}
                variant="outline" 
                className={cn(
                    "h-10 md:h-11 px-4 md:px-6 rounded-xl border-2 font-black text-[9px] md:text-[10px] tracking-widest transition-all flex-1 md:flex-none",
                    !data.payslip.rider.email ? "opacity-30 border-slate-200" : "border-emerald-200 text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50"
                )}
            >
                {sendingEmail ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Mail size={14} className="mr-2" />} 
                {sendingEmail ? "SENDING..." : "EMAIL"}
            </Button>
            <Button 
                onClick={async () => {
                   const phone = data.payslip.rider.phoneNumber;
                   if (!phone) return toast.error("No phone number found for this rider.");
                   
                   // If file is already prepared, trigger the direct server-side send
                   if (preparedFile) {
                       try {
                           setSharingWhatsApp(true);
                           const formData = new FormData();
                           formData.append('file', preparedFile);
                           formData.append('phoneNumber', phone);
                           formData.append('caption', `*SALARY SLIP - ${monthName} ${year}*\n\nHello *${data.payslip.rider.riderName}*, your payslip is attached.`);

                           const res = await api.post('/whatsapp/send-payslip', formData, {
                               headers: { 'Content-Type': 'multipart/form-data' }
                           });

                           if (res.data.success) {
                               toast.success("Sent directly to Rider's WhatsApp!");
                               setPreparedFile(null);
                               setPreparedPdf(null);
                           } else {
                               throw new Error(res.data.message);
                           }
                       } catch (err: any) {
                           console.error("Direct send failed:", err);
                           toast.error(`Direct Send Failed: ${err.message || 'Check WhatsApp Connection in Settings'}`);
                           
                           // Last resort fallback: Manual
                           preparedPdf?.save(preparedFile.name);
                           const msg = `*SALARY SLIP - ${monthName} ${year}*\n\n` +
                                       `Hello *${data.payslip.rider.riderName}*,\n` +
                                       `Automated send failed. Please attach and send manually.\n\n` +
                                       `- Net Total: ${currencySymbol} ${net.toFixed(2)}`;
                           const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
                           window.open(url, '_blank');
                       } finally {
                           setSharingWhatsApp(false);
                       }
                       return;
                   }

                   // Otherwise, prepare the file
                   try {
                       setSharingWhatsApp(true);
                       setIsCapturing(true);
                       
                       // 1. Generate PDF via Image capture
                       const element = contentRef.current;
                       if (!element) throw new Error("Payslip content not found");

                       // Small delay to ensure clean render with isCapturing applied
                       await new Promise(r => setTimeout(r, 500));

                       const imgData = await domtoimage.toPng(element, {
                           bgcolor: '#ffffff',
                           quality: 1.0,
                           width: element.offsetWidth * 2,
                           height: element.offsetHeight * 2,
                           style: {
                               transform: 'scale(2)',
                               transformOrigin: 'top left',
                               width: `${element.offsetWidth}px`,
                               height: `${element.offsetHeight}px`,
                           }
                       });

                       const pdfOrientation = element.offsetWidth > element.offsetHeight ? 'l' : 'p';
                       const pdf = new jsPDF(pdfOrientation, 'mm', 'a4');
                       const pdfWidth = pdf.internal.pageSize.getWidth();
                       const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
                       
                       pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                       const pdfBlob = pdf.output('blob');
                       const fileName = `Payslip_${data.payslip.rider.riderId}_${month}_${year}.pdf`.replace(/\s+/g, '_');
                       const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

                       setPreparedFile(file);
                       setPreparedPdf(pdf);
                       toast.success("PDF Prepared! Click again to Send.");
                   } catch (err: any) {
                       console.error(err);
                       toast.error(`PDF Error: ${err.message || 'Unknown error'}`);
                   } finally {
                       setSharingWhatsApp(false);
                       setIsCapturing(false);
                   }
                }} 
                disabled={sharingWhatsApp || !data.payslip.rider.phoneNumber}
                variant="outline" 
                className={cn(
                    "h-10 md:h-11 px-4 md:px-6 rounded-xl border-2 font-black text-[9px] md:text-[10px] tracking-widest transition-all w-full md:w-auto",
                    !data.payslip.rider.phoneNumber 
                      ? "opacity-30 border-slate-200" 
                      : preparedFile 
                        ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg" 
                        : "border-emerald-200 text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50"
                )}
            >
                <div className="flex items-center justify-center gap-2">
                    {sharingWhatsApp ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <svg viewBox="0 0 24 24" className={cn("w-4 h-4 fill-current", preparedFile && "text-white")} xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    )}
                    {preparedFile ? "SEND NOW" : "WHATSAPP PDF"}
                </div>
            </Button>
            <Button onClick={() => handlePrint()} variant="outline" className="h-10 md:h-11 px-4 md:px-6 rounded-xl border-2 border-slate-200 hover:border-slate-900 font-black text-[9px] md:text-[10px] tracking-widest transition-all flex-1 md:flex-none">
                <Printer size={14} className="mr-2" /> PRINT
            </Button>
            <Button onClick={handleSave} className="h-10 md:h-11 px-6 md:px-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-black text-[9px] md:text-[10px] tracking-widest shadow-xl transition-all active:scale-95 w-full md:w-auto">
                <Save size={14} className="mr-2" /> SAVE CHANGES
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
        <div className="grid grid-cols-2 md:grid-cols-12 text-[10px] md:text-[12px] font-black uppercase tracking-widest border-b border-slate-300">
           <div className="col-span-1 bg-[#fce5cd] p-3 md:p-4 border-r border-slate-300 text-center flex items-center justify-center">ID</div>
           <div className="col-span-1 md:col-span-2 p-3 md:p-4 border-r border-slate-300 text-center font-mono text-sm md:text-base bg-white flex items-center justify-center">{data.payslip.rider.riderId}</div>
           <div className="col-span-1 md:col-span-1 bg-[#fce5cd] p-3 md:p-4 border-r border-slate-300 text-center flex items-center justify-center">NAME</div>
           <div className="col-span-1 md:col-span-8 p-3 md:p-4 font-bold text-sm md:text-lg bg-[#d9e2f3] truncate flex items-center md:px-10">
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
                  <td className="p-4 text-center text-slate-400 italic font-medium" colSpan={weeklyColumns.length || 7}>
                    No daily entries found for this period. Click &quot;Generate All Slips&quot; if you just uploaded data.
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
              {currencySymbol} {gross.toFixed(2)}
           </div>

           <div className="grid grid-cols-2 md:grid-cols-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest border-b border-slate-300">
              <div className="p-2 md:p-3 bg-[#fce5cd] border-r border-b border-slate-300 text-center flex items-center justify-center">SALES CASH</div>
              <div className="p-0 border-r border-b border-slate-300 flex">
                {isCapturing ? (
                  <span className="w-full bg-white text-center font-mono text-sm px-2 py-2">{salesCash}</span>
                ) : (
                  <input type="number" value={salesCash} onChange={e => setSalesCash(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2 h-10 md:h-auto" />
                )}
              </div>
              <div className="p-2 md:p-3 bg-[#fce5cd] border-r border-b border-slate-300 text-center flex items-center justify-center">CAR RENT</div>
              <div className="p-0 border-r border-b border-slate-300 flex">
                {isCapturing ? (
                  <span className="w-full bg-white text-center font-mono text-sm px-2 py-2">{carRent}</span>
                ) : (
                  <input type="number" value={carRent} onChange={e => setCarRent(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2 h-10 md:h-auto" />
                )}
              </div>
              <div className="p-2 md:p-3 bg-[#fce5cd] border-r border-b border-slate-300 text-center flex items-center justify-center">AKAMA</div>
              <div className="p-0 border-b border-slate-300 flex md:border-r">
                {isCapturing ? (
                  <span className="w-full bg-white text-center font-mono text-sm px-2 py-2">{akama}</span>
                ) : (
                  <input type="number" value={akama} onChange={e => setAkama(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2 h-10 md:h-auto" />
                )}
              </div>

              <div className="p-2 md:p-3 bg-[#fce5cd] border-r border-b border-slate-300 text-center flex items-center justify-center">FINE</div>
              <div className="p-0 border-r border-b border-slate-300 flex">
                {isCapturing ? (
                  <span className="w-full bg-white text-center font-mono text-sm px-2 py-2">{fine}</span>
                ) : (
                  <input type="number" value={fine} onChange={e => setFine(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2 h-10 md:h-auto" />
                )}
              </div>
              <div className="p-2 md:p-3 bg-[#fce5cd] border-r border-b border-slate-300 text-center flex items-center justify-center">DEDUCTION</div>
              <div className="p-0 border-r border-b border-slate-300 flex">
                {isCapturing ? (
                  <span className="w-full bg-white text-center font-mono text-sm px-2 py-2">{deductions}</span>
                ) : (
                  <input type="number" value={deductions} onChange={e => setDeductions(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2 h-10 md:h-auto" />
                )}
              </div>
              <div className="p-2 md:p-3 bg-[#fce5cd] border-r border-b border-slate-300 text-center flex items-center justify-center">BOUNES</div>
              <div className="p-0 border-b border-slate-300 flex">
                {isCapturing ? (
                  <span className="w-full bg-white text-center font-mono text-sm px-2 py-2">{bonus}</span>
                ) : (
                  <input type="number" value={bonus} onChange={e => setBonus(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2 h-10 md:h-auto" />
                )}
              </div>

              <div className="col-span-1 p-2 md:p-3 bg-[#fce5cd] border-r border-slate-300 text-center flex items-center justify-center">BANK</div>
              <div className="col-span-1 md:col-span-5 p-0 flex">
                {isCapturing ? (
                  <span className="w-full bg-white text-center font-mono text-sm px-2 py-2">{bankDeduction}</span>
                ) : (
                  <input type="number" value={bankDeduction} onChange={e => setBankDeduction(parseFloat(e.target.value) || 0)} className="w-full bg-white text-center font-mono text-sm outline-none px-2 h-10" />
                )}
              </div>
           </div>
        </div>

         <div className="bg-[#4f6228] p-4 text-white border-t border-slate-900">
            <table className="w-full border-none">
              <tbody>
                <tr>
                  <td className="text-left align-middle">
                    <span className="text-sm md:text-base font-black italic tracking-[0.2em] uppercase">TOTAL</span>
                  </td>
                  <td className="text-right align-middle">
                    <span className={cn(
                      "text-2xl md:text-4xl font-black",
                      !isCapturing && "drop-shadow-lg tracking-tighter"
                    )}>
                      {currencySymbol} {net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
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
