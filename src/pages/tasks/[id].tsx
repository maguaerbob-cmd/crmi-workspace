import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useDoc, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Priority, PRIORITIES, PRIORITY_COLORS, TaskStatus, STATUSES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, User, ChevronLeft, Edit3, Save, RotateCcw } from 'lucide-react';

export default function TaskDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { userData } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const taskDocRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'tasks', id as string);
  }, [db, id]);

  const { data: task, isLoading: loading } = useDoc<any>(taskDocRef);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPlace, setEditPlace] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('средний');
  const [editDatetime, setEditDatetime] = useState('');

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditPlace(task.place);
      setEditDescription(task.description);
      setEditPriority(task.priority);
      setEditDatetime(task.dateTime || '');
    }
  }, [task]);

  const toggleChecklistItem = (index: number) => {
    if (!task || !taskDocRef) return;
    const newChecklist = [...task.checklist];
    newChecklist[index] = { ...newChecklist[index], done: !newChecklist[index].done };
    updateDocumentNonBlocking(taskDocRef, { checklist: newChecklist });
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!task || !taskDocRef) return;
    if (newStatus === 'завершено') {
      if (!confirm('Вы уверены, что хотите завершить задачу? Она будет скрыта из общего списка.')) return;
    }
    updateDocumentNonBlocking(taskDocRef, { status: newStatus });
    toast({ title: "Статус обновлен", description: `Задача теперь в статусе: ${newStatus}` });
  };

  const handleSaveEdit = () => {
    if (!task || !taskDocRef) return;
    updateDocumentNonBlocking(taskDocRef, {
      title: editTitle,
      place: editPlace,
      description: editDescription,
      priority: editPriority,
      dateTime: editDatetime
    });
    setEditing(false);
    toast({ title: "Обновлено", description: "Данные задачи сохранены" });
  };

  const canEdit = userData && (
    userData.role === 'owner' || 
    (userData.role === 'head' && userData.departmentId === task?.departmentId) ||
    (userData.role === 'inspector' && task?.responsibleUserId === userData.id)
  );

  const canRestore = userData?.role === 'owner' && task?.status === 'завершено';

  if (loading || !task) return <Layout><div className="flex justify-center py-20">Загрузка...</div></Layout>;

  return (
    <Layout title={editing ? "Редактирование" : task.title}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8">
            <ChevronLeft className="w-4 h-4 mr-1" /> Назад
          </Button>
          <div className="flex-1" />
          {canEdit && !editing && task.status !== 'завершено' && (
            <Button size="sm" onClick={() => setEditing(true)} className="bg-secondary text-white">
              <Edit3 className="w-4 h-4 mr-1" /> Изменить
            </Button>
          )}
          {canRestore && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange('в процессе')} className="border-primary text-primary">
              <RotateCcw className="w-4 h-4 mr-1" /> Восстановить
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardContent className="p-6 space-y-6">
              {editing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Название</Label>
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="min-h-[150px]" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`${PRIORITY_COLORS[task.priority as Priority]} text-white uppercase`}>
                      {task.priority} приоритет
                    </Badge>
                    <Badge variant="outline" className="uppercase font-bold">
                      {task.status}
                    </Badge>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-muted-foreground">{task.description}</p>
                  </div>
                </>
              )}

              <div className="pt-4 border-t">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-muted-foreground">План выполнения</h3>
                <div className="space-y-3">
                  {task.checklist?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg group">
                      <Checkbox 
                        id={`check-${i}`} 
                        checked={item.done} 
                        onCheckedChange={() => toggleChecklistItem(i)}
                        className="w-5 h-5 border-2"
                      />
                      <label htmlFor={`check-${i}`} className={`text-sm flex-1 cursor-pointer transition-colors ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                        {item.text}
                      </label>
                    </div>
                  ))}
                  {task.checklist?.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">План не составлен</p>
                  )}
                </div>
              </div>

              {editing && (
                <div className="flex gap-4 pt-6">
                  <Button className="flex-1" onClick={handleSaveEdit}>
                    <Save className="w-4 h-4 mr-2" /> Сохранить
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Отмена</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Детали</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Дата и время</span>
                    {editing ? (
                      <Input type="datetime-local" value={editDatetime} onChange={(e) => setEditDatetime(e.target.value)} className="mt-1 h-8 text-xs" />
                    ) : (
                      <span className="text-sm font-medium">{task.dateTime ? new Date(task.dateTime).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' }) : '—'}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Место проведения</span>
                    {editing ? (
                      <Input value={editPlace} onChange={(e) => setEditPlace(e.target.value)} className="mt-1 h-8 text-xs" />
                    ) : (
                      <span className="text-sm font-medium">{task.place}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Ответственный</span>
                    <span className="text-sm font-medium">{task.responsibleUserId || '—'}</span>
                  </div>
                </div>
                {!editing && (
                  <div className="pt-4 border-t">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block">Изменить статус</Label>
                    <Select value={task.status} onValueChange={(v) => handleStatusChange(v as TaskStatus)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {editing && (
                  <div className="pt-4 border-t space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Приоритет</Label>
                    <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Priority)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="p-4 bg-white rounded-xl shadow-sm border text-[10px] uppercase font-bold text-muted-foreground text-center">
              Отдел: {task.departmentId}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
