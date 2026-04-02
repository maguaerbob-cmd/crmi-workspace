'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, DocumentReference, collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Calendar, MapPin, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { PRIORITIES, TaskPriority } from '@/lib/constants';

export default function EditTask() {
  const params = useParams();
  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { userData } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const taskRef = useMemoFirebase(() => {
    if (!db || !taskId) return null;
    return doc(db, 'tasks', taskId);
  }, [db, taskId]);

  const { data: task, isLoading: isTaskLoading } = useDoc(taskRef as DocumentReference);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [datetime, setDatetime] = useState('');
  const [place, setPlace] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('не срочно');
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setDatetime(task.dateTime || '');
      setPlace(task.place || '');
      setResponsibleUserId(task.responsibleUserId || '');
      setPriority(task.priority || 'не срочно');
      setChecklist(task.checklist || []);
    }
  }, [task]);

  const usersQuery = useMemoFirebase(() => {
    if (!db || !userData) return null;
    return query(collection(db, 'userProfiles'), where('departmentId', '==', userData.departmentId));
  }, [db, userData]);

  const { data: users } = useCollection(usersQuery);

  const handleAddCheckItem = () => {
    if (newCheckItem.trim()) {
      setChecklist([...checklist, { text: newCheckItem, done: false }]);
      setNewCheckItem('');
    }
  };

  const handleRemoveCheckItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskRef || !userData) return;
    
    updateDocumentNonBlocking(taskRef as DocumentReference, {
      title,
      description,
      dateTime: datetime,
      place,
      priority,
      responsibleUserId,
      checklist,
    });
    
    toast({ title: "Обновлено", description: "Данные задачи сохранены" });
    router.push(`/tasks/${taskId}`);
  };

  if (isTaskLoading) return (
    <Layout title="Загрузка...">
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    </Layout>
  );

  return (
    <Layout title="Редактирование" showBack>
      <div className="max-w-3xl mx-auto pb-10">
        <Card className="border-none shadow-sm overflow-hidden bg-card rounded-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Название</Label>
                <Input 
                  id="title" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="h-10 text-base font-bold border-border bg-muted/10 focus-visible:ring-primary/10 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-foreground" />
                    <Label htmlFor="datetime" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Дата</Label>
                  </div>
                  <Input 
                    id="datetime" 
                    type="datetime-local" 
                    required 
                    value={datetime} 
                    onChange={(e) => setDatetime(e.target.value)} 
                    className="h-10 border-border bg-background rounded-lg"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-foreground" />
                    <Label htmlFor="place" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Место</Label>
                  </div>
                  <Input 
                    id="place" 
                    required 
                    value={place} 
                    onChange={(e) => setPlace(e.target.value)} 
                    className="h-10 border-border bg-background rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-foreground" />
                    <Label htmlFor="responsible" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ответственный</Label>
                  </div>
                  <Select value={responsibleUserId} onValueChange={setResponsibleUserId} required>
                    <SelectTrigger className="h-10 border-border bg-background rounded-lg">
                      <SelectValue placeholder="Выбрать" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-foreground" />
                    <Label htmlFor="priority" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Срочность</Label>
                  </div>
                  <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)} required>
                    <SelectTrigger className="h-10 border-border bg-background rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => (
                        <SelectItem key={p} value={p} className="text-[10px] font-black uppercase">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Описание</Label>
                  <Textarea 
                    id="description" 
                    required 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="min-h-[100px] border-border bg-background rounded-lg p-3 text-sm" 
                  />
                </div>

                <div className="space-y-3 md:col-span-2 pt-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Чек-лист</Label>
                  
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Новый пункт..." 
                      value={newCheckItem} 
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCheckItem())}
                      className="h-10 border-border bg-muted/10 rounded-lg shadow-sm"
                    />
                    <Button type="button" onClick={handleAddCheckItem} variant="secondary" className="h-10 rounded-lg px-4 bg-primary text-primary-foreground">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {checklist.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/5 border border-border/50 px-3 py-2 rounded-lg group">
                        <span className="text-xs font-semibold text-foreground/80">{item.text}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleRemoveCheckItem(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="flex-1 h-11 rounded-lg text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-md">
                  Сохранить изменения
                </Button>
                <Button type="button" variant="outline" className="h-11 px-8 rounded-lg text-xs font-black uppercase tracking-widest text-muted-foreground" onClick={() => router.back()}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
