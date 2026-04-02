'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, CheckCircle2, Edit2, MoreVertical } from 'lucide-react';
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
    toast({ title: "Статус обновлен", description: `Задача: ${newStatus}` });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/tasks/${id}/edit`);
  };

  return (
    <Link href={`/tasks/${id}`}>
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border border-slate-200 shadow-sm overflow-hidden group bg-white">
        <div className={`h-1 w-full ${PRIORITY_COLORS[priority]}`} />
        <CardHeader className="p-3 pb-1">
          <div className="flex justify-between items-start">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[8px] uppercase font-bold px-1.5 py-0 border-slate-300 text-slate-600 bg-slate-50">
                {status}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {canEdit && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-slate-400 hover:text-primary"
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
                <DropdownMenuContent align="end">
                  {STATUSES.map((s) => (
                    <DropdownMenuItem 
                      key={s} 
                      onClick={(e) => handleStatusChange(e as any, s)}
                      className={status === s ? "bg-slate-100 font-bold" : ""}
                    >
                      Статус: {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardTitle className="text-sm font-bold line-clamp-1 mt-1 text-slate-900 group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-1.5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-[10px] text-slate-500 gap-1.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{new Date(datetime).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
            <div className="flex items-center text-[10px] text-slate-500 gap-1.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="truncate">{place}</span>
            </div>
          </div>
          
          {checklist.length > 0 && (
            <div className="pt-1">
              <div className="flex justify-between text-[8px] mb-0.5 font-bold text-slate-400">
                <span>ПЛАН {completedItems}/{checklist.length}</span>
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