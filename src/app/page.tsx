'use client';

import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { TaskCard } from '@/components/TaskCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, FolderKanban } from 'lucide-react';
import { ALL_ACCESS_DEPARTMENTS } from '@/lib/constants';

export default function Dashboard() {
  const { userData } = useAuth();
  const db = useFirestore();
  const [search, setSearch] = useState('');

  const tasksQuery = useMemoFirebase(() => {
    if (!db || !userData || !userData.departmentId) return null;
    const tasksRef = collection(db, 'tasks');
    
    // Владельцы и сотрудники спец-отделов видят всё
    if (userData.role === 'owner' || ALL_ACCESS_DEPARTMENTS.includes(userData.departmentId)) {
      return query(tasksRef, orderBy('createdAt', 'desc'));
    } else {
      // Остальные видят только незавершенные задачи своего отдела
      return query(
        tasksRef, 
        where('departmentId', '==', userData.departmentId), 
        where('status', 'in', ['запланировано', 'в процессе']),
        orderBy('createdAt', 'desc')
      );
    }
  }, [db, userData]);

  const { data: tasks, isLoading } = useCollection(tasksQuery);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(task => 
      task.title.toLowerCase().includes(search.toLowerCase()) || 
      task.description?.toLowerCase().includes(search.toLowerCase()) ||
      task.place?.toLowerCase().includes(search.toLowerCase())
    );
  }, [tasks, search]);

  return (
    <Layout title="Задачи">
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Поиск по задачам..." 
              className="pl-9 h-10 bg-white border-slate-200 shadow-sm rounded-xl text-sm font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {search ? 'Результаты' : 'Актуальные задачи'}
            </h2>
            <div className="text-[10px] font-black text-slate-900 bg-slate-200/50 px-2 py-0.5 rounded uppercase">
              Всего: {filteredTasks.length}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTasks.map(task => {
              const canEdit = userData?.role === 'owner' || 
                             (userData?.role === 'head' && userData?.departmentId === task.departmentId) ||
                             userData?.id === task.responsibleUserId;
              
              return (
                <TaskCard 
                  key={task.id} 
                  {...task} 
                  datetime={task.dateTime} 
                  canEdit={canEdit}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-slate-100 border-dashed">
            <FolderKanban className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Пусто</p>
          </div>
        )}
      </div>
    </Layout>
  );
}