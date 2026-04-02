'use client';

import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { TaskCard } from '@/components/TaskCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

export default function Dashboard() {
  const { userData } = useAuth();
  const db = useFirestore();
  const [search, setSearch] = useState('');

  const tasksQuery = useMemoFirebase(() => {
    if (!db || !userData) return null;
    const tasksRef = collection(db, 'tasks');
    
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
    if (userData?.role !== 'owner') {
      filtered = filtered.filter((t: any) => t.status !== 'завершено');
    }
    return filtered;
  }, [rawTasks, userData]);

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(search.toLowerCase()) || 
    task.description?.toLowerCase().includes(search.toLowerCase()) ||
    task.place?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Список задач">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Поиск по названию или месту..." 
              className="pl-10 h-12 bg-white border-none shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {search ? 'Результаты поиска' : 'Активные задачи'}
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-white px-2 py-1 rounded-full shadow-sm">
              <span>ВСЕГО:</span>
              <span className="text-primary">{filteredTasks.length}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map(task => (
              <TaskCard key={task.id} {...task} datetime={task.dateTime} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-dashed">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">Задачи не найдены</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
