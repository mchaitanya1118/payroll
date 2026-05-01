"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { User, Phone, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';

export default function RiderPortalLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    riderId: '',
    phoneNumber: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/rider-portal/login', formData);
      localStorage.setItem('rider_token', res.data.access_token);
      localStorage.setItem('rider_data', JSON.stringify(res.data.rider));
      toast.success(`Welcome back, ${res.data.rider.name}`);
      router.push('/portal');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 pt-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 mb-12"
      >
        <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6">
           <ShieldCheck className="text-white" size={32} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
          Rider <span className="text-emerald-500">Portal.</span>
        </h1>
        <p className="text-slate-400 font-medium tracking-tight">Access your earnings and performance data instantly.</p>
      </motion.div>

      <form onSubmit={handleLogin} className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Rider Identifier</Label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <Input 
              placeholder="e.g. R-1001" 
              className="h-14 pl-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
              value={formData.riderId}
              onChange={(e) => setFormData({...formData, riderId: e.target.value})}
              required
            />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Registered Phone</Label>
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <Input 
              placeholder="Enter your phone number..." 
              className="h-14 pl-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              required
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-16 rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] italic text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {loading ? 'Authenticating...' : 'Sign In To Portal'}
            {!loading && <ArrowRight size={18} />}
          </Button>
        </motion.div>
      </form>

      <div className="mt-auto pt-10 text-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest leading-loose">
            Enterprise Grade Security &bull; Powered by Neqtra<br/>
            Contact supervisor if login fails.
         </p>
      </div>
    </div>
  );
}
