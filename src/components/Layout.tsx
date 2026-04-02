'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth as useFirebaseCore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, PlusCircle, User, LogOut, ChevronLeft, Loader2, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTheme } from '@/components/ThemeProvider';

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
  const { theme, toggleTheme } = useTheme();

  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');

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

  const canCreate = userData?.role === 'owner' || 
                    userData?.role === 'director' || 
                    userData?.role === 'deputy_director' || 
                    userData?.role === 'head' || 
                    userData?.role === 'inspector';

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
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
    <div className="min-h-screen flex flex-col bg-background pb-24 md:pb-0 transition-colors duration-300">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md hidden md:block">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <Link href="/" className="flex items-center space-x-3">
            {logo && (
              <div className="relative w-10 h-10">
                <Image 
                  src={logo.imageUrl} 
                  alt="CRMI Logo" 
                  fill 
                  className="object-contain"
                  data-ai-hint={logo.imageHint}
                />
              </div>
            )}
            <span className="text-lg font-black tracking-tighter text-primary uppercase">CRMI WORKSPACE</span>
          </Link>
          
          <nav className="flex items-center space-x-1">
            <Link href="/">
              <Button variant={isActive('/') ? 'secondary' : 'ghost'} size="sm" className="gap-2 h-9 font-bold text-[11px] uppercase tracking-wider">
                <LayoutDashboard className="w-4 h-4" /> Список
              </Button>
            </Link>
            {canCreate && (
              <Link href="/tasks/new">
                <Button variant={isActive('/tasks/new') ? 'secondary' : 'ghost'} size="sm" className="gap-2 h-9 font-bold text-[11px] uppercase tracking-wider">
                  <PlusCircle className="w-4 h-4" /> Создать
                </Button>
              </Link>
            )}
            <Link href="/profile">
              <Button variant={isActive('/profile') ? 'secondary' : 'ghost'} size="sm" className="gap-2 h-9 font-bold text-[11px] uppercase tracking-wider">
                <User className="w-4 h-4" /> Профиль
              </Button>
            </Link>
            
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-primary ml-1">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive ml-1">
              <LogOut className="w-5 h-5" />
            </Button>
          </nav>
        </div>
      </header>

      <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          ) : (
            logo && (
              <div className="relative w-8 h-8">
                <Image 
                  src={logo.imageUrl} 
                  alt="CRMI Logo" 
                  fill 
                  className="object-contain"
                  data-ai-hint={logo.imageHint}
                />
              </div>
            )
          )}
          <span className="font-black text-primary tracking-tighter text-sm uppercase">
            {title || 'CRMI WORKSPACE'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
          </Button>
          <Link href="/profile">
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-[11px] font-black text-primary uppercase border border-primary/20">
              {userData?.name?.substring(0, 2)}
            </div>
          </Link>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        {title && !pathname.includes('/tasks/') && (
          <div className="mb-6 hidden md:block border-l-4 border-primary pl-4">
            <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">{title}</h1>
          </div>
        )}
        {children}
      </main>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-background/95 backdrop-blur-md border px-2 py-2 flex justify-around items-center shadow-lg rounded-2xl">
        <Link href="/" className={cn(
          "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
          isActive('/') ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary/60"
        )}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase">Список</span>
        </Link>
        
        {canCreate && (
          <Link href="/tasks/new" className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
            isActive('/tasks/new') ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary/60"
          )}>
            <PlusCircle className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Создать</span>
          </Link>
        )}

        <Link href="/profile" className={cn(
          "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
          isActive('/profile') ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary/60"
        )}>
          <User className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase">Профиль</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;
