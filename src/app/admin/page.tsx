'use client';

import React from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { ROLES, Role, ROLE_LABELS, DEPARTMENTS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Shield, Mail, Building2 } from 'lucide-react';

export default function AdminPage() {
  const { userData } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => {
    if (!db || !userData) return null;
    const usersRef = collection(db, 'userProfiles');
    
    if (userData.role === 'owner') {
      return query(usersRef);
    } else {
      return query(usersRef, where('departmentId', '==', userData.departmentId));
    }
  }, [db, userData]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const handleRoleChange = (uid: string, newRole: Role) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'userProfiles', uid), { role: newRole });
    toast({ 
      title: "Роль обновлена", 
      description: "Права доступа пользователя были успешно изменены." 
    });
  };

  const handleDepartmentChange = (uid: string, newDeptId: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'userProfiles', uid), { departmentId: newDeptId });
    toast({ 
      title: "Отдел обновлен", 
      description: "Сотрудник успешно переведен в другой отдел." 
    });
  };

  const getAvailableRoles = (currentUserRole: string) => {
    if (currentUserRole === 'owner') return ROLES;
    return ["inspector", "reader"] as const;
  };

  const getDeptLabel = (id: string) => DEPARTMENTS.find(d => d.id === id)?.label || id;

  if (isLoading) return (
    <Layout title="Управление">
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Загрузка списка сотрудников...</p>
      </div>
    </Layout>
  );

  return (
    <Layout title="Управление доступом">
      <div className="space-y-6">
        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
          <CardHeader className="bg-slate-50/50 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">Сотрудники</CardTitle>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {userData?.role === 'owner' ? 'Полный доступ ко всем отделам' : `Управление отделом: ${getDeptLabel(userData?.departmentId || '')}`}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {users?.map((user) => (
                <div key={user.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-6 gap-6 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 border-4 border-white shadow-sm shrink-0">
                      <AvatarFallback className="bg-slate-900 text-white font-black text-xs">
                        {user.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col space-y-1.5">
                      <h3 className="text-sm font-black text-slate-900 leading-none uppercase tracking-tight">{user.name}</h3>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <Building2 className="w-3 h-3 text-slate-300" />
                          <span className="uppercase tracking-tighter">{getDeptLabel(user.departmentId)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Контейнер с селекторами в один ряд */}
                  <div className="flex flex-wrap items-end gap-2 pt-4 lg:pt-0 border-t lg:border-none border-slate-50">
                    {userData?.role === 'owner' && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">Отдел</span>
                        <Select 
                          value={user.departmentId} 
                          onValueChange={(v) => handleDepartmentChange(user.id, v)}
                        >
                          <SelectTrigger className="h-8 w-[140px] text-[9px] font-black uppercase tracking-widest shadow-sm bg-slate-50 border-none focus:ring-1 focus:ring-slate-900/10 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            {DEPARTMENTS.map(dept => (
                              <SelectItem key={dept.id} value={dept.id} className="text-[9px] font-black uppercase tracking-widest">
                                {dept.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">Роль</span>
                      {user.role === 'owner' ? (
                        <div className="flex items-center gap-2 text-[9px] font-black text-white px-3 bg-slate-900 rounded-lg shadow-sm uppercase tracking-widest h-8">
                          <Shield className="w-2.5 h-2.5" />
                          OWNER
                        </div>
                      ) : (
                        <Select 
                          value={user.role} 
                          onValueChange={(v) => handleRoleChange(user.id, v as Role)}
                          disabled={userData?.role !== 'owner' && user.role === 'head'}
                        >
                          <SelectTrigger className="h-8 w-[100px] text-[9px] font-black uppercase tracking-widest shadow-sm bg-slate-50 border-none focus:ring-1 focus:ring-slate-900/10 rounded-lg">
                            <SelectValue placeholder="Роль" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            {getAvailableRoles(userData?.role || '').map(role => (
                              <SelectItem key={role} value={role} className="text-[9px] font-black uppercase tracking-widest">
                                {ROLE_LABELS[role as Role]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
