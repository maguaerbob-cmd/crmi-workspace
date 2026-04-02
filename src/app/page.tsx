
'use client';

import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { TaskCard } from '@/components/TaskCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FolderKanban, Filter, Building2, Clock } from 'lucide-react';
import { DEPARTMENTS, ALL_ACCESS_DEPARTMENTS } from '@/lib/constants';

export default function Dashboard() {
  const { userData, user } = useAuth();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  const isGlobalManager = useMemo(() => {
    if (!userData) return false;
    const role = userData.role;
    const deptId = userData.departmentId;
    return (
      role === 'owner' || 
      role === 'director' || 
      role === 'deputy_director' || 
      (deptId && ALL_ACCESS_DEPARTMENTS.includes(deptId as any))
    );
  }, [userData]);

  const tasksQuery = useMemoFirebase(() => {
    if (!db) return null;
    const tasksRef = collection(db, 'tasks');
    
    // Если пользователь не авторизован или является глобальным админом - показываем всё
    if (!user || isGlobalManager) {
      return query(tasksRef, orderBy('createdAt', 'desc'));
    } else {
      // Обычные сотрудники видят только задачи своего отдела (требование правил Firestore)
      return query(
        tasksRef, 
        where('departmentId', '==', userData?.departmentId),
        orderBy('createdAt', 'desc')
      );
    }
  }, [db, user, userData, isGlobalManager]);

  const { data: tasks, isLoading } = useCollection(tasksQuery);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    let result = tasks;

    // Обычные сотрудники (не админы) видят только незавершенные задачи своего отдела
    if (user && !isGlobalManager) {
      result = result.filter(task => task.status !== 'завершено');
    }

    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(lowerSearch) || 
        task.description?.toLowerCase().includes(lowerSearch) ||
        task.place?.toLowerCase().includes(lowerSearch)
      );
    }

    // Дополнительная фильтрация для менеджеров или гостей
    if ((isGlobalManager || !user) && selectedDept !== 'all') {
      result = result.filter(task => task.departmentId === selectedDept);
    }

    return result;
  }, [tasks, search, selectedDept, isGlobalManager, user]);

  // Показываем заглушку "Ожидание доступа" только если пользователь залогинен, но не одобрен
  if (user && userData && !userData.isApproved && userData.role !== 'owner') {
    return (
      <Layout title="Ожидание доступа">
        <div className="flex flex-col items-center justify-center py-32 text-center max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center animate-pulse">
            <Clock className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black uppercase tracking-tight">Доступ ограничен</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
              Ваш аккаунт {userData.name} успешно создан, но требует подтверждения администратором.
            </p>
          </div>
          <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Пожалуйста, свяжитесь с руководителем вашего отдела для ускорения процесса активации.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Задачи">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="ПОИСК ПО ЗАДАЧАМ..." 
              className="pl-10 h-12 bg-card border-none shadow-sm rounded-xl text-xs font-black uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {(isGlobalManager || !user) && (
            <div className="w-full md:w-80">
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="h-12 bg-card border-none shadow-sm rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-primary/20">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="ВСЕ ОТДЕЛЫ" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">ВСЕ ОТДЕЛЫ</SelectItem>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id} className="text-[10px] font-black uppercase tracking-widest">
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3 text-muted-foreground" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {(!isGlobalManager && user) ? `ОТДЕЛ: ${DEPARTMENTS.find(d => d.id === userData?.departmentId)?.label}` : (selectedDept === 'all' ? 'ОБЩИЙ СПИСОК ОРГАНИЗАЦИИ' : `ОТДЕЛ: ${DEPARTMENTS.find(d => d.id === selectedDept)?.label}`)}
            </h2>
          </div>
          <div className="text-[10px] font-black text-primary-foreground bg-foreground px-3 py-1 uppercase rounded-sm">
            ИТОГО: {filteredTasks.length}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map(task => {
              const isReader = userData?.role === 'reader';
              const canEdit = !!user && !isReader && (
                isGlobalManager || 
                userData?.id === task.responsibleUserId || 
                userData?.id === task.createdBy ||
                (userData?.role === 'head' && userData?.departmentId === task.departmentId)
              );

              return (
                <TaskCard 
                  key={task.id} 
                  {...task} 
                  datetime={task.dateTime} 
                  createdByName={task.createdByName}
                  canEdit={canEdit}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-card rounded-3xl shadow-sm border border-border border-dashed">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.4em]">ЗАДАЧ НЕ НАЙДЕНО</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
