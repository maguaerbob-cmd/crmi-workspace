import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TaskCard } from '@/components/TaskCard';
import { ALL_ACCESS_DEPARTMENTS, DEPARTMENTS } from '@/lib/constants';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function Dashboard() {
  const { userData } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!userData) return;

    let q;
    const tasksRef = collection(db, 'tasks');
    
    // Rule: Owner, Media Center, Tech Center see all tasks
    const hasFullAccess = userData.role === 'owner' || ALL_ACCESS_DEPARTMENTS.includes(userData.department);
    
    if (hasFullAccess) {
      q = query(tasksRef, orderBy('createdAt', 'desc'));
    } else {
      q = query(tasksRef, where('department', '==', userData.department), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let filteredTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Hide completed tasks from non-owners
      if (userData.role !== 'owner') {
        filteredTasks = filteredTasks.filter((t: any) => t.status !== 'завершено');
      }

      setTasks(filteredTasks);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(search.toLowerCase()) || 
    task.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Мои Задачи">
      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-start md:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск задач..." 
            className="pl-9 h-11 bg-white border-none shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 text-sm font-medium">
          <span className="text-muted-foreground">Всего:</span>
          <span>{filteredTasks.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map(task => (
            <TaskCard key={task.id} {...task} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <p className="text-muted-foreground">Задач пока нет</p>
        </div>
      )}
    </Layout>
  );
}