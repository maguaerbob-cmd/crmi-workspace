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
import { X, Plus, Calendar, MapPin, Flag, User as UserIcon, Loader2 } from 'lucide-react';

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
  const [priority, setPriority] = useState<Priority>('средний');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');

  const usersQuery = useMemoFirebase(() => {
    if (!db || !userData) return null;
    // Можно назначать ответственных только своего отдела
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
      priority,
      status: 'запланировано',
      departmentId: userData.departmentId,
      responsibleUserId,
      createdBy: user.uid, // Добавлено для правил безопасности (Инспектор)
      checklist,
      createdAt: new Date().toISOString()
    });
    
    toast({ title: "Успех", description: "Задача создана в базе организации" });
    router.push('/');
  };

  return (
    <Layout title="Новая задача">
      <div className="max-w-3xl mx-auto pb-20">
        <Card className="border-2 border-slate-200 shadow-xl overflow-hidden bg-white rounded-3xl">
          <div className="h-2 bg-slate-900 w-full" />
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Название задачи</Label>
                <Input 
                  id="title" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Введите краткий заголовок..." 
                  className="h-12 text-lg font-black border-slate-200 bg-slate-50 focus-visible:ring-slate-900/10 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-slate-900" />
                    <Label htmlFor="datetime" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Срок исполнения</Label>
                  </div>
                  <Input 
                    id="datetime" 
                    type="datetime-local" 
                    required 
                    value={datetime} 
                    onChange={(e) => setDatetime(e.target.value)} 
                    className="h-12 border-slate-200 bg-white rounded-xl font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-slate-900" />
                    <Label htmlFor="place" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Место выполнения</Label>
                  </div>
                  <Input 
                    id="place" 
                    required 
                    value={place} 
                    onChange={(e) => setPlace(e.target.value)} 
                    placeholder="Локация..." 
                    className="h-12 border-slate-200 bg-white rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Flag className="w-4 h-4 text-slate-900" />
                    <Label htmlFor="priority" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Приоритет</Label>
                  </div>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger className="h-12 border-slate-200 bg-white rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => <SelectItem key={p} value={p} className="uppercase font-black text-[10px] tracking-widest">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon className="w-4 h-4 text-slate-900" />
                    <Label htmlFor="responsible" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Исполнитель</Label>
                  </div>
                  <Select value={responsibleUserId} onValueChange={setResponsibleUserId} required>
                    <SelectTrigger className="h-12 border-slate-200 bg-white rounded-xl font-bold">
                      <SelectValue placeholder="Выберите сотрудника" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map(u => <SelectItem key={u.id} value={u.id} className="font-bold">{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Детальное описание</Label>
                  <Textarea 
                    id="description" 
                    required 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Опишите требования к задаче..."
                    className="min-h-[150px] border-slate-200 bg-white rounded-xl p-4 text-sm font-medium leading-relaxed" 
                  />
                </div>

                <div className="space-y-4 md:col-span-2 pt-4 border-t border-slate-100">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Контрольный чек-лист</Label>
                  
                  <div className="flex gap-3">
                    <Input 
                      placeholder="Добавить этап..." 
                      value={newCheckItem} 
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCheckItem())}
                      className="h-12 border-slate-200 bg-slate-50 rounded-xl shadow-inner font-bold"
                    />
                    <Button type="button" onClick={handleAddCheckItem} className="h-12 w-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg shrink-0">
                      <Plus className="w-6 h-6" />
                    </Button>
                  </div>

                  <div className="grid gap-2">
                    {checklist.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-white border-2 border-slate-100 px-4 py-3 rounded-xl group hover:border-slate-200 transition-all">
                        <span className="text-sm font-bold text-slate-800">{item.text}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-destructive" onClick={() => handleRemoveCheckItem(index)}>
                          <X className="h-5 h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row gap-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] bg-slate-900 text-white shadow-2xl hover:bg-slate-800">
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Создать задачу"}
                </Button>
                <Button type="button" variant="outline" className="h-14 px-10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-2" onClick={() => router.back()}>
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