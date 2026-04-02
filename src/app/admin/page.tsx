'use client';

import React from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { ROLES, Role, ROLE_LABELS, DEPARTMENTS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
      title: "Роль обновлена", 
      description: "Права доступа пользователя были успешно изменены." 
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
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-primary/5 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Сотрудники</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {userData?.role === 'owner' ? 'Полный доступ ко всем отделам' : `Управление отделом: ${getDeptLabel(userData?.departmentId || '')}`}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {users?.map((user) => (
                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {user.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col space-y-1">
                      <h3 className="text-sm font-bold text-foreground leading-none">{user.name}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Building2 className="w-3 h-3 text-primary/60" />
                        <span>{getDeptLabel(user.departmentId)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 sm:gap-4">
                    {user.role === 'owner' ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-primary px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/20">
                        <Shield className="w-3 h-3" />
                        OWNER
                      </div>
                    ) : (
                      <Select 
                        value={user.role} 
                        onValueChange={(v) => handleRoleChange(user.id, v as Role)}
                        disabled={userData?.role !== 'owner' && user.role === 'head'}
                      >
                        <SelectTrigger className="h-9 w-[160px] text-xs shadow-sm bg-white border-none focus:ring-1 focus:ring-primary/20">
                          <SelectValue placeholder="Сменить роль" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableRoles(userData?.role || '').map(role => (
                            <SelectItem key={role} value={role} className="text-xs">
                              {ROLE_LABELS[role as Role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
