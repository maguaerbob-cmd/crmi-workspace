'use client';

import React from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { ROLES, Role, ROLE_LABELS, DEPARTMENTS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Shield, Mail, Building2, UserCog } from 'lucide-react';

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
      title: "РОЛЬ ОБНОВЛЕНА", 
      description: "ПРАВА ДОСТУПА ПОЛЬЗОВАТЕЛЯ БЫЛИ УСПЕШНО ИЗМЕНЕНЫ." 
    });
  };

  const handleDepartmentChange = (uid: string, newDeptId: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'userProfiles', uid), { departmentId: newDeptId });
    toast({ 
      title: "ОТДЕЛ ОБНОВЛЕН", 
      description: "СОТРУДНИК УСПЕШНО ПЕРЕВЕДЕН В ДРУГОЙ ОТДЕЛ." 
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
        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Загрузка списка сотрудников...</p>
      </div>
    </Layout>
  );

  return (
    <Layout title="Управление персоналом">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center shadow-lg">
              <UserCog className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Сотрудники</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {userData?.role === 'owner' ? 'Полный доступ ко всем отделам' : `Отдел: ${getDeptLabel(userData?.departmentId || '')}`}
              </p>
            </div>
          </div>
          <div className="text-[10px] font-black text-white bg-slate-950 px-4 py-1.5 uppercase rounded-lg shadow-sm">
            Всего: {users?.length || 0}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {users?.map((user) => (
            <Card key={user.id} className="border-none shadow-sm hover:shadow-md transition-all bg-white rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Левая часть: Иконка и информация */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border-2 border-slate-50 shadow-sm shrink-0">
                      <AvatarFallback className="bg-slate-950 text-white font-black text-xs">
                        {user.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                        {user.name}
                      </h3>
                      <div className="flex flex-col space-y-0.5 mt-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          <Mail className="w-3 h-3 text-slate-300" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          <Building2 className="w-3 h-3 text-slate-300" />
                          <span className="truncate">{getDeptLabel(user.departmentId)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Правая часть: Кнопки выбора */}
                  <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-none border-slate-50">
                    {userData?.role === 'owner' && (
                      <div className="flex-1 sm:flex-initial">
                        <Select 
                          value={user.departmentId} 
                          onValueChange={(v) => handleDepartmentChange(user.id, v)}
                        >
                          <SelectTrigger className="h-9 w-full sm:w-[160px] text-[9px] font-black uppercase tracking-wider bg-slate-50 border-none rounded-xl focus:ring-slate-900/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            {DEPARTMENTS.map(dept => (
                              <SelectItem key={dept.id} value={dept.id} className="text-[9px] font-black uppercase tracking-wider">
                                {dept.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex-1 sm:flex-initial">
                      {user.role === 'owner' ? (
                        <div className="flex items-center justify-center gap-2 text-[9px] font-black text-white px-4 bg-slate-950 rounded-xl shadow-sm uppercase tracking-widest h-9 sm:w-[130px]">
                          <Shield className="w-3 h-3" />
                          OWNER
                        </div>
                      ) : (
                        <Select 
                          value={user.role} 
                          onValueChange={(v) => handleRoleChange(user.id, v as Role)}
                          disabled={userData?.role !== 'owner' && user.role === 'head'}
                        >
                          <SelectTrigger className="h-9 w-full sm:w-[130px] text-[9px] font-black uppercase tracking-wider bg-slate-50 border-none rounded-xl focus:ring-slate-900/10">
                            <SelectValue placeholder="Роль" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            {getAvailableRoles(userData?.role || '').map(role => (
                              <SelectItem key={role} value={role} className="text-[9px] font-black uppercase tracking-wider">
                                {ROLE_LABELS[role as Role]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
