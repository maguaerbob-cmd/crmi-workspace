import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { ROLES, Role, ROLE_LABELS } from '@/lib/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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
    toast({ title: "Роль обновлена", description: "Права пользователя изменены" });
  };

  const getAvailableRoles = (currentUserRole: string) => {
    if (currentUserRole === 'owner') return ROLES;
    return ["inspector", "reader"] as const;
  };

  if (isLoading) return <Layout><div className="flex justify-center py-20">Загрузка...</div></Layout>;

  return (
    <Layout title="Управление пользователями">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Сотрудники ({userData?.departmentId || 'Все отделы'})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Отдел</TableHead>
                  <TableHead>Текущая роль</TableHead>
                  <TableHead>Изменить роль</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{user.departmentId}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase font-bold">
                        {ROLE_LABELS[user.role as Role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role === 'owner' ? (
                        <span className="text-xs text-muted-foreground italic">Владелец (неизменяемо)</span>
                      ) : (
                        <Select 
                          value={user.role} 
                          onValueChange={(v) => handleRoleChange(user.id, v as Role)}
                          disabled={userData?.role !== 'owner' && user.role === 'head'}
                        >
                          <SelectTrigger className="h-8 w-[180px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableRoles(userData?.role || '').map(role => (
                              <SelectItem key={role} value={role}>{ROLE_LABELS[role as Role]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
