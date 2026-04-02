'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Edit2, MoreVertical, UserCircle } from 'lucide-react';
import { Priority, PRIORITY_COLORS, TaskStatus, STATUSES } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateDocumentNonBlocking } from '@/firebase';
import { doc, getFirestore } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  id: string;
  title: string;
  datetime: string;
  place: string;
  priority: Priority;
  status: TaskStatus;
  checklist: { text: string; done: boolean }[];
  departmentId: string;
  responsibleUserId: string;
  createdByName?: string;
  canEdit: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  id, title, datetime, place, priority, status, checklist, createdByName, canEdit 
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const db = getFirestore();

  const completedItems = checklist.filter(item => item.done).length;
  const progress = checklist.length > 0 ? (completedItems / checklist.length) * 100 : 0;

  const handleStatusChange = (e: React.MouseEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canEdit) return;
    const taskRef = doc(db, 'tasks', id);
    updateDocumentNonBlocking(taskRef, { status: newStatus });
    toast({ title: "СТАТУС ОБНОВЛЕН", description: `${newStatus.toUpperCase()}` });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/tasks/${id}/edit`);
  };

  // Нормализуем приоритет для безопасности
  const p = (priority?.toLowerCase() || 'средний') as Priority;

  const getGlowClass = (priorityValue: Priority) => {
    switch (priorityValue) {
      case 'высокий': 
        return "shadow-[0_0_25px_-5px_rgba(220,38,38,0.5)] dark:shadow-[0_0_30px_-5px_rgba(220,38,38,0.7)]";
      case 'средний': 
        return "shadow-[0_0_20px_-5px_rgba(234,179,8,0.4)] dark:shadow-[0_0_25px_-5px_rgba(234,179,8,0.6)]";
      case 'низкий': 
        return "shadow-[0_0_15px_-5px_rgba(22,163,74,0.3)] dark:shadow-[0_0_20px_-5px_rgba(22,163,74,0.5)]";
      default: 
        return "";
    }
  };

  const priorityColor = PRIORITY_COLORS[p] || "bg-muted";

  return (
    <Link href={`/tasks/${id}`}>
      <Card className={cn(
        "card-industrial overflow-hidden rounded-2xl group border-none transition-all duration-300 hover:scale-[1.02] bg-card",
        getGlowClass(p)
      )}>
        <div className="flex min-h-[160px]">
          {/* Левая полоса цвета приоритета */}
          <div className={cn("w-2 shrink-0 transition-colors", priorityColor)} />
          
          <div className="flex-1 flex flex-col">
            <CardHeader className="p-4 pb-2 space-y-2">
              <div className="flex justify-between items-center">
                <Badge className="text-[8px] font-black uppercase px-2 py-0.5 bg-muted text-muted-foreground rounded-sm border-none">
                  {status}
                </Badge>
                <div className="flex items-center gap-1">
                  {canEdit && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
                        onClick={handleEditClick}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-accent">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[140px] rounded-xl border-none shadow-2xl p-1 bg-card">
                          {STATUSES.map((s) => (
                            <DropdownMenuItem 
                              key={s} 
                              onClick={(e) => handleStatusChange(e as any, s)}
                              className={`text-[9px] font-black uppercase p-2 hover:bg-accent rounded-lg cursor-pointer ${status === s ? "bg-accent text-foreground" : "text-muted-foreground"}`}
                            >
                              {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </div>
              <CardTitle className="text-sm font-black line-clamp-2 text-foreground uppercase tracking-tight leading-tight">
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center text-[10px] font-bold text-muted-foreground gap-2 uppercase tracking-tighter">
                  <Calendar className="w-3 h-3 opacity-50" />
                  <span>{new Date(datetime).toLocaleDateString('ru-RU')} {new Date(datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center text-[10px] font-bold text-muted-foreground gap-2 uppercase tracking-tighter">
                  <MapPin className="w-3 h-3 opacity-50" />
                  <span className="truncate">{place}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-2">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <UserCircle className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tight truncate">
                    Создал: {createdByName || '—'}
                  </span>
                </div>
                {checklist.length > 0 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-black text-foreground bg-accent px-1.5 py-0.5 rounded">
                      {Math.round(progress)}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </Link>
  );
};
