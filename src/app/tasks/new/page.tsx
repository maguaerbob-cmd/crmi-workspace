'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { PRIORITIES, Priority } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Calendar, MapPin, Flag, User as UserIcon } from 'lucide-react';

export default function NewTask() {
  const { userData } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [datetime, setDatetime] = useState('');
  const [place, setPlace] = useState('');
  const [priority, setPriority] = useState<Priority>('средний');
  const [responsibleUserId, setResponsibleUserId] = useState('');
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
    if (!db || !userData) return;
    
    addDocumentNonBlocking(collection(db, 'tasks'), {
      title,
      description,
      dateTime: datetime,
      place,
      priority,
      status: 'запланировано',
      departmentId: userData.departmentId,
      responsibleUserId,
      checklist,
      createdAt: new Date().toISOString()
    });
    
    toast({ title: "Успех", description: "Задача успешно создана" });
    router.push('/');
  };

  return (
    <Layout title="Новая задача">
      <div className="max-w-3xl mx-auto pb-10">
        <Card className="border-none shadow-md overflow-hidden bg-white">
          <CardContent className="p-6 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Название мероприятия</Label>
                <Input 
                  id="title" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Введите название..." 
                  className="h-12 text-lg font-bold border-none bg-slate-50 focus-visible:ring-primary/20 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-primary" />
                    <Label htmlFor="datetime" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Дата и время</Label>
                  </div>
                  <Input 
                    id="datetime" 
                    type="datetime-local" 
                    required 
                    value={datetime} 
                    onChange={(e) => setDatetime(e.target.value)} 
                    className="h-11 border-slate-100 bg-slate-50/50 rounded-xl"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-primary" />
                    <Label htmlFor="place" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Место проведения</Label>
                  </div>
                  <Input 
                    id="place" 
                    required 
                    value={place} 
                    onChange={(e) => setPlace(e.target.value)} 
                    placeholder="Напр. Актовый зал" 
                    className="h-11 border-slate-100 bg-slate-50/50 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Flag className="w-4 h-4 text-primary" />
                    <Label htmlFor="priority" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Приоритет</Label>
                  </div>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger className="h-11 border-slate-100 bg-slate-50/50 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => <SelectItem key={p} value={p} className="uppercase font-bold text-[10px]">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon className="w-4 h-4 text-primary" />
                    <Label htmlFor="responsible" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Ответственный</Label>
                  </div>
                  <Select value={responsibleUserId} onValueChange={setResponsibleUserId} required>
                    <SelectTrigger className="h-11 border-slate-100 bg-slate-50/50 rounded-xl">
                      <SelectValue placeholder="Выберите из списка" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Описание задачи</Label>
                  <Textarea 
                    id="description" 
                    required 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Подробно опишите задачу..."
                    className="min-h-[140px] border-slate-100 bg-slate-50/50 rounded-2xl p-4 text-sm leading-relaxed" 
                  />
                </div>

                <div className="space-y-4 md:col-span-2 pt-4">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">План действий (чек-лист)</Label>
                  
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Добавить новый пункт..." 
                      value={newCheckItem} 
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCheckItem())}
                      className="h-11 border-slate-100 bg-white rounded-xl shadow-sm"
                    />
                    <Button type="button" onClick={handleAddCheckItem} variant="secondary" className="h-11 rounded-xl px-6">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {checklist.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-xl group transition-all hover:bg-slate-100">
                        <span className="text-sm font-semibold text-slate-700">{item.text}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleRemoveCheckItem(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {checklist.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                        <p className="text-xs text-slate-400">Список пуст. Добавьте задачи для отслеживания прогресса.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row gap-3">
                <Button type="submit" className="flex-1 h-12 rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
                  Создать мероприятие
                </Button>
                <Button type="button" variant="outline" className="h-12 px-10 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-500" onClick={() => router.back()}>
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