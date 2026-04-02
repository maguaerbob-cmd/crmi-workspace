'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useDoc, useFirestore, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, MapPin, User, ChevronLeft, Trash2, CheckCircle, Clock } from 'lucide-react';
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
  const { id } = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const taskRef = doc(db, 'tasks', id as string);
  const { data: task, isLoading } = useDoc(taskRef);

  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);

  useEffect(() => {
    if (task?.checklist) {
      setChecklist(task.checklist);
    }
  }, [task]);

  const handleToggleCheck = (index: number) => {
    const newList = [...checklist];
    newList[index].done = !newList[index].done;
    setChecklist(newList);
    updateDocumentNonBlocking(taskRef, { checklist: newList });
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateDocumentNonBlocking(taskRef, { status: newStatus });
    toast({ title: "Статус изменен", description: `Задача теперь в статусе: ${newStatus}` });
  };

  const handleDelete = () => {
    deleteDocumentNonBlocking(taskRef);
    toast({ title: "Задача удалена" });
    router.push('/');
  };

  const canEdit = userData?.role === 'owner' || 
                  (userData?.role === 'head' && userData?.departmentId === task?.departmentId) ||
                  userData?.id === task?.responsibleUserId;

  if (isLoading) return (
    <Layout title="Загрузка...">
      <div className="flex justify-center py-20">
        <Clock className="w-8 h-8 animate-spin text-primary" />
      </div>
    </Layout>
  );

  if (!task) return (
    <Layout title="Ошибка">
      <div className="text-center py-20">
        <p>Задача не найдена</p>
        <Button onClick={() => router.push('/')} variant="link">Вернуться на главную</Button>
      </div>
    </Layout>
  );

  const completedCount = checklist.filter(i => i.done).length;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  return (
    <Layout title={task.title} showBack>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Назад
          </Button>
          <div className="flex gap-2">
            {canEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие нельзя отменить. Задача будет навсегда удалена из базы данных.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Удалить</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <div className={`h-2 w-full ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`} />
          <CardHeader className="bg-white">
            <div className="flex justify-between items-start mb-4">
              <Badge variant="secondary" className="text-[10px] font-bold uppercase px-2 py-0.5">
                {task.status}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-bold uppercase">
                Приоритет: {task.priority}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">{task.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Дата и время</p>
                  <p className="font-medium text-foreground">
                    {new Date(task.dateTime).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Место</p>
                  <p className="font-medium text-foreground">{task.place}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Описание</p>
              <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                {task.description}
              </div>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">План работ</p>
                  <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                    ВЫПОЛНЕНО: {completedCount}/{checklist.length} ({Math.round(progress)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-700 ease-out" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <div className="space-y-2">
                  {checklist.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${item.done ? 'bg-primary/5 opacity-70' : 'bg-white border shadow-sm'}`}
                    >
                      <Checkbox 
                        id={`item-${index}`} 
                        checked={item.done} 
                        onCheckedChange={() => handleToggleCheck(index)}
                      />
                      <label 
                        htmlFor={`item-${index}`} 
                        className={`text-sm font-medium leading-none cursor-pointer ${item.done ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {item.text}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t flex flex-wrap gap-3">
              {STATUSES.map((status) => (
                <Button
                  key={status}
                  variant={task.status === status ? "default" : "outline"}
                  size="sm"
                  className="rounded-full px-5 text-[11px] font-bold uppercase"
                  onClick={() => handleStatusChange(status)}
                >
                  {status === 'завершено' && <CheckCircle className="w-3 h-3 mr-1.5" />}
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
