import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, CheckCircle2, Circle } from 'lucide-react';
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
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-none overflow-hidden relative">
        <div className={`absolute top-0 left-0 w-1 h-full ${PRIORITY_COLORS[priority]}`} />
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <Badge variant={status === 'завершено' ? 'secondary' : 'outline'} className="text-[10px] uppercase font-bold">
              {status}
            </Badge>
            <Badge className={`${PRIORITY_COLORS[priority]} text-white text-[10px] uppercase`}>
              {priority}
            </Badge>
          </div>
          <CardTitle className="text-lg font-headline mt-2 line-clamp-1">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-3">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(datetime).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <MapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{place}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex flex-col items-start gap-2">
          {checklist.length > 0 && (
            <div className="w-full">
              <div className="flex justify-between text-[10px] mb-1">
                <span>Чек-лист</span>
                <span>{completedItems}/{checklist.length}</span>
              </div>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300" 
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