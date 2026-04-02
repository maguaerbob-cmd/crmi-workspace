'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Edit2, MoreVertical } from 'lucide-react';
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
  canEdit: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  id, title, datetime, place, priority, status, checklist, canEdit 
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const db = getFirestore();

  const completedItems = checklist.filter(item => item.done).length;
  const progress = checklist.length > 0 ? (completedItems / checklist.length) * 100 : 0;

  const handleStatusChange = (e: React.MouseEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();
    const taskRef = doc(db, 'tasks', id);
    updateDocumentNonBlocking(taskRef, { status: newStatus });
    toast({ title: "СТАТУС ОБНОВЛЕН", description: `${newStatus.toUpperCase()}` });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/tasks/${id}/edit`);
  };

  return (
    <Link href={`/tasks/${id}`}>
      <Card className="card-industrial group rounded-none">
        <div className={`h-1.5 w-full ${PRIORITY_COLORS[priority]}`} />
        <CardHeader className="p-4 pb-2 space-y-2">
          <div className="flex justify-between items-center">
            <Badge className="text-[8px] font-black uppercase px-2 py-0.5 bg-slate-950 text-white rounded-none border-none">
              {status}
            </Badge>
            <div className="flex items-center gap-1">
              {canEdit && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-slate-400 hover:text-slate-950 rounded-none"
                  onClick={handleEditClick}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 rounded-none">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px] rounded-none border-2 border-slate-950 p-0 shadow-none">
                  {STATUSES.map((s) => (
                    <DropdownMenuItem 
                      key={s} 
                      onClick={(e) => handleStatusChange(e as any, s)}
                      className={`text-[9px] font-black uppercase p-2 hover:bg-slate-100 rounded-none cursor-pointer ${status === s ? "bg-slate-50" : ""}`}
                    >
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardTitle className="text-sm font-black line-clamp-2 text-slate-950 uppercase tracking-tight leading-tight">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center text-[10px] font-black text-slate-600 gap-2 uppercase tracking-tighter">
              <Calendar className="w-3 h-3" />
              <span>{new Date(datetime).toLocaleDateString('ru-RU')} {new Date(datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center text-[10px] font-black text-slate-600 gap-2 uppercase tracking-tighter">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{place}</span>
            </div>
          </div>
          
          {checklist.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-[8px] font-black text-slate-950 uppercase tracking-widest">
                <span>ПРОГРЕСС {completedItems}/{checklist.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 border border-slate-200 rounded-none overflow-hidden">
                <div 
                  className="h-full bg-slate-950 transition-all duration-500" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};