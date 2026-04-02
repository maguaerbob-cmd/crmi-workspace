import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { useAuth as useFirebaseCore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, PlusCircle, User, LogOut, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title, showBack }) => {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const auth = useFirebaseCore();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isActive = (path: string) => router.pathname === path;

  const canCreate = userData?.role === 'owner' || userData?.role === 'head' || userData?.role === 'inspector';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-xl" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    </div>
  );

  if (!userData && !['/login', '/register'].includes(router.pathname)) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md hidden md:block">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-sm">C</div>
            <span className="text-xl font-bold tracking-tight text-primary">CRMI WORKSPACE</span>
          </Link>
          
          <nav className="flex items-center space-x-1">
            <Link href="/">
              <Button variant={isActive('/') ? 'secondary' : 'ghost'} size="sm" className="gap-2">
                <LayoutDashboard className="w-4 h-4" /> Задачи
              </Button>
            </Link>
            {canCreate && (
              <Link href="/tasks/new">
                <Button variant={isActive('/tasks/new') ? 'secondary' : 'ghost'} size="sm" className="gap-2">
                  <PlusCircle className="w-4 h-4" /> Создать
                </Button>
              </Link>
            )}
            <Link href="/profile">
              <Button variant={isActive('/profile') ? 'secondary' : 'ghost'} size="sm" className="gap-2">
                <User className="w-4 h-4" /> Профиль
              </Button>
            </Link>
          </nav>

          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          <span className="font-bold text-primary tracking-tight">
            {title || 'CRMI'}
          </span>
        </div>
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-[10px] font-bold text-primary uppercase">
          {userData?.name?.substring(0, 2)}
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        {title && !router.pathname.includes('/tasks/') && (
          <div className="mb-6 hidden md:block">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          </div>
        )}
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t px-6 py-2 flex justify-between items-center shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
        <Link href="/" className={cn(
          "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
          isActive('/') ? "text-primary" : "text-muted-foreground"
        )}>
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-medium">Задачи</span>
        </Link>
        
        {canCreate && (
          <Link href="/tasks/new" className={cn(
            "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
            isActive('/tasks/new') ? "text-primary" : "text-muted-foreground"
          )}>
            <PlusCircle className="w-6 h-6" />
            <span className="text-[10px] font-medium">Создать</span>
          </Link>
        )}

        <Link href="/profile" className={cn(
          "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
          isActive('/profile') ? "text-primary" : "text-muted-foreground"
        )}>
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Профиль</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;
