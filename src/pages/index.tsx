import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { TaskCard } from '@/components/TaskCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function Dashboard() {
  const { userData } = useAuth();
  const db = useFirestore();
  const [search, setSearch] = useState('');

  const tasksQuery = useMemoFirebase(() => {
    if (!db || !userData) return null;
    const tasksRef = collection(db, 'tasks');
    
    // Owner, Media Center, Tech Center see all tasks
    const hasFullAccess = userData.role === 'owner' || 
                         userData.departmentId === 'media-center' || 
                         userData.departmentId === 'technical-service-center';
    
    if (hasFullAccess) {
      return query(tasksRef, orderBy('createdAt', 'desc'));
    } else {
      return query(tasksRef, where('departmentId', '==', userData.departmentId), orderBy('createdAt', 'desc'));
    }
  }, [db, userData]);

  const { data: rawTasks, isLoading } = useCollection(tasksQuery);

  const tasks = useMemo(() => {
    if (!rawTasks) return [];
    let filtered = rawTasks;
    // Hide completed tasks from non-owners
    if (userData?.role !== 'owner') {
      filtered = filtered.filter((t: any) => t.status !== 'завершено');
    }
    return filtered;
  }, [rawTasks, userData]);

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(search.toLowerCase()) || 
    task.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Задачи CRMI">
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map(task => (
            <TaskCard key={task.id} {...task} datetime={task.dateTime} />
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
