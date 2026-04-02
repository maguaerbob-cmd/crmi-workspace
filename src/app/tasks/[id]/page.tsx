'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, DocumentReference } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, MapPin, ChevronLeft, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { PRIORITY_COLORS, STATUSES, TaskStatus } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TaskDetails() {
  const params = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  // Обеспечиваем корректное получение ID из параметров App Router
  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;

  const taskRef = useMemoFirebase(() => {
    if (!db || !taskId) return null;
    return doc(db, 'tasks', taskId);
  }, [db, taskId]);

  const { data: task, isLoading, error } = useDoc(taskRef as DocumentReference);

  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);

  useEffect(() => {
    if (task?.checklist) {
      setChecklist(task.checklist);
    }
  }, [task]);

  const handleToggleCheck = (index: number) => {
    if (!taskRef) return;
    const newList = [...checklist];
    newList[index].done = !newList[index].done;
    setChecklist(newList);
    updateDocumentNonBlocking(taskRef as DocumentReference, { checklist: newList });
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!taskRef) return;
    updateDocumentNonBlocking(taskRef as DocumentReference, { status: newStatus });
    toast({ title: "Статус изменен", description: `Задача теперь в статусе: ${newStatus}` });
  };

  const handleDelete = () => {
    if (!taskRef) return;
    deleteDocumentNonBlocking(taskRef as DocumentReference);
    toast({ title: "Задача удалена" });
    router.push('/');
  };

  const canEdit = userData?.role === 'owner' || 
                  (userData?.role === 'head' && userData?.departmentId === task?.departmentId) ||
                  userData?.id === task?.responsibleUserId;

  if (isLoading) return (
    <Layout title="Загрузка...">
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Clock className="w-10 h-10 animate-spin text-primary opacity-20" />
        <p className="text-sm font-medium text-muted-foreground">Загрузка данных задачи...</p>
      </div>
    </Layout>
  );

  if (error || !task) return (
    <Layout title="Ошибка">
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-12 h-12 text-destructive opacity-50" />
        <div className="text-center">
          <p className="font-bold">Задача не найдена</p>
          <p className="text-sm text-muted-foreground mt-1">Возможно, она была удалена или у вас нет доступа.</p>
        </div>
        <Button onClick={() => router.push('/')} variant="outline" className="mt-4">
          Вернуться к списку
        </Button>
      </div>
    </Layout>
  );

  const completedCount = checklist.filter(i => i.done).length;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  return (
    <Layout title={task.title} showBack>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" /> Назад к списку
          </Button>
          
          {canEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Задача будет навсегда удалена из системы.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <Card className="border-none shadow-md overflow-hidden bg-white">
          <div className={`h-2 w-full ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`} />
          <CardHeader className="space-y-4">
            <div className="flex justify-between items-center">
              <Badge variant="secondary" className="text-[10px] font-bold uppercase px-3 py-1 bg-slate-100 text-slate-700">
                {task.status}
              </Badge>
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Приоритет: {task.priority}
              </span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 leading-tight">
              {task.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Дата и время</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(task.dateTime).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Место</p>
                  <p className="font-semibold text-slate-900">{task.place}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Описание задачи</p>
              <div className="text-slate-700 leading-relaxed text-sm bg-white border border-slate-100 p-5 rounded-2xl shadow-sm whitespace-pre-wrap">
                {task.description}
              </div>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">План действий</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                      {completedCount} из {checklist.length}
                    </span>
                  </div>
                </div>
                
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>

                <div className="grid gap-3">
                  {checklist.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all border ${
                        item.done 
                        ? 'bg-slate-50 border-transparent opacity-60' 
                        : 'bg-white border-slate-100 shadow-sm'
                      }`}
                    >
                      <Checkbox 
                        id={`item-${index}`} 
                        checked={item.done} 
                        onCheckedChange={() => handleToggleCheck(index)}
                        className="w-5 h-5"
                      />
                      <label 
                        htmlFor={`item-${index}`} 
                        className={`text-sm font-semibold cursor-pointer select-none flex-1 ${
                          item.done ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {item.text}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t flex flex-wrap gap-2">
              <p className="w-full text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Изменить статус</p>
              {STATUSES.map((status) => (
                <Button
                  key={status}
                  variant={task.status === status ? "default" : "outline"}
                  size="sm"
                  className={`rounded-full px-5 h-9 text-[11px] font-bold uppercase tracking-wider transition-all ${
                    task.status === status ? 'shadow-md shadow-primary/20' : ''
                  }`}
                  onClick={() => handleStatusChange(status)}
                >
                  {status === 'завершено' && <CheckCircle className="w-3.5 h-3.5 mr-2" />}
                  {status}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}