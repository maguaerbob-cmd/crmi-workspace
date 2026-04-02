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

  return (
    <Link href={`/tasks/${id}`}>
      <Card className="card-industrial overflow-hidden rounded-2xl">
        <div className={`h-1.5 w-full ${PRIORITY_COLORS[priority]}`} />
        <CardHeader className="p-4 pb-2 space-y-2">
          <div className="flex justify-between items-center">
            <Badge className="text-[8px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-sm border-none">
              {status}
            </Badge>
            <div className="flex items-center gap-1">
              {canEdit && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-slate-300 hover:text-slate-950 hover:bg-slate-50"
                    onClick={handleEditClick}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:bg-slate-50">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[140px] rounded-xl border-none shadow-2xl p-1">
                      {STATUSES.map((s) => (
                        <DropdownMenuItem 
                          key={s} 
                          onClick={(e) => handleStatusChange(e as any, s)}
                          className={`text-[9px] font-black uppercase p-2 hover:bg-slate-50 rounded-lg cursor-pointer ${status === s ? "bg-slate-50 text-slate-900" : "text-slate-400"}`}
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
          <CardTitle className="text-sm font-black line-clamp-2 text-slate-900 uppercase tracking-tight leading-tight">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center text-[10px] font-bold text-slate-400 gap-2 uppercase tracking-tighter">
              <Calendar className="w-3 h-3 text-slate-300" />
              <span>{new Date(datetime).toLocaleDateString('ru-RU')} {new Date(datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center text-[10px] font-bold text-slate-400 gap-2 uppercase tracking-tighter">
              <MapPin className="w-3 h-3 text-slate-300" />
              <span className="truncate">{place}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            <div className="flex items-center gap-1.5">
              <UserCircle className="w-3 h-3 text-slate-300" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight truncate max-w-[120px]">
                {createdByName || '—'}
              </span>
            </div>
            {checklist.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};