'use client';

import React from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useAuth as useFirebaseCore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, Building, ShieldCheck, Mail, Calendar } from 'lucide-react';
import { DEPARTMENTS, ROLE_LABELS, Role } from '@/lib/constants';

export default function ProfilePage() {
  const { userData } = useAuth();
  const auth = useFirebaseCore();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const currentDepartment = DEPARTMENTS.find(d => d.id === userData?.departmentId);

  return (
    <Layout title="Профиль">
      <div className="max-w-xl mx-auto space-y-6">
        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
          {/* Компактная шапка с логотипом вместо большой заливки */}
          <div className="h-20 bg-slate-50 border-b border-slate-100 flex items-center justify-center">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black shadow-sm">
              C
            </div>
          </div>
          
          <CardContent className="pt-8 px-6 pb-8">
            <div className="flex flex-col items-center mb-8">
              <Avatar className="h-24 w-24 mb-4 shadow-sm border-4 border-white">
                <AvatarFallback className="bg-slate-900 text-white text-2xl font-black">
                  {userData?.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                {userData?.name}
              </h2>
              <div className="mt-2">
                <Badge variant="secondary" className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] bg-slate-100 text-slate-600 border-none">
                  {ROLE_LABELS[userData?.role as Role] || 'Сотрудник'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Email</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{userData?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Building className="w-5 h-5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Отдел</p>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {currentDepartment?.label || userData?.departmentId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Регистрация</p>
                  <p className="text-sm font-bold text-slate-900">
                    {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('ru-RU') : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3">
              {userData?.role === 'owner' && (
                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 hover:bg-slate-50"
                  onClick={() => router.push('/admin')}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" /> Панель управления
                </Button>
              )}
              <Button 
                variant="destructive" 
                className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" /> Выйти из системы
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
