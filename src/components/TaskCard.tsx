'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Edit2, MoreVertical, CheckCircle2 } from 'lucide-react';
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
    toast({ title: "Статус обновлен", description: `${newStatus}` });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/tasks/${id}/edit`);
  };

  return (
    <Link href={`/tasks/${id}`}>
      <Card className="hover:border-slate-400 transition-all duration-200 cursor-pointer border border-slate-200 shadow-sm overflow-hidden group bg-white">
        <div className={`h-1 w-full ${PRIORITY_COLORS[priority]}`} />
        <CardHeader className="p-3 pb-1 space-y-1">
          <div className="flex justify-between items-center">
            <Badge variant="secondary" className="text-[8px] font-black uppercase px-1.5 py-0 bg-slate-100 text-slate-600 rounded">
              {status}
            </Badge>
            <div className="flex items-center gap-0.5">
              {canEdit && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-slate-400 hover:text-slate-900"
                  onClick={handleEditClick}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[120px]">
                  {STATUSES.map((s) => (
                    <DropdownMenuItem 
                      key={s} 
                      onClick={(e) => handleStatusChange(e as any, s)}
                      className={`text-[10px] font-bold uppercase ${status === s ? "bg-slate-100" : ""}`}
                    >
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardTitle className="text-xs font-black line-clamp-1 text-slate-900 group-hover:text-slate-700">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          <div className="space-y-0.5">
            <div className="flex items-center text-[9px] font-bold text-slate-500 gap-1.5">
              <Calendar className="w-2.5 h-2.5 text-slate-400" />
              <span>{new Date(datetime).toLocaleDateString('ru-RU')} {new Date(datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center text-[9px] font-bold text-slate-500 gap-1.5">
              <MapPin className="w-2.5 h-2.5 text-slate-400" />
              <span className="truncate">{place}</span>
            </div>
          </div>
          
          {checklist.length > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[7px] font-black text-slate-400 uppercase tracking-tighter">
                <span>ПРОГРЕСС {completedItems}/{checklist.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-900 transition-all duration-500" 
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