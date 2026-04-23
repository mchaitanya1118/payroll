"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    tenantName: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', formData);
      setAuth(data.user, data.token);
      toast.success('Business registered successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
      
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Neqtra <span className="text-emerald-500">Business</span>
          </CardTitle>
          <CardDescription className="text-slate-400">
            Create a new business account for your payroll
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenantName" className="text-slate-300">Business Name</Label>
                <Input
                  id="tenantName"
                  placeholder="Acme Inc."
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  required
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Admin Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="Password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-6 text-lg transition-all active:scale-95"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'CREATE ACCOUNT'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <button 
              onClick={() => router.push('/login')}
              className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
            >
              Already have an account? Sign in
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
