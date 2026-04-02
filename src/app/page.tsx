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
    // Показываем завершенные задачи только владельцу, остальные видят только активные
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
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input 
              placeholder="Поиск задач..." 
              className="pl-10 h-10 bg-white border-slate-200 shadow-sm rounded-lg focus-visible:ring-1 focus-visible:ring-slate-900/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
              {search ? 'Результаты' : 'Задачи отдела'}
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
              <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded-sm">{filteredTasks.length}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
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
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm border-dashed">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Filter className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold text-sm">Список пуст</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Нет подходящих задач</p>
          </div>
        )}
      </div>
    </Layout>
  );
}