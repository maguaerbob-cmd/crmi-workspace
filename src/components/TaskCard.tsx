import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { Priority, PRIORITY_COLORS, TaskStatus } from '@/lib/constants';
import Link from 'next/link';

interface TaskCardProps {
  id: string;
  title: string;
  datetime: string;
  place: string;
  priority: Priority;
  status: TaskStatus;
  checklist: { text: string; done: boolean }[];
}

export const TaskCard: React.FC<TaskCardProps> = ({ id, title, datetime, place, priority, status, checklist }) => {
  const completedItems = checklist.filter(item => item.done).length;
  const progress = checklist.length > 0 ? (completedItems / checklist.length) * 100 : 0;

  return (
    <Link href={`/tasks/${id}`}>
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-none shadow-sm overflow-hidden group">
        <div className={`h-1.5 w-full ${PRIORITY_COLORS[priority]}`} />
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="secondary" className="text-[9px] uppercase font-bold px-1.5 py-0">
              {status}
            </Badge>
            <span className="text-[9px] font-bold uppercase text-muted-foreground">
              {priority}
            </span>
          </div>
          <CardTitle className="text-base font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-3 px-4">
          <div className="flex items-center text-[11px] text-muted-foreground gap-2">
            <Calendar className="w-3 h-3 text-primary" />
            <span>{new Date(datetime).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
          <div className="flex items-center text-[11px] text-muted-foreground gap-2">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="line-clamp-1">{place}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-4 px-4 flex flex-col items-start gap-2">
          {checklist.length > 0 && (
            <div className="w-full">
              <div className="flex justify-between text-[9px] mb-1 font-bold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> План работ
                </span>
                <span>{completedItems}/{checklist.length}</span>
              </div>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};
