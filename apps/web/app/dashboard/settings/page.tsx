"use client";

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
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
  Car,
  UserPlus,
  UserCheck,
  Mail,
  User,
  ShieldAlert,
  Globe,
  Building,
  MessageSquare, 
  RefreshCcw, 
  CheckCircle2, 
  Smartphone,
  QrCode,
  Download,
  Settings,
  ArrowRight,
  Upload,
  Users
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
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [formBatch, setFormBatch] = useState('');
  const [formVehicle, setFormVehicle] = useState<string>('BIKE');
  const [formRateType, setFormRateType] = useState<string>('TARGET');
  const [formRiderSingle, setFormRiderSingle] = useState('');
  const [formRiderDouble, setFormRiderDouble] = useState('');
  const [formCompanySingle, setFormCompanySingle] = useState('');
  const [formCompanyDouble, setFormCompanyDouble] = useState('');
  const [formTargetCount, setFormTargetCount] = useState('300');

  // User Management States
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userEditorOpen, setUserEditorOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ACCOUNTANT'
  });
  const [userEditorLoading, setUserEditorLoading] = useState(false);
  const updateUser = useAuthStore((state) => state.updateUser);

  // Group Management States
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupEditorOpen, setGroupEditorOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [groupName, setGroupName] = useState('');
  const [groupRateEditorOpen, setGroupRateEditorOpen] = useState(false);
  const [editingGroupRate, setEditingGroupRate] = useState<any>(null);
  const [allRiders, setAllRiders] = useState<any[]>([]);
  const [riderAssignmentOpen, setRiderAssignmentOpen] = useState(false);
  const [selectedRiderIds, setSelectedRiderIds] = useState<string[]>([]);

  // Tenant Settings States
  const [tenantSettings, setTenantSettings] = useState({
    name: '',
    currency: 'SAR',
    currencySymbol: 'SAR'
  });
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantSaving, setTenantSaving] = useState(false);

  // WhatsApp States
  const [waStatus, setWaStatus] = useState<any>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [waRefreshing, setWaRefreshing] = useState(false);

  useEffect(() => {
    fetchRates();
    fetchGroups();
    fetchUsers();
    fetchRiders();
    fetchTenantSettings();
    fetchWaStatus();
  }, []);

  const fetchRiders = async () => {
    try {
      const { data } = await api.get('/riders');
      setAllRiders(data);
    } catch (error) {
      console.error('Failed to load riders');
    }
  };

  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);
      const { data } = await api.get('/rider-groups');
      setGroups(data);
    } catch (error) {
      toast.error('Failed to load groups');
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleGroupUpsert = async () => {
    if (!groupName) return toast.error('Group name is required');
    try {
      if (editingGroup) {
        await api.patch(`/rider-groups/${editingGroup.id}`, { name: groupName });
      } else {
        await api.post('/rider-groups', { name: groupName });
      }
      toast.success(editingGroup ? 'Group updated' : 'Group created');
      setGroupEditorOpen(false);
      fetchGroups();
    } catch (error) {
      toast.error('Failed to save group');
    }
  };

  const handleGroupDelete = async (id: string) => {
    if (!confirm('Are you sure? All riders will be unassigned and group rates will be deleted.')) return;
    try {
      await api.delete(`/rider-groups/${id}`);
      toast.success('Group deleted');
      fetchGroups();
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const handleGroupRateUpsert = async () => {
    if (!editingGroup) return;
    try {
      await api.post(`/rider-groups/${editingGroup.id}/rates`, {
        vehicleType: formVehicle,
        rateType: formRateType,
        riderRateSingle: parseFloat(formRiderSingle),
        riderRateDouble: parseFloat(formRiderDouble || '0'),
        companyRateSingle: parseFloat(formCompanySingle),
        companyRateDouble: parseFloat(formCompanyDouble || '0'),
        targetCount: parseInt(formTargetCount || '300'),
      });
      toast.success('Group rate saved');
      setGroupRateEditorOpen(false);
      fetchGroups();
    } catch (error) {
      toast.error('Failed to save group rate');
    }
  };

  const handleDeleteGroupRate = async (rateId: string) => {
    try {
      await api.delete(`/rider-groups/rates/${rateId}`);
      toast.success('Group rate removed');
      fetchGroups();
    } catch (error) {
      toast.error('Failed to delete group rate');
    }
  };

  const handleRiderAssignment = async () => {
    if (!editingGroup) return;
    try {
      await api.post(`/rider-groups/${editingGroup.id}/riders`, { riderIds: selectedRiderIds });
      toast.success('Riders assigned successfully');
      setRiderAssignmentOpen(false);
      fetchGroups();
      fetchRiders(); // Refresh rider data to see updated group assignments
    } catch (error) {
      toast.error('Failed to assign riders');
    }
  };

  const fetchWaStatus = async () => {
    try {
      setWaLoading(prev => !prev ? true : prev);
      const { data } = await api.get('/whatsapp/status');
      setWaStatus(data);
    } catch (error) {
      console.error('Failed to load WhatsApp status');
    } finally {
      setWaLoading(false);
      setWaRefreshing(false);
    }
  };

  const handleWaReset = async () => {
    if (!confirm("This will permanently clear your WhatsApp session and require a new QR scan. Continue?")) return;
    setWaRefreshing(true);
    try {
      await api.post('/whatsapp/logout');
      toast.success("WhatsApp session cleared. System is re-initializing...");
      fetchWaStatus();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to reset WhatsApp session.";
      toast.error(msg);
    } finally {
      setWaRefreshing(false);
    }
  };

  const fetchTenantSettings = async () => {
    try {
      setTenantLoading(true);
      const { data } = await api.get('/tenants/settings');
      setTenantSettings(data);
      updateUser({ tenant: data });
    } catch (error) {
      console.error('Failed to load tenant settings');
    } finally {
      setTenantLoading(false);
    }
  };

  const handleTenantUpdate = async () => {
    setTenantSaving(true);
    try {
      const { data } = await api.patch('/tenants/settings', tenantSettings);
      toast.success('Organization settings updated');
      updateUser({ tenant: data });
    } catch (error) {
      toast.error('Failed to update organization settings');
    } finally {
      setTenantSaving(false);
    }
  };

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

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await api.get('/rates/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'rate_configs.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded successfully');
    } catch (error) {
      toast.error('Failed to export rate configurations');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/rates/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(data.message || 'Rates imported successfully');
      fetchRates();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to import rate configurations';
      toast.error(msg);
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      setFormTargetCount((rate.targetCount || 300).toString());
    } else {
      setEditingRate(null);
      setFormBatch('');
      setFormVehicle('BIKE');
      setFormRateType('TARGET');
      setFormRiderSingle('');
      setFormRiderDouble('');
      setFormCompanySingle('');
      setFormCompanyDouble('');
      setFormTargetCount('300');
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
        targetCount: parseInt(formTargetCount || '300'),
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

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserUpsert = async () => {
    if (!userForm.email || !userForm.name || (!editingUser && !userForm.password)) {
      return toast.error('Please fill in all required fields');
    }

    setUserEditorLoading(true);
    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, userForm);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', userForm);
        toast.success('User created successfully');
      }
      setUserEditorOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    } finally {
      setUserEditorLoading(false);
    }
  };

  const handleUserDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User removed');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const openUserEditor = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name || '',
        email: user.email,
        password: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        password: '',
        role: 'ACCOUNTANT'
      });
    }
    setUserEditorOpen(true);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-xl p-6 rounded-3xl premium-shadow border border-white/60">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
            <Settings className="text-emerald-500 shrink-0" size={32} />
            Command Settings
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">Configure global payroll protocols and system environment.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto scrollbar-hide mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="bg-slate-200/50 backdrop-blur-md p-1.5 rounded-2xl w-fit md:w-full flex md:grid md:grid-cols-5 border border-white/40 h-14">
            <TabsTrigger value="rates" className="rounded-xl px-6 md:px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xl whitespace-nowrap h-full">
              Rate Cards
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl px-6 md:px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xl whitespace-nowrap h-full">
              Personnel
            </TabsTrigger>
            <TabsTrigger value="organization" className="rounded-xl px-6 md:px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xl whitespace-nowrap h-full">
              HQ Profile
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="rounded-xl px-6 md:px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xl whitespace-nowrap h-full">
              Automations
            </TabsTrigger>
            <TabsTrigger value="system" className="rounded-xl px-6 md:px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xl whitespace-nowrap h-full">
              Core
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-3 glass-card border-none shadow-2xl rounded-3xl overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/40 pb-6 p-6 md:p-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm">
                    <Calculator size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-1">Rate Configurator</CardTitle>
                    <CardDescription className="text-xs font-medium text-slate-500 italic">Define payout and revenue rates per batch.</CardDescription>
                  </div>
                </div>
                <div className="flex flex-row gap-3 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileImport}
                  />
                  <Button 
                    onClick={handleImportClick} 
                    disabled={importLoading} 
                    variant="outline" 
                    className="flex-1 md:flex-none border-2 border-slate-200 text-slate-500 rounded-2xl px-6 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 h-10 md:h-12"
                  >
                    {importLoading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    <span className="ml-2 hidden sm:inline">Import Rates</span>
                    <span className="ml-2 sm:hidden">Import</span>
                  </Button>
                  <Button onClick={handleExport} disabled={exportLoading} variant="outline" className="flex-1 md:flex-none border-2 border-slate-900 text-slate-900 rounded-2xl px-6 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 h-10 md:h-12">
                    {exportLoading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                    <span className="ml-2 hidden sm:inline">Export List</span>
                    <span className="ml-2 sm:hidden">Export</span>
                  </Button>
                  <Button onClick={() => openEditor()} className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl px-6 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-3 h-10 md:h-12">
                    <Plus className="shrink-0" size={16} /> 
                    <span className="hidden sm:inline">Add Configuration</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mobile Rates View */}
                <div className="block md:hidden">
                  {rates.map((rate) => (
                    <div key={rate.id} className="p-5 border-b border-white/40 relative group hover:bg-emerald-50/20 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-black text-slate-900 italic tabular-nums">#{rate.batchNumber}</p>
                          <Badge variant="outline" className={cn(
                            "font-black text-[8px] tracking-widest uppercase px-2 py-0.5",
                            rate.rateType === 'NO_TARGET' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"
                          )}>
                            {rate.rateType === 'NO_TARGET' ? 'NO TARGET' : 'TARGET'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditor(rate)} className="text-blue-500 hover:bg-blue-50 rounded-xl h-9 w-9">
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleRateDelete(rate.id)} className="text-red-500 hover:bg-red-50 rounded-xl h-9 w-9">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-3">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vehicle</p>
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                rate.vehicleType === 'CAR' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                              )}>
                                {rate.vehicleType === 'CAR' ? <Car size={10} /> : <Bike size={10} />}
                                {rate.vehicleType}
                              </span>
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rider Payout</p>
                               <p className="text-sm font-black text-slate-900 tabular-nums leading-none">{rate.riderRateSingle} / {rate.riderRateDouble}</p>
                            </div>
                         </div>
                         <div className="space-y-3">
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Company Rev</p>
                               <p className="text-sm font-black text-emerald-600 tabular-nums leading-none">{rate.companyRateSingle} / {rate.companyRateDouble}</p>
                            </div>
                         </div>
                      </div>
                    </div>
                  ))}
                  {!ratesLoading && rates.length === 0 && (
                    <div className="py-12 text-center text-slate-400 italic text-sm">No rates configured.</div>
                  )}
                </div>

                {/* Desktop Rates Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader className="bg-slate-900/5">
                      <TableRow className="border-b border-white/40">
                        <TableHead className="font-black text-[10px] uppercase text-slate-900 tracking-widest pl-8 h-12">Batch #</TableHead>
                        <TableHead className="font-black text-[10px] uppercase text-slate-900 tracking-widest h-12">Type</TableHead>
                        <TableHead className="font-black text-[10px] uppercase text-slate-900 tracking-widest h-12">Vehicle</TableHead>
                        <TableHead className="font-black text-[10px] uppercase text-slate-900 tracking-widest h-12">Rider (S/D)</TableHead>
                        <TableHead className="font-black text-[10px] uppercase text-slate-900 tracking-widest h-12">Company (S/D)</TableHead>
                        <TableHead className="font-black text-[10px] uppercase text-slate-900 tracking-widest text-right pr-8 h-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ratesLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-40 text-center">
                            <Loader2 className="mx-auto animate-spin text-slate-300" size={32} />
                          </TableCell>
                        </TableRow>
                      ) : rates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium">
                            No rates configured. Default (0) will be used.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rates.map((rate) => (
                          <TableRow key={rate.id} className="group hover:bg-emerald-50/20 transition-all border-b border-white/20 h-16">
                            <TableCell className="pl-8 font-black text-slate-900 italic tabular-nums">#{rate.batchNumber}</TableCell>
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
                                <span className="text-sm font-black text-slate-900 tracking-tighter tabular-nums">{rate.riderRateSingle} / {rate.riderRateDouble}</span>
                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">SAR Payout</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-emerald-600 tracking-tighter tabular-nums">{rate.companyRateSingle} / {rate.companyRateDouble}</span>
                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">SAR Revenue</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                              <div className="flex items-center justify-end gap-1 md:gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openEditor(rate)} className="hover:bg-blue-50 text-blue-600 h-9 w-9">
                                  <Edit2 size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRateDelete(rate.id)} className="hover:bg-red-50 text-red-500 h-9 w-9">
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Group Management Section */}
            <Card className="col-span-1 md:col-span-3 glass-card border-none shadow-2xl rounded-3xl overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/40 pb-6 p-6 md:p-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-sm">
                    <Users size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-1">Group Protocol</CardTitle>
                    <CardDescription className="text-xs font-medium text-slate-500 italic">Create specialized pilot teams with non-batch rates.</CardDescription>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setEditingGroup(null);
                    setGroupName('');
                    setGroupEditorOpen(true);
                  }} 
                  className="bg-slate-900 hover:bg-black text-white rounded-2xl px-6 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 h-10 md:h-12"
                >
                  <Plus size={16} /> 
                  <span>New Group</span>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 gap-0">
                  {groupsLoading ? (
                    <div className="h-40 flex items-center justify-center">
                      <Loader2 className="animate-spin text-slate-300" size={32} />
                    </div>
                  ) : groups.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-slate-400 font-medium italic">
                      No groups created. Standard batch rates will apply to all.
                    </div>
                  ) : (
                    groups.map((group) => (
                      <div key={group.id} className="p-6 md:p-8 border-b border-white/40 hover:bg-white/30 transition-all group">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black italic shadow-lg">
                               G
                             </div>
                             <div>
                                <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">{group.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                   <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border-blue-100">
                                      {group._count.riders} Pilots Assigned
                                   </Badge>
                                   <button 
                                    onClick={() => {
                                      setEditingGroup(group);
                                      setSelectedRiderIds(allRiders.filter(r => r.groupId === group.id).map(r => r.id));
                                      setRiderAssignmentOpen(true);
                                    }}
                                    className="text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 underline flex items-center gap-1"
                                   >
                                      Manage Fleet <ArrowRight size={10} />
                                   </button>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setEditingGroup(group);
                                setGroupName(group.name);
                                setGroupEditorOpen(true);
                              }}
                              className="rounded-xl border-slate-200 text-slate-500 font-black text-[10px] uppercase h-9"
                             >
                                Edit Name
                             </Button>
                             <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setEditingGroup(group);
                                setEditingRate(null);
                                setFormVehicle('BIKE');
                                setFormRateType('TARGET');
                                setFormRiderSingle('');
                                setFormRiderDouble('');
                                setFormCompanySingle('');
                                setFormCompanyDouble('');
                                setFormTargetCount('300');
                                setGroupRateEditorOpen(true);
                              }}
                              className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 font-black text-[10px] uppercase h-9"
                             >
                                <Plus size={14} className="mr-1" /> Add Rate
                             </Button>
                             <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleGroupDelete(group.id)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-9 w-9"
                             >
                                <Trash2 size={16} />
                             </Button>
                          </div>
                        </div>

                        {/* Group Rates Table */}
                        <div className="bg-white/50 rounded-2xl overflow-hidden border border-white/60">
                           <Table>
                              <TableHeader className="bg-slate-100/50">
                                <TableRow className="h-10 border-b border-white/60">
                                   <TableHead className="text-[9px] font-black uppercase tracking-widest pl-6">Vehicle</TableHead>
                                   <TableHead className="text-[9px] font-black uppercase tracking-widest">Type</TableHead>
                                   <TableHead className="text-[9px] font-black uppercase tracking-widest text-center">Rider Payout (S/D)</TableHead>
                                   <TableHead className="text-[9px] font-black uppercase tracking-widest text-center">Company Rev (S/D)</TableHead>
                                   <TableHead className="text-[9px] font-black uppercase tracking-widest text-right pr-6">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {group.rates.length === 0 ? (
                                   <TableRow>
                                      <TableCell colSpan={5} className="h-20 text-center text-[10px] font-medium text-slate-400 italic">
                                         No specialized rates defined for this group.
                                      </TableCell>
                                   </TableRow>
                                 ) : (
                                   group.rates.map((rate: any) => (
                                     <TableRow key={rate.id} className="h-14 border-b border-white/20 last:border-0 hover:bg-emerald-50/10 transition-all">
                                        <TableCell className="pl-6">
                                           <span className={cn(
                                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                              rate.vehicleType === 'CAR' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                                           )}>
                                              {rate.vehicleType === 'CAR' ? <Car size={10} /> : <Bike size={10} />}
                                              {rate.vehicleType}
                                           </span>
                                        </TableCell>
                                        <TableCell>
                                           <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest h-5 px-1.5 border-slate-200 text-slate-400">
                                              {rate.rateType}
                                           </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                           <span className="text-xs font-black text-slate-900 tracking-tighter tabular-nums">{rate.riderRateSingle} / {rate.riderRateDouble}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                           <span className="text-xs font-black text-emerald-600 tracking-tighter tabular-nums">{rate.companyRateSingle} / {rate.companyRateDouble}</span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                           <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleDeleteGroupRate(rate.id)}
                                            className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                           >
                                              <X size={14} />
                                           </Button>
                                        </TableCell>
                                     </TableRow>
                                   ))
                                 )}
                              </TableBody>
                           </Table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="organization" className="space-y-6">
          <Card className="border-slate-200 shadow-xl shadow-slate-200/20">
            <CardHeader className="border-b border-slate-50 pb-6">
              <div className="flex items-center gap-3 mb-1">
                <Building className="text-emerald-500" size={20} />
                <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-slate-900">Organization Profile</CardTitle>
              </div>
              <CardDescription>Manage your company details and localization settings.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {tenantLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="animate-spin text-slate-300" size={32} />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Company Name</Label>
                        <Input 
                          value={tenantSettings.name}
                          onChange={(e) => setTenantSettings({...tenantSettings, name: e.target.value})}
                          placeholder="e.g. Neqtra Logistics"
                          className="h-12 rounded-xl border-slate-200 font-bold focus:border-emerald-500/50 transition-all shadow-sm"
                        />
                      </div>
                      
                      <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-2">
                          <Globe size={14} className="text-blue-500" />
                          Currency & Localization
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-bold text-slate-500 ml-1">ISO Code</Label>
                            <Select 
                              value={tenantSettings.currency} 
                              onValueChange={(val) => setTenantSettings({...tenantSettings, currency: val || 'SAR'})}
                            >
                              <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 font-bold shadow-sm">
                                <SelectValue placeholder="Code" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                                <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                                <SelectItem value="KWD">KWD (Kuwaiti Dinar)</SelectItem>
                                <SelectItem value="BHD">BHD (Bahraini Dinar)</SelectItem>
                                <SelectItem value="OMR">OMR (Omani Rial)</SelectItem>
                                <SelectItem value="QAR">QAR (Qatari Riyal)</SelectItem>
                                <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                                <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-[9px] font-bold text-slate-500 ml-1">Display Symbol</Label>
                            <Input 
                              value={tenantSettings.currencySymbol}
                              onChange={(e) => setTenantSettings({...tenantSettings, currencySymbol: e.target.value})}
                              placeholder="e.g. SAR or $"
                              className="h-10 rounded-xl bg-white border-slate-200 font-bold shadow-sm text-center"
                            />
                          </div>
                        </div>
                        
                        <div className="pt-2">
                           <div className="flex items-center justify-between px-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Preview Format:</span>
                              <span className="text-sm font-black text-slate-900 italic tracking-tighter">
                                {tenantSettings.currencySymbol} 1,234.56
                              </span>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between text-white shadow-2xl shadow-slate-900/20">
                       <div className="absolute top-0 right-0 p-8 opacity-10">
                          <Building size={160} />
                       </div>
                       
                       <div className="relative z-10">
                          <Badge className="bg-emerald-500 text-slate-900 font-bold border-none mb-4">ACTIVE LICENSE</Badge>
                          <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-2">
                             {tenantSettings.name || 'Your Brand'}
                          </h3>
                          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mt-4">
                             <Globe size={14} className="text-emerald-500" />
                             Region: GCC / Middle East
                          </div>
                       </div>

                       <div className="relative z-10 pt-12">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Financial Settings</p>
                          <div className="flex items-center justify-between py-3 border-t border-white/5">
                             <span className="text-xs text-slate-400 font-bold">Base Currency</span>
                             <span className="text-sm font-black text-emerald-500">{tenantSettings.currency}</span>
                          </div>
                          <div className="flex items-center justify-between py-3 border-t border-white/5">
                             <span className="text-xs text-slate-400 font-bold">Rounding Mode</span>
                             <span className="text-sm font-black">2 Decimal Places</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex justify-end">
                    <Button 
                      onClick={handleTenantUpdate}
                      disabled={tenantSaving}
                      className="bg-slate-900 hover:bg-black text-white h-14 px-12 rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-slate-900/20 transition-all active:scale-95"
                    >
                      {tenantSaving ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" size={18} />
                          Saving...
                        </>
                      ) : (
                        "Save Organization Data"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users" className="space-y-6">
          <Card className="glass-card border-none shadow-2xl rounded-3xl overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/40 pb-6 p-6 md:p-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                  <UserPlus size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-1">Team Management</CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500 italic">Manage administrative access levels.</CardDescription>
                </div>
              </div>
              <Button onClick={() => openUserEditor()} className="bg-slate-900 hover:bg-black text-white h-10 md:h-12 rounded-2xl px-6 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-900/10">
                <Plus className="mr-2" size={16} /> 
                <span className="hidden sm:inline">Enroll Member</span>
                <span className="sm:hidden">Enroll</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
               {/* Mobile Personnel View */}
               <div className="block md:hidden">
                  {users.map((user) => (
                    <div key={user.id} className="p-5 border-b border-white/40 relative group hover:bg-emerald-50/20 transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center rounded-2xl font-black text-sm uppercase shadow-md shadow-emerald-200">
                              {user.name?.charAt(0) || 'U'}
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-sm font-black text-slate-900 tracking-tight">{user.name || 'Set Name'}</p>
                              <Badge variant="outline" className={cn(
                                "font-black text-[8px] tracking-widest uppercase px-2 py-0 border-2",
                                user.role === 'ADMIN' ? "bg-slate-900 text-white border-slate-900" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                              )}>
                                {user.role}
                              </Badge>
                           </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openUserEditor(user)} className="text-slate-400 hover:text-emerald-600 rounded-xl h-9 w-9">
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleUserDelete(user.id)} className="text-slate-400 hover:text-red-600 rounded-xl h-9 w-9">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Identity Access</p>
                      <p className="text-xs font-bold text-slate-600 truncate">{user.email}</p>
                    </div>
                  ))}
                  {!usersLoading && users.length === 0 && (
                    <div className="py-12 text-center text-slate-400 italic text-sm">No personnel entries found.</div>
                  )}
               </div>

               {/* Desktop Personnel Table */}
               <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-slate-900/5">
                    <TableRow className="border-b border-white/40">
                      <TableHead className="font-black text-[10px] uppercase text-slate-900 tracking-widest pl-8 h-12">NAME</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-slate-900 tracking-widest h-12">EMAIL</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-slate-900 tracking-widest h-12">ROLE</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-slate-900 tracking-widest text-right pr-8 h-12">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-40 text-center">
                          <Loader2 className="mx-auto animate-spin text-slate-300" size={32} />
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-40 text-center text-slate-400 font-medium">
                          No team members found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} className="group hover:bg-emerald-50/20 transition-all border-b border-white/20 h-16">
                          <TableCell className="pl-8">
                             <div className="flex items-center gap-3">
                                <div className="h-9 w-9 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center rounded-xl font-black text-xs uppercase shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
                                  {user.name?.charAt(0) || 'U'}
                                </div>
                                <span className="font-black text-slate-900 tracking-tight">{user.name || 'Set Name'}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-slate-500 font-bold text-xs">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              "font-black text-[9px] tracking-widest uppercase px-3 py-1 rounded-xl border-2",
                              user.role === 'ADMIN' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-emerald-700 border-emerald-100"
                            )}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <Button variant="ghost" size="icon" onClick={() => openUserEditor(user)} className="hover:bg-blue-50 text-blue-600 h-9 w-9">
                                  <Edit2 size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleUserDelete(user.id)} className="hover:bg-red-50 text-red-500 h-9 w-9">
                                  <Trash2 size={16} />
                                </Button>
                             </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <Card className="border-slate-200 shadow-xl shadow-slate-200/20 overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-slate-900">WhatsApp Hub</CardTitle>
                    <CardDescription className="text-xs">Automated payslip delivery system.</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setWaRefreshing(true); fetchWaStatus(); }}
                    disabled={waRefreshing}
                    className="rounded-xl border-2 font-bold text-[10px] flex-1 sm:flex-none h-10"
                    >
                    <RefreshCcw size={14} className={cn("mr-2", waRefreshing && "animate-spin")} />
                    REFRESH
                    </Button>
                    <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleWaReset}
                    disabled={waRefreshing}
                    className="rounded-xl border-2 border-rose-100 text-rose-600 hover:bg-rose-50 font-bold text-[10px] flex-1 sm:flex-none h-10"
                    >
                    <ShieldAlert size={14} className="mr-2" />
                    FORCE LOGOUT
                    </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               {waLoading && !waStatus ? (
                 <div className="h-64 flex items-center justify-center">
                    <Loader2 className="animate-spin text-slate-300" size={32} />
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-8 border-r border-slate-100 space-y-8">
                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Connection Status</p>
                          {waStatus?.ready ? (
                            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-6 flex items-center gap-4">
                               <div className="h-12 w-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                                  <CheckCircle2 size={24} />
                               </div>
                               <div>
                                  <p className="text-emerald-900 font-black text-lg leading-tight uppercase italic tracking-tighter">System is Online</p>
                                  <p className="text-emerald-600/70 text-sm font-medium">Auto-send is active and ready.</p>
                               </div>
                            </div>
                          ) : (
                            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-6 flex items-center gap-4">
                               <div className="h-12 w-12 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                                  <ShieldAlert size={24} />
                               </div>
                               <div>
                                  <p className="text-amber-900 font-black text-lg leading-tight uppercase italic tracking-tighter">Action Required</p>
                                  <p className="text-amber-600/70 text-sm font-medium">Device is not linked.</p>
                               </div>
                            </div>
                          )}
                       </div>

                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Configuration Details</p>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Engine</p>
                                <p className="text-sm font-bold text-slate-900 italic">ServerSide v2.0</p>
                             </div>
                             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Method</p>
                                <p className="text-sm font-bold text-slate-900 italic">Automated P2P</p>
                             </div>
                          </div>
                       </div>

                       <div className="pt-6">
                          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                             <Smartphone className="text-blue-500 shrink-0" size={20} />
                             <p className="text-xs text-blue-700 font-medium leading-relaxed">
                               Linking is persistent. Once scanned, the system will remain connected until you manually disconnect it from your phone’s "Linked Devices" settings.
                             </p>
                          </div>
                       </div>
                    </div>

                    <div className="p-8 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-6">
                       {waStatus?.ready ? (
                         <div className="space-y-4">
                            <div className="h-32 w-32 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                               <Smartphone size={48} className="text-emerald-600" />
                            </div>
                            <div>
                               <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Your Device is Linked</h4>
                               <p className="text-sm text-slate-500 font-medium max-w-[250px] mx-auto mt-2">The background server is securely connected to your WhatsApp instance.</p>
                            </div>
                         </div>
                       ) : waStatus?.qr ? (
                         <div className="space-y-6">
                            <div className="p-4 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border-2 border-slate-100">
                               <div className="p-2 bg-slate-900 rounded-2xl aspect-square flex items-center justify-center text-white overflow-hidden">
                                  {/* Using a QR library would be better, but we can use an external API for the QR string for now or a CSS approach */}
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(waStatus.qr)}&size=200x200&color=0-0-0&bgcolor=255-255-255&margin=10`}
                                    alt="WhatsApp QR"
                                    className="w-full h-full object-cover"
                                  />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter flex items-center justify-center gap-2">
                                  <QrCode className="text-emerald-500" />
                                  Scan to Authorize
                               </h4>
                               <ol className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose text-left max-w-[200px] mx-auto list-decimal pl-4">
                                  <li>Open WhatsApp on phone</li>
                                  <li>Go to Linked Devices</li>
                                  <li>Scan this QR Code</li>
                               </ol>
                            </div>
                         </div>
                       ) : (
                         <div className="space-y-4">
                            <div className="animate-bounce">
                               <Loader2 size={48} className={cn("mx-auto", 
                                 waStatus?.stage === 'STARTING' ? "text-blue-400 animate-spin" : 
                                 waStatus?.stage === 'FETCHING_SESSION' ? "text-emerald-400 animate-pulse" : "text-slate-300 animate-spin"
                               )} />
                            </div>
                            <div className="space-y-1">
                               <p className="text-sm font-black text-slate-700 uppercase italic tracking-tighter">
                                 {waStatus?.stage === 'STARTING' ? 'Booting Engine...' : 
                                  waStatus?.stage === 'FETCHING_SESSION' ? 'Synchronizing Session...' : 
                                  'Initializing Gateway...'}
                               </p>
                               <p className="text-[10px] font-medium text-slate-400 italic">
                                 {waStatus?.stage === 'STARTING' ? 'Launching background Chromium instance' : 
                                  waStatus?.stage === 'FETCHING_SESSION' ? 'Validating remote encryption keys' : 
                                  'Waiting for authentication server...'}
                               </p>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
               )}
            </CardContent>
          </Card>
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
              {formRateType === 'TARGET' && (
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Target Orders (Month)</Label>
                  <Input 
                    type="number" 
                    value={formTargetCount} 
                    onChange={(e) => setFormTargetCount(e.target.value)}
                    placeholder="e.g. 300"
                    className="rounded-xl h-12 border-slate-200 focus:border-emerald-500/50 transition-all font-bold"
                  />
                </div>
              )}
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

      {/* User Editor Dialog */}
      <Dialog open={userEditorOpen} onOpenChange={setUserEditorOpen}>
        <DialogContent className="sm:max-w-[450px] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-slate-900 text-white">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <User className="text-emerald-500" />
                </div>
                <div>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
                        {editingUser ? 'Update User' : 'Add Team Member'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Configure access level and identity.
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Full Name</Label>
              <Input 
                value={userForm.name} 
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                placeholder="Ex. John Doe"
                className="rounded-xl h-12 border-slate-200 focus:border-emerald-500/50 transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Email Address</Label>
              <Input 
                type="email"
                value={userForm.email} 
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                placeholder="john@example.com"
                className="rounded-xl h-12 border-slate-200 focus:border-emerald-500/50 transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">
                {editingUser ? 'New Password (Optional)' : 'Password'}
              </Label>
              <Input 
                type="password"
                value={userForm.password} 
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                placeholder="••••••••"
                className="rounded-xl h-12 border-slate-200 focus:border-emerald-500/50 transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Assigned Role</Label>
              <Select value={userForm.role} onValueChange={(val) => setUserForm({...userForm, role: val || 'ACCOUNTANT'})}>
                <SelectTrigger className="rounded-xl h-12 border-slate-200 font-black tracking-widest uppercase text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  <SelectItem value="ADMIN" className="font-bold flex items-center gap-2">
                    <ShieldAlert size={14} className="inline mr-2 text-red-500" /> ADMIN
                  </SelectItem>
                  <SelectItem value="ACCOUNTANT" className="font-bold flex items-center gap-2">
                    <UserCheck size={14} className="inline mr-2 text-emerald-500" /> ACCOUNTANT
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0">
            <Button 
                onClick={handleUserUpsert} 
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 h-14 rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-emerald-500/20"
                disabled={userEditorLoading}
            >
              {userEditorLoading ? <Loader2 className="animate-spin mr-2" /> : editingUser ? 'Apply Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Editor Dialog */}
      <Dialog open={groupEditorOpen} onOpenChange={setGroupEditorOpen}>
        <DialogContent className="sm:max-w-[450px] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-slate-900 text-white">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                    <UserPlus className="text-blue-500" />
                </div>
                <div>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
                        {editingGroup ? 'Rename Group' : 'Initialize Group'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Define a new specialized pilot segment.
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Group Identifier</Label>
              <Input 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex. Elite Fleet or Special Ops"
                className="rounded-xl h-12 border-slate-200 focus:border-blue-500/50 transition-all font-bold uppercase"
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-0">
            <Button 
                onClick={handleGroupUpsert} 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-14 rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-blue-500/20"
            >
              {editingGroup ? 'Update Protocol' : 'Deploy Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Rate Editor Dialog */}
      <Dialog open={groupRateEditorOpen} onOpenChange={setGroupRateEditorOpen}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-blue-600 text-white">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Calculator className="text-white" />
                </div>
                <div>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
                        Group Specialized Rate
                    </DialogTitle>
                    <DialogDescription className="text-blue-100">
                        Applying custom rates for group: <span className="font-black underline">{editingGroup?.name}</span>
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
              {formRateType === 'TARGET' && (
                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Target Orders (Month)</Label>
                  <Input 
                    type="number" 
                    value={formTargetCount} 
                    onChange={(e) => setFormTargetCount(e.target.value)}
                    placeholder="e.g. 300"
                    className="rounded-xl h-12 border-slate-200 focus:border-blue-500/50 transition-all font-bold"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Rider Payout (Cost)</p>
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

                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-4">Company Revenue</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-blue-700/60">Single Rate</Label>
                            <Input 
                                type="number" 
                                value={formCompanySingle} 
                                onChange={(e) => setFormCompanySingle(e.target.value)}
                                className="h-10 border-none bg-white shadow-sm font-bold text-center text-blue-600"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-blue-700/60">Double Rate</Label>
                            <Input 
                                type="number" 
                                value={formCompanyDouble} 
                                onChange={(e) => setFormCompanyDouble(e.target.value)}
                                className="h-10 border-none bg-white shadow-sm font-bold text-center text-blue-600"
                            />
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0">
            <Button 
                onClick={handleGroupRateUpsert} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-blue-500/10"
            >
              Authorize Group Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rider Assignment Dialog */}
      <Dialog open={riderAssignmentOpen} onOpenChange={setRiderAssignmentOpen}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-slate-900 text-white">
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">Manage Group Fleet</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">Assign or remove riders from <span className="text-emerald-500">{editingGroup?.name}</span></DialogDescription>
          </DialogHeader>
          
          <div className="p-8">
             <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                {allRiders.map((rider) => (
                  <div 
                    key={rider.id} 
                    onClick={() => {
                      if (selectedRiderIds.includes(rider.id)) {
                        setSelectedRiderIds(selectedRiderIds.filter(id => id !== rider.id));
                      } else {
                        setSelectedRiderIds([...selectedRiderIds, rider.id]);
                      }
                    }}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                      selectedRiderIds.includes(rider.id) 
                        ? "border-emerald-500 bg-emerald-50" 
                        : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                     <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs uppercase",
                          selectedRiderIds.includes(rider.id) ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                        )}>
                           {rider.riderName.charAt(0)}
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-900">{rider.riderName}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rider.riderId} • {rider.vehicleType}</p>
                        </div>
                     </div>
                     {selectedRiderIds.includes(rider.id) && <CheckCircle2 size={20} className="text-emerald-500" />}
                  </div>
                ))}
             </div>
          </div>

          <DialogFooter className="p-8 pt-0">
            <Button 
                onClick={handleRiderAssignment} 
                className="w-full bg-slate-900 hover:bg-black text-white h-14 rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl"
            >
              Save Fleet Assignments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="glass-card border-none shadow-xl p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden mt-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-black uppercase italic tracking-tight">Need infrastructure help?</h3>
            <p className="text-slate-400 max-w-xl">
              From WhatsApp API integration to custom security protocols, our engineering team can help harden your system environment.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <ShieldAlert size={14} className="text-amber-500" /> Security Audit
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Settings size={14} className="text-emerald-500" /> API Tuning
              </div>
            </div>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-slate-900 font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl transition-all">
            Consult Engineers <ArrowRight className="ml-2" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
