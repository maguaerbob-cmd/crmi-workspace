'use client';

import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { TaskCard } from '@/components/TaskCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, FolderKanban, Filter } from 'lucide-react';

export default function Dashboard() {
  const { userData } = useAuth();
  const db = useFirestore();
  const [search, setSearch] = useState('');

  const tasksQuery = useMemoFirebase(() => {
    if (!db || !userData) return null;
    const tasksRef = collection(db, 'tasks');
    
    // Теперь все видят все задачи, отсортированные по дате создания
    return query(tasksRef, orderBy('createdAt', 'desc'));
  }, [db, userData]);

  const { data: tasks, isLoading } = useCollection(tasksQuery);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    const lowerSearch = search.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(lowerSearch) || 
      task.description?.toLowerCase().includes(lowerSearch) ||
      task.place?.toLowerCase().includes(lowerSearch)
    );
  }, [tasks, search]);

  return (
    <Layout title="Задачи">
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="flex flex-col gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input 
              placeholder="Поиск по задачам организации..." 
              className="pl-9 h-11 bg-white border-slate-200 shadow-sm rounded-xl text-sm font-bold border-2 focus:border-slate-900 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-slate-400" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {search ? 'Результаты поиска' : 'Общий список задач'}
              </h2>
            </div>
            <div className="text-[10px] font-black text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg uppercase shadow-sm">
              Всего: {filteredTasks.length}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl border border-slate-100" />
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
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border-2 border-slate-100 border-dashed shadow-inner">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-300 font-black text-[10px] uppercase tracking-[0.4em]">Задач не найдено</p>
          </div>
        )}
      </div>
    </Layout>
  );
}