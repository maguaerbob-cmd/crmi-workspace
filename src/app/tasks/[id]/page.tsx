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
import { Calendar, MapPin, ChevronLeft, Trash2, CheckCircle, Clock, AlertCircle, Edit2 } from 'lucide-react';
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
        <Clock className="w-8 h-8 animate-spin text-slate-300" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Загрузка данных...</p>
      </div>
    </Layout>
  );

  if (error || !task) return (
    <Layout title="Ошибка" showBack>
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-10 h-10 text-destructive opacity-30" />
        <div className="text-center">
          <p className="font-black text-slate-900 text-sm uppercase tracking-wider">Задача не найдена</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase">Возможно, она была удалена</p>
        </div>
        <Button onClick={() => router.push('/')} variant="outline" className="mt-4 h-9 text-[10px] font-bold uppercase tracking-widest">
          Вернуться к списку
        </Button>
      </div>
    </Layout>
  );

  const completedCount = checklist.filter(i => i.done).length;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  return (
    <Layout title={task.title} showBack>
      <div className="max-w-2xl mx-auto space-y-4 pb-10">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="gap-2 -ml-2 text-slate-500 hover:text-slate-900 h-8 text-[10px] font-bold uppercase tracking-widest">
            <ChevronLeft className="w-3.5 h-3.5" /> Назад
          </Button>
          
          <div className="flex items-center gap-1">
            {canEdit && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-primary"
                  onClick={() => router.push(`/tasks/${taskId}/edit`)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-sm font-bold uppercase tracking-tight">Удалить задачу?</AlertDialogTitle>
                      <AlertDialogDescription className="text-xs">
                        Это действие нельзя отменить. Задача будет навсегда удалена.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="h-9 text-[10px] font-bold uppercase tracking-widest">Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="h-9 text-[10px] font-bold uppercase tracking-widest bg-destructive text-white hover:bg-destructive/90">Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl">
          <div className={`h-1 w-full ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`} />
          <CardHeader className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="text-[9px] font-bold uppercase px-2 py-0 border-slate-300 text-slate-600 bg-slate-50">
                {task.status}
              </Badge>
              <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">
                Приоритет: {task.priority}
              </span>
            </div>
            <CardTitle className="text-lg font-black text-slate-900 leading-tight">
              {task.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-6">
            <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Дата</p>
                  <p className="text-[10px] font-bold text-slate-900 truncate">
                    {new Date(task.dateTime).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Место</p>
                  <p className="text-[10px] font-bold text-slate-900 truncate">{task.place}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Описание</p>
              <div className="text-slate-700 leading-normal text-xs bg-slate-50/30 border border-slate-100 p-3 rounded-lg whitespace-pre-wrap">
                {task.description}
              </div>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Чек-лист</p>
                  <span className="text-[9px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200">
                    {completedCount}/{checklist.length}
                  </span>
                </div>
                
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-900 transition-all duration-700 ease-in-out" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>

                <div className="grid gap-1.5">
                  {checklist.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-2.5 p-2 rounded-md border transition-all ${
                        item.done 
                        ? 'bg-slate-50/50 border-transparent opacity-50' 
                        : 'bg-white border-slate-100 shadow-sm'
                      }`}
                    >
                      <Checkbox 
                        id={`item-${index}`} 
                        checked={item.done} 
                        onCheckedChange={() => handleToggleCheck(index)}
                        className="w-4 h-4 rounded-sm"
                      />
                      <label 
                        htmlFor={`item-${index}`} 
                        className={`text-[11px] font-bold cursor-pointer select-none flex-1 leading-none ${
                          item.done ? 'line-through text-slate-400' : 'text-slate-700'
                        }`}
                      >
                        {item.text}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Статус задачи</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((status) => (
                  <Button
                    key={status}
                    variant={task.status === status ? "default" : "outline"}
                    size="sm"
                    className={`rounded-md px-3 h-7 text-[9px] font-black uppercase tracking-widest transition-all ${
                      task.status === status ? 'bg-slate-900 text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => handleStatusChange(status)}
                  >
                    {status === 'завершено' && <CheckCircle className="w-2.5 h-2.5 mr-1" />}
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
