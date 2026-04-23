"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Trash2, Plus, Pencil, Building } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDate, toTitleCase } from '@/lib/format';

interface Rider {
  id: string;
  riderId: string;
  riderName: string;
  vehicleType: string;
  rateType: string;
  companyCode?: string;
  createdAt: string;
}

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering States
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRiderId, setNewRiderId] = useState('');
  const [newRiderName, setNewRiderName] = useState('');
  const [newVehicle, setNewVehicle] = useState('BIKE');
  const [newRateType, setNewRateType] = useState('TARGET');
  const [newCompany, setNewCompany] = useState('');

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (vehicleFilter !== 'ALL') params.append('vehicleType', vehicleFilter);
      if (companyFilter !== 'ALL') params.append('companyCode', companyFilter);

      const res = await api.get(`/riders?${params.toString()}`);
      setRiders(res.data);
      
      // Update available companies filter list if we don't have filters active 
      // This is a simple way to populate the dropdown without a separate endpoint
      if (search === '' && vehicleFilter === 'ALL' && companyFilter === 'ALL') {
         const companies = Array.from(new Set(res.data.map((r: Rider) => r.companyCode).filter(Boolean))) as string[];
         setAvailableCompanies(companies);
      }
    } catch (error) {
      toast.error('Failed to fetch riders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchRiders();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, vehicleFilter, companyFilter]);

  const openCreateModal = () => {
    setEditingId(null);
    setNewRiderId('');
    setNewRiderName('');
    setNewCompany('');
    setNewVehicle('BIKE');
    setNewRateType('TARGET');
    setOpen(true);
  };

  const openEditModal = (rider: Rider) => {
    setEditingId(rider.id);
    setNewRiderId(rider.riderId);
    setNewRiderName(rider.riderName);
    setNewCompany(rider.companyCode || '');
    setNewVehicle(rider.vehicleType);
    setNewRateType(rider.rateType || 'TARGET');
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!newRiderId || !newRiderName) return toast.error("Please fill in required details");
      
      const payload = {
        rider_id: newRiderId,
        rider_name: newRiderName,
        vehicle_type: newVehicle,
        rate_type: newRateType,
        company_code: newCompany
      };

      if (editingId) {
        await api.patch(`/riders/${editingId}`, payload);
        toast.success('Rider details updated successfully!');
      } else {
        await api.post('/riders', payload);
        toast.success('Rider created successfully!');
      }
      
      setOpen(false);
      fetchRiders();
    } catch(err) {
      toast.error(editingId ? 'Failed to update rider.' : 'Failed to create rider. ID might already exist.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${name} and all associated entries?`)) return;
    try {
      await api.delete(`/riders/${id}`);
      toast.success('Rider deleted securely.');
      fetchRiders();
    } catch (err) {
      toast.error('Failed to delete rider.');
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
              <Users className="text-emerald-500 scale-110" />
              Pilot Directory
            </h2>
            <p className="text-[10px] md:text-sm text-slate-500 font-bold uppercase tracking-wider italic pl-1">Operational registry for neqtra logistics fleet.</p>
          </div>
          
          <div className="grid grid-cols-2 lg:flex gap-3 w-full md:w-auto">
            <Button 
                variant="outline"
                onClick={() => {
                    const url = `/api/reports/riders/export`;
                    const token = localStorage.getItem('token');
                    fetch(url, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    .then(res => res.blob())
                    .then(blob => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `riders_directory.csv`;
                        a.click();
                    });
                }}
                className="border-2 border-slate-900 text-slate-900 rounded-xl px-4 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 h-11"
            >
                Export List
            </Button>
            <Button onClick={openCreateModal} className="bg-slate-900 text-white rounded-xl px-4 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2 group h-11">
                <Plus className="group-hover:rotate-90 transition-transform duration-300" size={16} />
                Enroll New
            </Button>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl rounded-3xl">
            <DialogHeader className="p-8 pb-4 bg-slate-900 text-white">
              <DialogTitle className="text-xl font-black uppercase italic tracking-widest leading-none">
                {editingId ? "Update Pilot Profile" : "Enroll New Pilot"}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2">
                Operational parameters for logistics management.
              </DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Rider ID (Permanent)</Label>
                <Input 
                  value={newRiderId} 
                  onChange={e => setNewRiderId(e.target.value)} 
                  placeholder="e.g. R604" 
                  disabled={!!editingId} 
                  className={cn("h-11 rounded-xl", editingId ? 'bg-slate-50 border-slate-100 text-slate-400 font-bold' : 'input-premium')}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Full Legal Name</Label>
                <Input value={newRiderName} onChange={e => setNewRiderName(e.target.value)} placeholder="Pilot Name" className="h-11 rounded-xl input-premium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Vehicle Type</Label>
                  <Select value={newVehicle} onValueChange={(v) => v && setNewVehicle(v)}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold">
                      <SelectValue placeholder="Vehicle" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="BIKE" className="font-bold">Bike</SelectItem>
                      <SelectItem value="CAR" className="font-bold">Car</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Rate Scheme</Label>
                  <Select value={newRateType} onValueChange={(v) => v && setNewRateType(v)}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold">
                      <SelectValue placeholder="Rate Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="TARGET" className="font-bold">Target</SelectItem>
                      <SelectItem value="NO_TARGET" className="font-bold">Flat Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Company Code (Optional)</Label>
                <Input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="e.g. BLR-HUB" className="h-11 rounded-xl input-premium" />
              </div>
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black uppercase tracking-[0.2em] h-12 rounded-xl mt-4 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all" onClick={handleSave}>
                {editingId ? "Update Identity" : "Authorize Pilot"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      
      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end glass-card p-4 md:p-6 rounded-2xl mb-8 premium-shadow">
        <div className="md:col-span-3 flex items-center gap-4 mb-4 md:mb-0 pr-0 md:pr-6 md:border-r border-slate-200/50">
          <div className="p-3 bg-emerald-500/10 rounded-2xl emerald-glow border border-emerald-500/20 text-emerald-600">
            <Users size={24} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Registered Fleet</span>
            <span className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tighter">{riders.length} Pilots</span>
          </div>
        </div>

        <div className="md:col-span-4 space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Fleet Search</Label>
            <div className="relative">
              <Input 
                  placeholder="ID or Name..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-premium h-11 px-4 rounded-xl"
              />
            </div>
        </div>
        
        <div className="md:col-span-2 space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Vehicle</Label>
            <Select value={vehicleFilter} onValueChange={(v) => v && setVehicleFilter(v)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-11 font-bold rounded-xl">
                    <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="ALL" className="font-bold">All Types</SelectItem>
                    <SelectItem value="BIKE" className="font-bold">Bikes</SelectItem>
                    <SelectItem value="CAR" className="font-bold">Cars</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="md:col-span-3 flex gap-2">
           <div className="flex-1 space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Hub/Company</Label>
              <Select value={companyFilter} onValueChange={(v) => v && setCompanyFilter(v)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 h-11 font-bold rounded-xl">
                      <SelectValue placeholder="All Hubs" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                      <SelectItem value="ALL" className="font-bold">All Hubs</SelectItem>
                      {availableCompanies.map(c => (
                          <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
           </div>
           <Button variant="ghost" onClick={() => { setSearch(''); setVehicleFilter('ALL'); setCompanyFilter('ALL'); }} className="h-11 px-3 text-slate-400 hover:text-slate-900 mt-auto hover:bg-slate-50 transition-colors">
              <Trash2 size={16} />
           </Button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden premium-shadow border border-white/60">
        <div className="overflow-x-auto scrollbar-hide">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-slate-900/5 hover:bg-slate-900/5 border-b border-slate-200/60 h-14">
                <TableHead className="font-black text-slate-950 text-center w-32 tracking-[0.2em] text-[10px] uppercase italic">RIDER ID</TableHead>
                <TableHead className="font-black text-slate-950 tracking-[0.2em] text-[10px] uppercase italic">PILOT IDENTITY</TableHead>
                <TableHead className="font-black text-slate-950 text-center tracking-[0.2em] text-[10px] uppercase italic">OPERATIONAL HUB</TableHead>
                <TableHead className="font-black text-slate-950 text-center tracking-[0.2em] text-[10px] uppercase italic">FLEET TYPE</TableHead>
                <TableHead className="font-black text-slate-950 text-right tracking-[0.2em] text-[10px] uppercase italic px-10">CONTROLS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riders.map((r) => (
                <TableRow key={r.id} className="group hover:bg-emerald-50/40 transition-all duration-300 h-16 border-b border-slate-100/60">
                  <TableCell className="font-black text-slate-400 text-center tabular-nums">{r.riderId}</TableCell>
                  <TableCell className="font-bold text-slate-950 tabular-nums tracking-tight">
                    {toTitleCase(r.riderName)}
                  </TableCell>
                  <TableCell className="text-center">
                    {r.companyCode ? (
                      <Badge variant="outline" className="font-black text-[10px] text-slate-500 border-slate-200 bg-white/80 shadow-sm uppercase px-3 py-1 rounded-lg">
                        <Building size={10} className="mr-1.5 text-slate-400" /> {r.companyCode}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-30">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge className={cn(
                        "font-black text-[9px] tracking-widest uppercase px-3 py-0.5 border-none shadow-sm rounded-md",
                        r.vehicleType === 'BIKE' ? "bg-amber-500 text-slate-900" : "bg-blue-500 text-white"
                      )}>
                        {r.vehicleType}
                      </Badge>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                        {r.rateType === 'NO_TARGET' ? 'Flat-Rate' : 'Goal-Based'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-10">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(r)} className="h-9 w-9 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100 shadow-sm hover:shadow-md">
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id, r.riderName)} className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm hover:shadow-md">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {riders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-24 italic font-bold uppercase tracking-[0.2em] opacity-50">
                    Search criteria returned zero pilots.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
