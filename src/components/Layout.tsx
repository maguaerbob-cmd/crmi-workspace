'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth as useFirebaseCore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, PlusCircle, User, LogOut, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title, showBack }) => {
  const { userData, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useFirebaseCore();

  useEffect(() => {
    if (!loading && !user && !['/login', '/register'].includes(pathname)) {
      router.push('/login');
    }
  }, [loading, user, router, pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  // Теперь и руководитель (head), и инспектор (inspector) видят кнопку создания
  const canCreate = userData?.role === 'owner' || userData?.role === 'head' || userData?.role === 'inspector';

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] gap-4">
      <div className="relative">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl animate-pulse" />
        <Loader2 className="w-8 h-8 text-primary animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">Загрузка системы...</p>
    </div>
  );

  if (!user && !['/login', '/register'].includes(pathname)) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8] pb-24 md:pb-0">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md hidden md:block">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-sm">C</div>
            <span className="text-lg font-bold tracking-tight text-primary">CRMI WORKSPACE</span>
          </Link>
          
          <nav className="flex items-center space-x-1">
            <Link href="/">
              <Button variant={isActive('/') ? 'secondary' : 'ghost'} size="sm" className="gap-2 h-9">
                <LayoutDashboard className="w-4 h-4" /> Список
              </Button>
            </Link>
            {canCreate && (
              <Link href="/tasks/new">
                <Button variant={isActive('/tasks/new') ? 'secondary' : 'ghost'} size="sm" className="gap-2 h-9">
                  <PlusCircle className="w-4 h-4" /> Создать
                </Button>
              </Link>
            )}
            <Link href="/profile">
              <Button variant={isActive('/profile') ? 'secondary' : 'ghost'} size="sm" className="gap-2 h-9">
                <User className="w-4 h-4" /> Профиль
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive ml-2">
              <LogOut className="w-5 h-5" />
            </Button>
          </nav>
        </div>
      </header>

      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          ) : (
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">C</div>
          )}
          <span className="font-bold text-primary tracking-tight text-base">
            {title || 'CRMI WORKSPACE'}
          </span>
        </div>
        <Link href="/profile">
          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-[11px] font-bold text-primary uppercase border border-primary/20">
            {userData?.name?.substring(0, 2)}
          </div>
        </Link>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        {title && !pathname.includes('/tasks/') && (
          <div className="mb-6 hidden md:block">
            <h1 className="text-2xl font-bold tracking-tight text-[#1a2b3c]">{title}</h1>
          </div>
        )}
        {children}
      </main>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-white/95 backdrop-blur-md border px-2 py-2 flex justify-around items-center shadow-lg rounded-2xl">
        <Link href="/" className={cn(
          "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
          isActive('/') ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary/60"
        )}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold">Список</span>
        </Link>
        
        {canCreate && (
          <Link href="/tasks/new" className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
            isActive('/tasks/new') ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary/60"
          )}>
            <PlusCircle className="w-5 h-5" />
            <span className="text-[10px] font-bold">Создать</span>
          </Link>
        )}

        <Link href="/profile" className={cn(
          "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
          isActive('/profile') ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary/60"
        )}>
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Профиль</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;