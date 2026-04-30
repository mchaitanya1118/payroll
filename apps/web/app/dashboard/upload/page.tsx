"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import ColumnMapper from '@/components/upload/ColumnMapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'results'>('upload');
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<{ headers: string[]; sample: any } | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [result, setResult] = useState<{ 
    processed: number; 
    newRiders: number;
    newBatches: number;
    errors: string[] 
  } | null>(null);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);
      
      // Auto-preview headers
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const response = await api.post('/upload/preview', formData);
        // We take the first sheet that has headers
        const sheetWithHeaders = response.data.find((s: any) => s.headers.length > 0) || response.data[0];
        setPreviewData({
          headers: sheetWithHeaders.headers,
          sample: sheetWithHeaders.sample
        });
        setStep('mapping');
      } catch (error: any) {
        toast.error('Failed to read file headers. Please ensure it is a valid Excel file.');
        setFile(null);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleConfirmMapping = async (mapping: Record<string, string>) => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    formData.append('month', month.toString());
    formData.append('year', year.toString());

    try {
      const response = await api.post('/upload/excel', formData);
      setResult(response.data);
      setStep('results');
      toast.success(`Successfully processed ${response.data.processed} entries`);
      setFile(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to import data');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setResult(null);
    setPreviewData(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-xl p-6 rounded-3xl premium-shadow border border-white/60">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
            <UploadCloud className="text-blue-500 shrink-0" size={32} />
            Data Ingestion
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">Transform raw Excel files into structured system entries.</p>
        </div>
        {step !== 'upload' && (
           <Button variant="ghost" size="sm" onClick={reset} className="text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl hover:bg-white/50 transition-all">
             Reset Engine
           </Button>
        )}
      </div>

      {step === 'upload' && (
        <Card className="glass-card border-none shadow-2xl relative overflow-hidden bg-white/40 backdrop-blur-xl rounded-3xl group border border-white/60">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileSpreadsheet size={160} strokeWidth={1} className="text-blue-500" />
          </div>
          <CardContent className="flex flex-col items-center justify-center p-8 md:p-16 text-center relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-blue-200">
              <UploadCloud className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight mb-2">Initialize Import</h3>
            <p className="text-slate-500 font-medium mb-10 max-w-sm leading-relaxed">Drop your Master Excel file here. We&apos;ll auto-detect headers and assist with column mapping.</p>
            
            <div className="flex flex-wrap gap-4 mb-10 justify-center">
                <div className="text-left space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Target Month</Label>
                    <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                        <SelectTrigger className="h-11 bg-white border-slate-200 font-bold rounded-xl w-32 md:w-40 shadow-sm focus:ring-blue-500">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100">
                            {months.map(m => <SelectItem key={m.value} value={m.value.toString()} className="font-bold">{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-left space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Target Year</Label>
                    <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                        <SelectTrigger className="h-11 bg-white border-slate-200 font-bold rounded-xl w-24 md:w-32 shadow-sm focus:ring-blue-500">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100">
                            {[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()} className="font-bold">{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <input 
              type="file" 
              id="excel-upload" 
              className="hidden" 
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />
            
            <Button 
              onClick={() => document.getElementById('excel-upload')?.click()}
              disabled={uploading}
              className="bg-slate-900 hover:bg-black text-white h-14 rounded-2xl font-black uppercase tracking-widest text-xs px-10 transition-all active:scale-95 shadow-xl shadow-slate-900/20 group"
            >
              {uploading ? <Loader2 className="animate-spin mr-3" size={20} /> : <FileSpreadsheet className="mr-3 group-hover:translate-y-0.5 transition-transform" size={20} />}
              {uploading ? "Analyzing Schema..." : "Select Source File"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'mapping' && previewData && (
        <ColumnMapper 
           headers={previewData.headers}
           sample={previewData.sample}
           isProcessing={uploading}
           onCancel={reset}
           onConfirm={handleConfirmMapping}
        />
      )}

      {step === 'results' && result && (
        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-500/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500 animate-bounce" />
                <CardTitle className="text-emerald-900">Import Successful</CardTitle>
              </div>
              <CardDescription className="text-emerald-700">
                The engine successfully processed and persisted the mapped data.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest mb-1">Total Processed</p>
                    <p className="text-2xl md:text-3xl font-black text-emerald-900 leading-none">{result.processed}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest mb-1">New Riders</p>
                    <p className="text-2xl md:text-3xl font-black text-emerald-900 leading-none">{result.newRiders}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest mb-1">New Batches</p>
                    <p className="text-2xl md:text-3xl font-black text-emerald-900 leading-none">{result.newBatches}</p>
                  </div>
               </div>
               {result.newBatches > 0 && (
                 <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <p><strong>Configuration Required:</strong> {result.newBatches} new batches were created. Please visit Settings to define their payout rates so payslips can be calculated correctly.</p>
                 </div>
               )}
               <div className="mt-6 flex justify-end">
                  <Button onClick={reset} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8">
                    DONE
                  </Button>
               </div>
            </CardContent>
          </Card>
          
          {result.errors.length > 0 && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-red-500" />
                  <CardTitle className="text-red-900">Skipped {result.errors.length} Rows</CardTitle>
                </div>
                <CardDescription className="text-red-700">Some rows could not be processed due to formatting issues.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-y-auto bg-white/50 rounded border border-red-100 p-2">
                  <ul className="text-xs font-mono text-red-800 space-y-1">
                    {result.errors.map((err, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="opacity-40">#{i+1}</span>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      <div className="glass-card border-none shadow-xl p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden mt-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-black uppercase italic tracking-tight">Need ingestion assistance?</h3>
            <p className="text-slate-400 max-w-xl">
              If your source file has non-standard formatting or requires complex formula mapping, our technical team can assist in schema calibration.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <ShieldCheck size={14} className="text-blue-500" /> Schema Guard
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <FileSpreadsheet size={14} className="text-emerald-500" /> Excel V2
              </div>
            </div>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-slate-900 font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl transition-all">
             Contact Ops <CheckCircle2 className="ml-2" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
