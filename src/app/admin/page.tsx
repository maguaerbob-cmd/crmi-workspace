'use client';

import React from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { ROLES, Role, ROLE_LABELS, DEPARTMENTS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, Mail, Building2, UserCog, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  const handleDeleteUser = (uid: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'userProfiles', uid));
    toast({ 
      title: "СОТРУДНИК УДАЛЕН", 
      description: "ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ БЫЛ ИСКЛЮЧЕН ИЗ СИСТЕМЫ." 
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
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center shadow-lg">
              <UserCog className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Сотрудники</h1>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                {userData?.role === 'owner' ? 'Полный доступ ко всем отделам' : `Отдел: ${getDeptLabel(userData?.departmentId || '')}`}
              </p>
            </div>
          </div>
          <div className="text-[10px] font-black text-background bg-foreground px-4 py-1.5 uppercase rounded-lg shadow-sm">
            Всего: {users?.length || 0}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {users?.map((user) => (
            <Card key={user.id} className="border-none shadow-sm hover:shadow-md transition-all bg-card rounded-2xl overflow-hidden relative group">
              {userData?.role === 'owner' && userData?.id !== user.id && (
                <div className="absolute top-3 right-3 z-10">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-sm font-black uppercase tracking-tight">Удалить сотрудника?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
                          Профиль {user.name} будет навсегда исключен из системы. Это действие нельзя отменить.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-2">Отмена</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteUser(user.id)}
                          className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-destructive/20 border-none"
                        >
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border-2 border-background shadow-sm shrink-0">
                      <AvatarFallback className="bg-foreground text-background font-black text-xs">
                        {user.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col min-w-0 pr-10">
                      <h3 className="text-sm font-black text-foreground uppercase tracking-tight truncate">
                        {user.name}
                      </h3>
                      <div className="flex flex-col space-y-0.5 mt-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                          <Mail className="w-3 h-3 opacity-50" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                          <Building2 className="w-3 h-3 opacity-50" />
                          <span className="truncate">{getDeptLabel(user.departmentId)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-none border-border/50">
                    {userData?.role === 'owner' && (
                      <div className="flex-1 sm:flex-initial">
                        <Select 
                          value={user.departmentId} 
                          onValueChange={(v) => handleDepartmentChange(user.id, v)}
                        >
                          <SelectTrigger className="h-8 w-full sm:w-[140px] text-[9px] font-black uppercase tracking-wider bg-accent border-none rounded-lg focus:ring-primary/10">
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
                        <div className="flex items-center justify-center gap-2 text-[9px] font-black text-background px-4 bg-foreground rounded-lg shadow-sm uppercase tracking-widest h-8 sm:w-[110px]">
                          <Shield className="w-3 h-3" />
                          OWNER
                        </div>
                      ) : (
                        <Select 
                          value={user.role} 
                          onValueChange={(v) => handleRoleChange(user.id, v as Role)}
                          disabled={userData?.role !== 'owner' && user.role === 'head'}
                        >
                          <SelectTrigger className="h-8 w-full sm:w-[110px] text-[9px] font-black uppercase tracking-wider bg-accent border-none rounded-lg focus:ring-primary/10">
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
