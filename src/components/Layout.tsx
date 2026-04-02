
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth as useFirebaseCore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, PlusCircle, User, LogOut, ChevronLeft, Loader2, Moon, Sun, Users, LogIn } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { useTheme } from '@/components/ThemeProvider';
import { useAppSettings } from '@/hooks/useAppSettings';

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
  const { logo } = useAppSettings();

  useEffect(() => {
    // Главная страница ('/') теперь доступна всем. Редирект только для защищенных страниц.
    const publicPaths = ['/login', '/register', '/'];
    if (!loading && !user && !publicPaths.includes(pathname)) {
      router.push('/login');
    }
  }, [loading, user, router, pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  const canCreate = user && (userData?.role === 'owner' || 
                    userData?.role === 'director' || 
                    userData?.role === 'deputy_director' || 
                    userData?.role === 'head' || 
                    userData?.role === 'inspector');

  const canSeeStaff = user && (userData?.role === 'owner' || 
                      userData?.role === 'director' || 
                      userData?.role === 'deputy_director' || 
                      userData?.role === 'head');

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <div className="relative">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl animate-pulse" />
        <Loader2 className="w-8 h-8 text-primary animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">Загрузка системы...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background pb-24 md:pb-0 transition-colors duration-300">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md hidden md:block">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <Link href="/" className="flex items-center space-x-3">
            {logo && (
              <div className="relative w-10 h-10">
                <Image 
                  src={logo} 
                  alt="CRMI Logo" 
                  fill 
                  className="object-contain"
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

            {canSeeStaff && (
              <Link href="/admin">
                <Button variant={isActive('/admin') ? 'secondary' : 'ghost'} size="sm" className="gap-2 h-9 font-bold text-[11px] uppercase tracking-wider">
                  <Users className="w-4 h-4" /> Сотрудники
                </Button>
              </Link>
            )}
            
            <div className="w-px h-6 bg-border mx-2" />

            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-primary mr-1">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {user ? (
              <>
                <Link href="/profile">
                  <Avatar className={cn(
                    "h-8 w-8 transition-all hover:ring-2 hover:ring-primary/20",
                    isActive('/profile') && "ring-2 ring-primary"
                  )}>
                    <AvatarImage src={userData?.photoURL} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black uppercase">
                      {userData?.name?.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive ml-1">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="default" size="sm" className="h-9 font-bold text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-4 rounded-xl">
                  <LogIn className="w-3.5 h-3.5 mr-2" /> Войти
                </Button>
              </Link>
            )}
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
                  src={logo} 
                  alt="CRMI Logo" 
                  fill 
                  className="object-contain"
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
          {user ? (
            <Link href="/profile">
              <Avatar className="h-9 w-9 border-2 border-primary/10">
                <AvatarImage src={userData?.photoURL} className="object-cover" />
                <AvatarFallback className="text-[11px] font-black text-primary uppercase">
                  {userData?.name?.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <LogIn className="w-5 h-5 text-primary" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        {title && !pathname.includes('/tasks/') && !pathname.includes('/admin') && (
          <div className="mb-6 hidden md:block border-l-4 border-primary pl-4">
            <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">{title}</h1>
          </div>
        )}
        {children}
      </main>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-background/95 backdrop-blur-md border px-2 py-2 flex justify-around items-center shadow-lg rounded-2xl">
        <Link href="/" className={cn(
          "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
          isActive('/') ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary/60"
        )}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase">Задачи</span>
        </Link>
        
        {canCreate && (
          <Link href="/tasks/new" className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
            isActive('/tasks/new') ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary/60"
          )}>
            <PlusCircle className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase">Создать</span>
          </Link>
        )}

        {canSeeStaff && (
          <Link href="/admin" className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
            isActive('/admin') ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary/60"
          )}>
            <Users className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase">Штат</span>
          </Link>
        )}

        <Link href={user ? "/profile" : "/login"} className={cn(
          "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
          (isActive('/profile') || isActive('/login')) ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary/60"
        )}>
          {user ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
          <span className="text-[9px] font-black uppercase">{user ? "Профиль" : "Войти"}</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;
