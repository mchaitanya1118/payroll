"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  ShieldCheck,
  Database,
  Calculator,
  Plus,
  Edit2,
  Bike,
  Car
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('rates');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  // Rate Management States
  const [rates, setRates] = useState<any[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<any>(null);
  const [editorLoading, setEditorLoading] = useState(false);

  // Form States
  const [formBatch, setFormBatch] = useState('');
  const [formVehicle, setFormVehicle] = useState<string>('BIKE');
  const [formRateType, setFormRateType] = useState<string>('TARGET');
  const [formRiderSingle, setFormRiderSingle] = useState('');
  const [formRiderDouble, setFormRiderDouble] = useState('');
  const [formCompanySingle, setFormCompanySingle] = useState('');
  const [formCompanyDouble, setFormCompanyDouble] = useState('');

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const { data } = await api.get('/rates');
      setRates(data);
    } catch (error) {
      toast.error('Failed to load rate configurations.');
    } finally {
      setRatesLoading(false);
    }
  };

  const handleSystemReset = async () => {
    if (confirmationText !== 'DELETE') {
        return toast.error("Please type DELETE to confirm");
    }

    setResetLoading(true);
    try {
      await api.post('/upload/reset');
      toast.success('System reset successful. All data cleared.');
      setResetConfirmOpen(false);
      setConfirmationText('');
      fetchRates(); // Refresh rates too
    } catch (error) {
      toast.error('Failed to reset system data.');
    } finally {
      setResetLoading(false);
    }
  };

  const openEditor = (rate: any = null) => {
    if (rate) {
      setEditingRate(rate);
      setFormBatch(rate.batchNumber.toString());
      setFormVehicle(rate.vehicleType);
      setFormRateType(rate.rateType || 'TARGET');
      setFormRiderSingle(rate.riderRateSingle.toString());
      setFormRiderDouble(rate.riderRateDouble.toString());
      setFormCompanySingle(rate.companyRateSingle.toString());
      setFormCompanyDouble(rate.companyRateDouble.toString());
    } else {
      setEditingRate(null);
      setFormBatch('');
      setFormVehicle('BIKE');
      setFormRateType('TARGET');
      setFormRiderSingle('');
      setFormRiderDouble('');
      setFormCompanySingle('');
      setFormCompanyDouble('');
    }
    setEditorOpen(true);
  };

  const handleRateUpsert = async () => {
    if (!formBatch || !formRiderSingle || !formCompanySingle) {
      return toast.error('Please fill in all required fields');
    }

    setEditorLoading(true);
    try {
      await api.post('/rates', {
        batchNumber: parseInt(formBatch),
        vehicleType: formVehicle,
        rateType: formRateType,
        riderRateSingle: parseFloat(formRiderSingle),
        riderRateDouble: parseFloat(formRiderDouble || '0'),
        companyRateSingle: parseFloat(formCompanySingle),
        companyRateDouble: parseFloat(formCompanyDouble || '0'),
      });
      toast.success(editingRate ? 'Rate updated' : 'Rate added');
      setEditorOpen(false);
      fetchRates();
    } catch (error) {
      toast.error('Failed to save rate configuration.');
    } finally {
      setEditorLoading(false);
    }
  };

  const handleRateDelete = async (id: string) => {
    try {
      await api.delete(`/rates/${id}`);
      toast.success('Rate configuration removed');
      fetchRates();
    } catch (error) {
      toast.error('Failed to delete rate.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
                <Calculator className="text-emerald-500" />
                Settings
            </h2>
            <p className="text-sm text-slate-500 font-medium">Configure global payroll rates and system environment.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
          <TabsTrigger value="rates" className="rounded-lg px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Rate Management
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-lg px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            System & Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-3 border-slate-200 shadow-xl shadow-slate-200/20">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
                <div>
                  <CardTitle className="text-lg font-black uppercase italic tracking-tighter">Rate Configurator</CardTitle>
                  <CardDescription>Define payout and revenue rates per batch and vehicle.</CardDescription>
                </div>
                <Button onClick={() => openEditor()} className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-xl shadow-lg shadow-emerald-500/20">
                  <Plus className="mr-2" size={18} /> Add New Rate
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-none">
                      <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-widest pl-6">Batch #</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Type</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Vehicle</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Rider (S/D)</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Company (S/D)</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-widest text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratesLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center">
                          <Loader2 className="mx-auto animate-spin text-slate-300" size={32} />
                        </TableCell>
                      </TableRow>
                    ) : rates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center text-slate-400 font-medium">
                          No rates configured. Default (0) will be used.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rates.map((rate) => (
                        <TableRow key={rate.id} className="group hover:bg-slate-50 transition-colors">
                          <TableCell className="pl-6 font-black text-slate-900 italic">#{rate.batchNumber}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              "font-black text-[8px] tracking-widest uppercase px-2 py-0.5",
                              rate.rateType === 'NO_TARGET' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"
                            )}>
                              {rate.rateType === 'NO_TARGET' ? 'NO TARGET' : 'TARGET'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              rate.vehicleType === 'CAR' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                            )}>
                              {rate.vehicleType === 'CAR' ? <Car size={12} /> : <Bike size={12} />}
                              {rate.vehicleType}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 tracking-tighter">{rate.riderRateSingle} / {rate.riderRateDouble}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">AED Payout</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-emerald-600 tracking-tighter">{rate.companyRateSingle} / {rate.companyRateDouble}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">AED Revenue</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => openEditor(rate)} className="hover:bg-blue-50 text-blue-600">
                                <Edit2 size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleRateDelete(rate.id)} className="hover:bg-red-50 text-red-500">
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6">
            <Card className="border-slate-200 shadow-lg shadow-slate-200/10">
              <CardHeader>
                <div className="flex items-center gap-2 text-emerald-600">
                  <ShieldCheck size={20} />
                  <CardTitle className="text-lg font-black uppercase italic tracking-tighter">Environment Integrity</CardTitle>
                </div>
                <CardDescription>System connectivity and data context status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <Database className="text-slate-400" />
                        <div>
                            <p className="text-sm font-bold text-slate-900">demo-tenant (Active)</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Multi-Tenant Engine V1.0</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Connected</span>
                    </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/30 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4">
                <AlertTriangle size={120} className="text-red-900" />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={20} />
                  <CardTitle className="text-lg font-black uppercase italic tracking-tighter">System Reset</CardTitle>
                </div>
                <CardDescription className="text-red-700 font-medium">Clear all system data (Riders, Batches, Entries, Payslips).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-white rounded-2xl border border-red-100 shadow-sm gap-6">
                   <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">Fresh Start Protocol</p>
                      <p className="text-xs text-slate-500 max-w-md leading-relaxed">This will revert the dashboard to a completely empty state. Useful for starting a new payroll year or testing.</p>
                   </div>
                   
                   <Button 
                      variant="outline" 
                      onClick={() => setResetConfirmOpen(true)}
                      className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 h-14 rounded-2xl font-black uppercase italic tracking-tighter"
                    >
                      <Trash2 className="mr-2" size={18} /> Wipe System Data
                    </Button>

                    <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
                      <DialogContent className="sm:max-w-[450px] border-none shadow-2xl p-0 overflow-hidden bg-white">
                        <DialogHeader className="p-8 pb-4">
                          <DialogTitle className="text-red-600 flex items-center gap-2 uppercase font-black italic tracking-tighter">
                             Extreme Caution
                          </DialogTitle>
                          <DialogDescription className="pt-2 text-slate-500 font-medium leading-relaxed">
                             Type <span className="font-black text-red-600">DELETE</span> to confirm the wipe.
                          </DialogDescription>
                        </DialogHeader>
                       <div className="py-4 space-y-4">
                          <input 
                            type="text" 
                            className="w-full px-4 py-4 border-2 border-slate-100 bg-slate-50 rounded-xl font-black tracking-widest uppercase focus:border-red-500 focus:outline-none transition-all text-center"
                            placeholder="DELETE"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                          />
                       </div>
                       <DialogFooter>
                         <Button 
                            type="submit" 
                            variant="destructive" 
                            className="w-full font-bold h-14 rounded-2xl text-lg uppercase italic tracking-tighter"
                            disabled={confirmationText !== 'DELETE' || resetLoading}
                            onClick={handleSystemReset}
                         >
                           {resetLoading ? (
                             <>
                               <Loader2 className="mr-2 animate-spin" size={18} />
                               Whiping...
                             </>
                           ) : (
                             "Yes, Wipe Everything"
                           )}
                         </Button>
                       </DialogFooter>
                     </DialogContent>
                   </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rate Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl p-0 overflow-hidden bg-white/80 backdrop-blur-xl">
          <DialogHeader className="p-8 bg-slate-900 text-white">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <Calculator className="text-emerald-500" />
                </div>
                <div>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
                        {editingRate ? 'Modify Configuration' : 'New Rate Config'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Map specialized rates to batches and vehicles.
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Batch Number</Label>
                <Input 
                  type="number" 
                  value={formBatch} 
                  onChange={(e) => setFormBatch(e.target.value)}
                  placeholder="e.g. 1"
                  className="rounded-xl h-12 border-slate-200 focus:border-emerald-500/50 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Vehicle Type</Label>
                <Select value={formVehicle} onValueChange={(val) => setFormVehicle(val || 'BIKE')}>
                  <SelectTrigger className="rounded-xl h-12 border-slate-200 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    <SelectItem value="BIKE" className="font-bold">BIKE</SelectItem>
                    <SelectItem value="CAR" className="font-bold">CAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Rate Type</Label>
                <Select value={formRateType} onValueChange={(val) => setFormRateType(val || 'TARGET')}>
                  <SelectTrigger className="rounded-xl h-12 border-slate-200 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    <SelectItem value="TARGET" className="font-bold">TARGET BASED</SelectItem>
                    <SelectItem value="NO_TARGET" className="font-bold">NO TARGET (FLAT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        Rider Payout (Cost)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-slate-500">Single Rate</Label>
                            <Input 
                                type="number" 
                                value={formRiderSingle} 
                                onChange={(e) => setFormRiderSingle(e.target.value)}
                                className="h-10 border-none bg-white shadow-sm font-bold text-center"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-slate-500">Double Rate</Label>
                            <Input 
                                type="number" 
                                value={formRiderDouble} 
                                onChange={(e) => setFormRiderDouble(e.target.value)}
                                className="h-10 border-none bg-white shadow-sm font-bold text-center"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-4 flex items-center gap-2">
                        <Calculator size={12} />
                        Company Revenue
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-emerald-700/60">Single Rate</Label>
                            <Input 
                                type="number" 
                                value={formCompanySingle} 
                                onChange={(e) => setFormCompanySingle(e.target.value)}
                                className="h-10 border-none bg-white shadow-sm font-bold text-center text-emerald-600"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-emerald-700/60">Double Rate</Label>
                            <Input 
                                type="number" 
                                value={formCompanyDouble} 
                                onChange={(e) => setFormCompanyDouble(e.target.value)}
                                className="h-10 border-none bg-white shadow-sm font-bold text-center text-emerald-600"
                            />
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0">
            <Button 
                onClick={handleRateUpsert} 
                className="w-full bg-slate-900 hover:bg-black text-white h-14 rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-slate-900/10"
                disabled={editorLoading}
            >
              {editorLoading ? <Loader2 className="animate-spin mr-2" /> : editingRate ? 'Save Changes' : 'Initialize Rate Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
