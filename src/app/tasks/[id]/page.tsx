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
import { STATUSES, TaskStatus } from '@/lib/constants';
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
import { cn } from '@/lib/utils';

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

  const isReader = userData?.role === 'reader';
  const isGlobalManager = userData?.role === 'owner' || userData?.role === 'director' || userData?.role === 'deputy_director';
  
  const canEdit = !isReader && (
                  isGlobalManager || 
                  (userData?.role === 'head' && userData?.departmentId === task?.departmentId) ||
                  userData?.id === task?.responsibleUserId ||
                  userData?.id === task?.createdBy
                );

  const isCreator = userData?.id === task?.createdBy;
  const isHeadOfDept = userData?.role === 'head' && userData?.departmentId === task?.departmentId;
  const isCompleted = task?.status === 'завершено';

  const canDelete = isGlobalManager || (!isReader && (isCreator || isHeadOfDept) && !isCompleted);

  const handleToggleCheck = (index: number) => {
    if (!taskRef || !canEdit) return;
    const newList = [...checklist];
    newList[index].done = !newList[index].done;
    setChecklist(newList);
    updateDocumentNonBlocking(taskRef as DocumentReference, { checklist: newList });
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!taskRef || !canEdit) return;
    updateDocumentNonBlocking(taskRef as DocumentReference, { status: newStatus });
    toast({ title: "СТАТУС ОБНОВЛЕН", description: `НОВЫЙ СТАТУС: ${newStatus.toUpperCase()}` });
  };

  const handleDelete = () => {
    if (!taskRef || !canDelete) return;
    deleteDocumentNonBlocking(taskRef as DocumentReference);
    toast({ title: "ЗАДАЧА УДАЛЕНА", description: "ЗАПИСЬ ИСКЛЮЧЕНА ИЗ БАЗЫ ДАННЫХ" });
    router.push('/');
  };

  if (isLoading) return (
    <Layout title="Загрузка...">
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Clock className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Синхронизация данных...</p>
      </div>
    </Layout>
  );

  if (error || !task) return (
    <Layout title="Ошибка" showBack>
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-10 h-10 text-destructive opacity-30" />
        <div className="text-center">
          <p className="font-black text-foreground text-sm uppercase tracking-wider">Задача не найдена</p>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase">Возможно, она была удалена из системы</p>
        </div>
        <Button onClick={() => router.push('/')} variant="outline" className="mt-4 h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest border-2">
          Вернуться к списку
        </Button>
      </div>
    </Layout>
  );

  const completedCount = checklist.filter(i => i.done).length;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  const isUrgent = task.priority === 'срочно';

  return (
    <Layout title={task.title} showBack>
      <div className="max-w-2xl mx-auto space-y-4 pb-20">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg">
            <ChevronLeft className="w-3.5 h-3.5" /> Назад к списку
          </Button>
          
          <div className="flex items-center gap-1">
            {canEdit && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
                onClick={() => router.push(`/tasks/${taskId}/edit`)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl bg-card">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-sm font-black uppercase tracking-tight">Удалить задачу?</AlertDialogTitle>
                    <AlertDialogDescription className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
                      Эта запись будет навсегда исключена из базы данных организации. Действие необратимо.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-2">Отмена</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete} 
                      className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg"
                    >
                      Удалить запись
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <Card className={cn(
          "border-none shadow-sm overflow-hidden bg-card rounded-3xl relative",
          isUrgent && "shadow-[0_0_30px_rgba(239,68,68,0.2)]"
        )}>
          {isUrgent && <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 animate-pulse" />}
          <CardHeader className="p-6 md:p-8 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-[9px] font-black uppercase px-3 py-1 border-none bg-muted text-muted-foreground">
                  {task.status}
                </Badge>
                {task.priority && (
                  <Badge className={cn(
                    "text-[9px] font-black uppercase px-3 py-1 border-none text-white",
                    isUrgent ? "bg-red-600" : "bg-green-600"
                  )}>
                    {task.priority}
                  </Badge>
                )}
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-foreground leading-tight tracking-tight uppercase">
              {task.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-0 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-background shadow-sm flex items-center justify-center shrink-0 border border-border/50">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Срок исполнения</p>
                  <p className="text-xs font-bold text-foreground uppercase">
                    {new Date(task.dateTime).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-background shadow-sm flex items-center justify-center shrink-0 border border-border/50">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Локация</p>
                  <p className="text-xs font-bold text-foreground truncate uppercase">{task.place}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Описание задачи</p>
              <div className="text-foreground/80 leading-relaxed text-sm bg-muted/10 p-5 rounded-2xl whitespace-pre-wrap font-medium">
                {task.description}
              </div>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Контрольный чек-лист</p>
                  <span className="text-[10px] font-black text-foreground bg-muted px-2.5 py-1 rounded-full">
                    {completedCount} / {checklist.length}
                  </span>
                </div>
                
                <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-700 ease-in-out" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>

                <div className="grid gap-2">
                  {checklist.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-3.5 rounded-xl transition-all ${
                        item.done 
                        ? 'bg-muted/10 opacity-50' 
                        : 'bg-background shadow-sm border border-border/50'
                      }`}
                    >
                      <Checkbox 
                        id={`item-${index}`} 
                        checked={item.done} 
                        onCheckedChange={() => handleToggleCheck(index)}
                        disabled={!canEdit}
                        className="w-5 h-5 rounded-md border-border"
                      />
                      <label 
                        htmlFor={`item-${index}`} 
                        className={`text-xs font-bold cursor-pointer select-none flex-1 leading-none uppercase ${
                          item.done ? 'line-through text-muted-foreground' : 'text-foreground/80'
                        } ${!canEdit && 'cursor-default'}`}
                      >
                        {item.text}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {canEdit && (
              <div className="pt-8 border-t border-border space-y-4">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Обновить статус</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((status) => (
                    <Button
                      key={status}
                      variant={task.status === status ? "default" : "secondary"}
                      size="sm"
                      className={`rounded-xl px-5 h-10 text-[10px] font-black uppercase tracking-widest transition-all ${
                        task.status === status 
                        ? 'bg-primary text-primary-foreground shadow-lg' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      onClick={() => handleStatusChange(status)}
                    >
                      {status === 'завершено' && <CheckCircle className="w-3.5 h-3.5 mr-2" />}
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
