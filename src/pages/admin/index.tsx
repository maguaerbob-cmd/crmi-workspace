import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ROLES, Role, ROLE_LABELS, DEPARTMENTS } from '@/lib/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/router';

export default function AdminPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) return;
    if (userData.role !== 'owner' && userData.role !== 'head') {
      router.push('/');
      return;
    }

    let q;
    const usersRef = collection(db, 'users');
    
    if (userData.role === 'owner') {
      q = query(usersRef);
    } else {
      q = query(usersRef, where('department', '==', userData.department));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleRoleChange = async (uid: string, newRole: Role) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      toast({ title: "Роль обновлена", description: "Права пользователя изменены" });
    } catch (error) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось обновить роль" });
    }
  };

  const getAvailableRoles = (currentUserRole: string) => {
    if (currentUserRole === 'owner') return ROLES;
    return ["inspector", "reader"] as const;
  };

  return (
    <Layout title="Управление пользователями">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Сотрудники ({userData?.department || 'Все отделы'})</CardTitle>
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
                {users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{user.department}</Badge>
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
                          onValueChange={(v) => handleRoleChange(user.uid, v as Role)}
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