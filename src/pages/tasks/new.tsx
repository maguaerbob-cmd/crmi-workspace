import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
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
import { X, Sparkles, Loader2 } from 'lucide-react';
import { suggestChecklist } from '@/ai/flows/ai-checklist-suggestion-flow';

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
  const [aiLoading, setAiLoading] = useState(false);

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

  const handleSuggestChecklist = async () => {
    if (!title || !description) {
      toast({ variant: "destructive", title: "Заполните данные", description: "Название и описание нужны для работы ИИ" });
      return;
    }
    setAiLoading(true);
    try {
      const result = await suggestChecklist({ title, description });
      setChecklist(result.checklist);
      toast({ title: "Чек-лист сгенерирован", description: "ИИ подготовил список дел для этой задачи" });
    } catch (error) {
      toast({ variant: "destructive", title: "Ошибка ИИ", description: "Не удалось получить подсказку" });
    } finally {
      setAiLoading(false);
    }
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
    
    toast({ title: "Успех", description: "Задача создана" });
    router.push('/');
  };

  return (
    <Layout title="Новое мероприятие">
      <div className="max-w-3xl mx-auto">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Название мероприятия</Label>
                  <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Напр. Выставка достижений молодежи" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="datetime">Дата и время</Label>
                  <Input id="datetime" type="datetime-local" required value={datetime} onChange={(e) => setDatetime(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="place">Место проведения</Label>
                  <Input id="place" required value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Напр. Главный холл ЦОМ" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Приоритет</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsible">Ответственный</Label>
                  <Select value={responsibleUserId} onValueChange={setResponsibleUserId}>
                    <SelectTrigger><SelectValue placeholder="Выберите ответственного" /></SelectTrigger>
                    <SelectContent>
                      {users?.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea id="description" required value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px]" />
                </div>

                <div className="space-y-4 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <Label>Чек-лист (план действий)</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-8 border-primary text-primary"
                      onClick={handleSuggestChecklist}
                      disabled={aiLoading}
                    >
                      {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      Подсказать через ИИ
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Новый пункт..." 
                      value={newCheckItem} 
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCheckItem())}
                    />
                    <Button type="button" onClick={handleAddCheckItem} variant="secondary">Добавить</Button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {checklist.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/50 p-3 rounded-md group">
                        <span className="text-sm">{item.text}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100" onClick={() => handleRemoveCheckItem(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Button type="submit" className="flex-1 h-11">
                  Создать задачу
                </Button>
                <Button type="button" variant="outline" className="h-11 px-8" onClick={() => router.back()}>Отмена</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
