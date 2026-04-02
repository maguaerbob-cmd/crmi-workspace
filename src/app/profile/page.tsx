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
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary to-secondary opacity-80" />
          <CardContent className="relative pt-0 px-6 pb-6">
            <div className="flex flex-col items-center -translate-y-12">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md mb-4">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {userData?.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold tracking-tight">{userData?.name}</h2>
              <div className="mt-2">
                <Badge variant="secondary" className="px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                  {ROLE_LABELS[userData?.role as Role] || 'Сотрудник'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-2">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Email</p>
                  <p className="text-sm font-medium">{userData?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Отдел</p>
                  <p className="text-sm font-medium">{currentDepartment?.label || userData?.departmentId}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Дата регистрации</p>
                  <p className="text-sm font-medium">
                    {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('ru-RU') : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              {userData?.role === 'owner' && (
                <Button variant="outline" className="w-full gap-2" onClick={() => router.push('/admin')}>
                  <ShieldCheck className="w-4 h-4" /> Панель администратора
                </Button>
              )}
              <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
                <LogOut className="w-4 h-4" /> Выйти из системы
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
