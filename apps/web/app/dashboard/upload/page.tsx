"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import ColumnMapper from '@/components/upload/ColumnMapper';

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
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Data Ingestion Engine</h2>
          <p className="text-sm text-slate-500">Transform raw Excel files into structured payroll entries.</p>
        </div>
        {step !== 'upload' && (
           <Button variant="ghost" size="sm" onClick={reset} className="text-slate-400 hover:text-slate-900">
             Start Over
           </Button>
        )}
      </div>

      {step === 'upload' && (
        <Card className="border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors group">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Drag & Drop your Excel file</h3>
            <p className="text-slate-500 mb-8 max-w-sm">Accepted formats: .xlsx, .xls. We'll help you map the columns in the next step.</p>
            
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
                <div className="text-left space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Payroll Month</label>
                    <select 
                        value={month} 
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
                <div className="text-left space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Payroll Year</label>
                    <select 
                        value={year} 
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <input 
              type="file" 
              id="excel-upload" 
              className="hidden" 
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />
            
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('excel-upload')?.click()}
                disabled={uploading}
                className="border-slate-200 px-8"
              >
                {uploading ? <Loader2 className="animate-spin mr-2" size={16} /> : <FileSpreadsheet className="mr-2" size={16} />}
                {uploading ? "Analyzing..." : "Select Master Excel"}
              </Button>
            </div>
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
               <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest mb-1">Total Processed</p>
                    <p className="text-3xl font-black text-emerald-900">{result.processed}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest mb-1">New Riders</p>
                    <p className="text-3xl font-black text-emerald-900">{result.newRiders}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest mb-1">New Batches</p>
                    <p className="text-3xl font-black text-emerald-900">{result.newBatches}</p>
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
    </div>
  );
}
