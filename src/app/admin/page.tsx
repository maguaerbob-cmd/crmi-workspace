
'use client';

import React from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Role, ROLE_LABELS, DEPARTMENTS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, Mail, Building2, UserCog, Trash2, Check, X, Briefcase } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

export default function AdminPage() {
  const { userData } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const isOwner = userData?.role === 'owner';
  const isGlobalManager = isOwner || userData?.role === 'director' || userData?.role === 'deputy_director';

  const usersQuery = useMemoFirebase(() => {
    if (!db || !userData) return null;
    const usersRef = collection(db, 'userProfiles');
    
    if (isGlobalManager) {
      return query(usersRef);
    } else {
      return query(usersRef, where('departmentId', '==', userData.departmentId));
    }
  }, [db, userData, isGlobalManager]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const handleRoleChange = (uid: string, newRole: Role) => {
    if (!db || !isOwner) return;
    updateDocumentNonBlocking(doc(db, 'userProfiles', uid), { role: newRole });
    toast({ 
      title: "РОЛЬ ОБНОВЛЕНА", 
      description: "ПРАВА ДОСТУПА ПОЛЬЗОВАТЕЛЯ БЫЛИ УСПЕШНО ИЗМЕНЕНЫ." 
    });
  };

  const handleDepartmentChange = (uid: string, newDeptId: string) => {
    if (!db || !isOwner) return;
    updateDocumentNonBlocking(doc(db, 'userProfiles', uid), { departmentId: newDeptId });
    toast({ 
      title: "ОТДЕЛ ОБНОВЛЕН", 
      description: "СОТРУДНИК УСПЕШНО ПЕРЕВЕДЕН В ДРУГОЙ ОТДЕЛ." 
    });
  };

  const handleApproval = (uid: string, approve: boolean) => {
    if (!db || !isOwner) return;
    if (approve) {
      updateDocumentNonBlocking(doc(db, 'userProfiles', uid), { isApproved: true });
      toast({ title: "ДОСТУП ПРЕДОСТАВЛЕН", description: "СОТРУДНИК ТЕПЕРЬ МОЖЕТ РАБОТАТЬ В СИСТЕМЕ." });
    } else {
      deleteDocumentNonBlocking(doc(db, 'userProfiles', uid));
      toast({ title: "ЗАЯВКА ОТКЛОНЕНА", description: "ПРОФИЛЬ БЫЛ УДАЛЕН ИЗ СПИСКА ОЖИДАНИЯ." });
    }
  };

  const handleDeleteUser = (uid: string) => {
    if (!db || !isOwner) return;
    deleteDocumentNonBlocking(doc(db, 'userProfiles', uid));
    toast({ 
      title: "СОТРУДНИК УДАЛЕН", 
      description: "ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ БЫЛ ИСКЛЮЧЕН ИЗ СИСТЕМЫ." 
    });
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

  // Фильтруем пользователей: исключаем Владельца (role: 'owner') из всех списков
  const pendingUsers = users?.filter(u => !u.isApproved && u.role !== 'owner') || [];
  const approvedUsers = users?.filter(u => u.isApproved && u.role !== 'owner') || [];

  return (
    <Layout title="Управление персоналом">
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Очередь на одобрение - доступна только Владельцу */}
        {isOwner && pendingUsers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-yellow-500 pl-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Заявки на регистрацию</h2>
              <span className="bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                {pendingUsers.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {pendingUsers.map(user => (
                <Card key={user.id} className="border-none shadow-sm bg-yellow-50/50 dark:bg-yellow-900/10 rounded-2xl overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10 border-2 border-background">
                        <AvatarImage src={user.photoURL} className="object-cover" />
                        <AvatarFallback className="bg-yellow-500 text-white font-black text-xs uppercase">
                          {user.name?.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xs font-black uppercase">{user.name}</h3>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{user.email} • {getDeptLabel(user.departmentId)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleApproval(user.id, true)}
                        className="h-8 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 gap-1.5 text-[9px] font-black uppercase tracking-wider"
                      >
                        <Check className="w-3.5 h-3.5" /> Одобрить
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleApproval(user.id, false)}
                        className="h-8 text-destructive hover:bg-destructive/10 rounded-lg px-3 gap-1.5 text-[9px] font-black uppercase tracking-wider"
                      >
                        <X className="w-3.5 h-3.5" /> Отклонить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Список сотрудников */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center shadow-lg">
                <UserCog className="w-5 h-5 text-background" />
              </div>
              <div>
                <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Сотрудники</h1>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {isGlobalManager ? 'Общий список организации' : `Отдел: ${getDeptLabel(userData?.departmentId || '')}`}
                </p>
              </div>
            </div>
            <div className="text-[10px] font-black text-background bg-foreground px-4 py-1.5 uppercase rounded-lg shadow-sm">
              Всего: {approvedUsers.length}
            </div>
          </div>

          {approvedUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {approvedUsers.map((user) => (
                <Card key={user.id} className="border-none shadow-sm hover:shadow-md transition-all bg-card rounded-2xl overflow-hidden relative group">
                  {/* Удаление доступно только Владельцу */}
                  {isOwner && (
                    <div className="absolute top-3 right-3 z-10">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl border-none shadow-2xl bg-card">
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
                              className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg border-none"
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
                          <AvatarImage src={user.photoURL} className="object-cover" />
                          <AvatarFallback className="bg-foreground text-background font-black text-xs uppercase">
                            {user.name?.substring(0, 2)}
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
                        {/* Смена отдела и роли доступна только Владельцу */}
                        {isOwner ? (
                          <>
                            <div className="flex-1 sm:flex-initial">
                              <Select 
                                value={user.departmentId} 
                                onValueChange={(v) => handleDepartmentChange(user.id, v)}
                              >
                                <SelectTrigger className="h-8 w-full sm:w-[120px] text-[9px] font-black uppercase tracking-wider bg-muted border-none rounded-lg">
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

                            <div className="flex-1 sm:flex-initial">
                              <Select 
                                value={user.role} 
                                onValueChange={(v) => handleRoleChange(user.id, v as Role)}
                              >
                                <SelectTrigger className="h-8 w-full sm:w-[110px] text-[9px] font-black uppercase tracking-wider bg-muted border-none rounded-lg">
                                  <SelectValue placeholder="Роль" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                                    // Владелец может назначать любую роль, кроме owner (так как он уже скрыт)
                                    role !== 'owner' && (
                                      <SelectItem key={role} value={role} className="text-[9px] font-black uppercase tracking-wider">
                                        {label}
                                      </SelectItem>
                                    )
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        ) : (
                          /* Отображение для Директоров и Зам. директоров (только текст) */
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                            <Badge variant="outline" className="h-7 text-[8px] font-black uppercase tracking-widest border-muted-foreground/30 text-muted-foreground whitespace-nowrap">
                              <Building2 className="w-2.5 h-2.5 mr-1.5 opacity-60" />
                              {getDeptLabel(user.departmentId)}
                            </Badge>
                            <Badge variant="secondary" className="h-7 text-[8px] font-black uppercase tracking-widest bg-foreground text-background border-none whitespace-nowrap">
                              <Briefcase className="w-2.5 h-2.5 mr-1.5 opacity-60" />
                              {ROLE_LABELS[user.role as Role]}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Список сотрудников пуст</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
