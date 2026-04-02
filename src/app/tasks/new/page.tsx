'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Calendar, MapPin, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { PRIORITIES, TaskPriority } from '@/lib/constants';

export default function NewTask() {
  const { userData, user } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [datetime, setDatetime] = useState('');
  const [place, setPlace] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('не срочно');
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');

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
    if (!db || !userData || !user || isSubmitting) return;
    
    setIsSubmitting(true);
    addDocumentNonBlocking(collection(db, 'tasks'), {
      title,
      description,
      dateTime: datetime,
      place,
      status: 'запланировано',
      priority,
      departmentId: userData.departmentId,
      responsibleUserId,
      createdBy: user.uid,
      createdByName: userData.name || 'Сотрудник',
      checklist,
      createdAt: new Date().toISOString()
    });
    
    toast({ title: "УСПЕХ", description: "ЗАДАЧА СОЗДАНА В БАЗЕ ОРГАНИЗАЦИИ" });
    router.push('/');
  };

  return (
    <Layout title="Новая задача">
      <div className="max-w-3xl mx-auto pb-20">
        <Card className="border-none shadow-sm overflow-hidden bg-card rounded-3xl">
          <div className="h-1.5 bg-primary w-full opacity-80" />
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Название задачи</Label>
                <Input 
                  id="title" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Введите краткий заголовок..." 
                  className="h-12 text-lg font-black border-border bg-muted/10 focus-visible:ring-primary/10 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-foreground" />
                    <Label htmlFor="datetime" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Срок исполнения</Label>
                  </div>
                  <Input 
                    id="datetime" 
                    type="datetime-local" 
                    required 
                    value={datetime} 
                    onChange={(e) => setDatetime(e.target.value)} 
                    className="h-12 border-border bg-background rounded-xl font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-foreground" />
                    <Label htmlFor="place" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Место выполнения</Label>
                  </div>
                  <Input 
                    id="place" 
                    required 
                    value={place} 
                    onChange={(e) => setPlace(e.target.value)} 
                    placeholder="Локация..." 
                    className="h-12 border-border bg-background rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon className="w-4 h-4 text-foreground" />
                    <Label htmlFor="responsible" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Исполнитель</Label>
                  </div>
                  <Select value={responsibleUserId} onValueChange={setResponsibleUserId} required>
                    <SelectTrigger className="h-12 border-border bg-background rounded-xl font-bold">
                      <SelectValue placeholder="Выберите сотрудника" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map(u => <SelectItem key={u.id} value={u.id} className="font-bold">{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-foreground" />
                    <Label htmlFor="priority" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Срочность</Label>
                  </div>
                  <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)} required>
                    <SelectTrigger className="h-12 border-border bg-background rounded-xl font-bold">
                      <SelectValue placeholder="Приоритет" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => (
                        <SelectItem key={p} value={p} className="font-bold uppercase text-[10px]">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Детальное описание</Label>
                  <Textarea 
                    id="description" 
                    required 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Опишите требования к задаче..."
                    className="min-h-[150px] border-border bg-background rounded-xl p-4 text-sm font-medium leading-relaxed" 
                  />
                </div>

                <div className="space-y-4 md:col-span-2 pt-4 border-t border-border">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Контрольный чек-лист</Label>
                  
                  <div className="flex gap-3">
                    <Input 
                      placeholder="Добавить этап..." 
                      value={newCheckItem} 
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCheckItem())}
                      className="h-12 border-border bg-muted/10 rounded-xl shadow-inner font-bold"
                    />
                    <Button type="button" onClick={handleAddCheckItem} className="h-12 w-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shrink-0">
                      <Plus className="w-6 h-6" />
                    </Button>
                  </div>

                  <div className="grid gap-2">
                    {checklist.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/5 border border-border/50 px-4 py-3 rounded-xl group hover:border-border transition-all">
                        <span className="text-sm font-bold text-foreground/80">{item.text}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveCheckItem(index)}>
                          <X className="h-5 v-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row gap-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground shadow-lg hover:bg-primary/90">
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Создать задачу"}
                </Button>
                <Button type="button" variant="outline" className="h-14 px-10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-muted-foreground border-2" onClick={() => router.back()}>
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
