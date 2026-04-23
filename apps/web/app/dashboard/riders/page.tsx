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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
              <Users className="text-emerald-500" />
              Riders Directory
            </h2>
            <p className="text-sm text-slate-500 font-medium italic">Manage and enroll pilot profiles for neqtra logistics.</p>
          </div>
          
          <div className="flex gap-3">
            <Button 
                variant="outline"
                onClick={() => {
                    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/reports/riders/export`;
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
                className="border-2 border-slate-900 text-slate-900 rounded-2xl px-6 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 h-12"
            >
                Export List
            </Button>
            <Button onClick={openCreateModal} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl px-6 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center gap-3 group h-12">
                <Plus className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Enroll New Pilot
            </Button>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md border-none shadow-2xl p-0 overflow-hidden bg-white/80 backdrop-blur-xl">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{editingId ? "Edit Rider Details" : "Add New Rider"}</DialogTitle>
              <DialogDescription>
                {editingId 
                  ? "Update driver information. Changes immediately map to subsequent data evaluations." 
                  : "Create a new pilot identity manually."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Rider ID (e.g. R004)</Label>
                <Input 
                  value={newRiderId} 
                  onChange={e => setNewRiderId(e.target.value)} 
                  placeholder="Rider ID" 
                  disabled={!!editingId} 
                  className={editingId ? 'bg-slate-100 text-slate-500' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={newRiderName} onChange={e => setNewRiderName(e.target.value)} placeholder="Pilot Name" />
              </div>
              <div className="space-y-2">
                <Label>Company Code (Optional)</Label>
                <Input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="e.g. BLR-HUB" />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Select value={newVehicle} onValueChange={(v) => v && setNewVehicle(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BIKE">Bike</SelectItem>
                    <SelectItem value="CAR">Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rate Scheme</Label>
                <Select value={newRateType} onValueChange={(v) => v && setNewRateType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rate Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TARGET">Target Based</SelectItem>
                    <SelectItem value="NO_TARGET">No Target (Flat Rate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600 mt-2" onClick={handleSave}>
                {editingId ? "Save Changes" : "Confirm Rider"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      
      {/* Search, Filters and Stats Row */}
      <div className="flex flex-col md:flex-row gap-6 items-center glass-card p-4 rounded-2xl mb-8 premium-shadow">
        {/* Quick Stat */}
        <div className="flex items-center gap-4 pr-8 border-r border-slate-200/50 h-10 min-w-fit">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl emerald-glow">
            <Users className="text-emerald-600 animate-pulse" size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em] leading-none mb-1">Total Pilots</span>
            <span className="text-2xl font-black text-slate-900 leading-none">{riders.length}</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 w-full">
            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Search Crew</Label>
            <Input 
                placeholder="Search by Name or Rider ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-premium h-11 px-4"
            />
        </div>
        <div className="w-full md:w-44 space-y-2">
            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Vehicle Type</Label>
            <Select value={vehicleFilter} onValueChange={(v) => v && setVehicleFilter(v)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-9">
                    <SelectValue placeholder="All Vehicles" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Vehicles</SelectItem>
                    <SelectItem value="BIKE">Bikes Only</SelectItem>
                    <SelectItem value="CAR">Cars Only</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="w-full md:w-44 space-y-2">
            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Company</Label>
            <Select value={companyFilter} onValueChange={(v) => v && setCompanyFilter(v)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 h-9">
                    <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Companies</SelectItem>
                    {availableCompanies.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="pt-5">
          <Button variant="ghost" onClick={() => { setSearch(''); setVehicleFilter('ALL'); setCompanyFilter('ALL'); }} className="text-slate-500 font-bold hover:bg-slate-50 h-9 px-4">
              Reset
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden premium-shadow">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-900/5 hover:bg-slate-900/5 border-b border-slate-200/60">
              <TableHead className="font-black text-slate-900 text-center w-32 tracking-widest text-[10px] uppercase h-14">RIDER ID</TableHead>
              <TableHead className="font-black text-slate-900 tracking-widest text-[10px] uppercase h-14">PILOT NAME</TableHead>
              <TableHead className="font-black text-slate-900 text-center tracking-widest text-[10px] uppercase h-14">COMPANY</TableHead>
              <TableHead className="font-black text-slate-900 text-center tracking-widest text-[10px] uppercase h-14">VEHICLE</TableHead>
              <TableHead className="font-black text-slate-900 text-right tracking-widest text-[10px] uppercase h-14 px-8">ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riders.map((r) => (
              <TableRow key={r.id} className="group hover:bg-emerald-50/30 transition-all duration-300 h-16 border-b border-slate-100/60">
                <TableCell className="font-black text-slate-400 text-center tabular-nums">{r.riderId}</TableCell>
                <TableCell className="font-bold text-slate-900 tabular-nums tracking-tight">
                  {toTitleCase(r.riderName)}
                </TableCell>
                <TableCell className="text-center">
                  {r.companyCode ? (
                    <Badge variant="outline" className="font-black text-[10px] text-slate-500 border-slate-200 bg-white shadow-sm uppercase px-3 py-1">
                      <Building size={12} className="mr-1.5 text-slate-400" /> {r.companyCode}
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <Badge className={cn(
                      "font-black text-[10px] tracking-widest uppercase px-3 py-1 border-none shadow-sm",
                      r.vehicleType === 'BIKE' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {r.vehicleType}
                    </Badge>
                    <Badge variant="outline" className={cn(
                      "font-black text-[8px] tracking-[0.1em] uppercase px-2 py-0.5 border-slate-200 text-slate-400",
                      r.rateType === 'NO_TARGET' && "bg-slate-100 text-slate-600 border-slate-300"
                    )}>
                      {r.rateType === 'NO_TARGET' ? 'NO TARGET' : 'TARGET'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right px-8">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(r)} className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                      <Pencil size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id, r.riderName)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {riders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-20 italic font-medium">
                  No riders found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
