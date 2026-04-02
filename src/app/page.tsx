'use client';

import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { TaskCard } from '@/components/TaskCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, Filter, FolderKanban } from 'lucide-react';

export default function Dashboard() {
  const { userData } = useAuth();
  const db = useFirestore();
  const [search, setSearch] = useState('');

  const tasksQuery = useMemoFirebase(() => {
    if (!db || !userData || !userData.departmentId) return null;
    const tasksRef = collection(db, 'tasks');
    
    const hasFullAccess = userData.role === 'owner' || 
                         userData.departmentId === 'media-center' || 
                         userData.departmentId === 'technical-service-center';
    
    if (hasFullAccess) {
      return query(tasksRef, orderBy('createdAt', 'desc'));
    } else {
      // Для обычных пользователей ОБЯЗАТЕЛЬНО фильтруем по отделу для правил Firestore
      return query(tasksRef, where('departmentId', '==', userData.departmentId), orderBy('createdAt', 'desc'));
    }
  }, [db, userData]);

  const { data: rawTasks, isLoading } = useCollection(tasksQuery);

  const tasks = useMemo(() => {
    if (!rawTasks) return [];
    let filtered = rawTasks;
    // Скрываем завершенные задачи для всех, кроме владельца
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
    <Layout title="Задачи">
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Поиск по названию или описанию..." 
              className="pl-9 h-10 bg-white border-slate-200 shadow-sm rounded-lg text-sm font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
              {search ? 'Результаты поиска' : 'Список задач'}
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-900 bg-slate-200/50 px-2 py-0.5 rounded">
              <span>ВСЕГО: {filteredTasks.length}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-slate-100 border-dashed">
            <FolderKanban className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Нет активных задач</p>
          </div>
        )}
      </div>
    </Layout>
  );
}