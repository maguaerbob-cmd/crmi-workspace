import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { LogOut, User, Plus, LayoutDashboard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Layout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => {
  const { userData, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) return null;

  if (!userData && !['/login', '/register'].includes(router.pathname)) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold">C</div>
            <span className="text-xl font-headline text-primary">CRMI WORKSPACE</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <LayoutDashboard className="w-4 h-4" /> Задачи
            </Link>
            {(userData?.role === 'owner' || userData?.role === 'head' || userData?.role === 'inspector') && (
              <Link href="/tasks/new" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                <Plus className="w-4 h-4" /> Создать
              </Link>
            )}
            {userData?.role === 'owner' && (
              <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Админ
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-semibold">{userData?.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{userData?.department}</span>
            </div>
            <Avatar className="h-8 w-8 border border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {userData?.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Выйти">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {title && (
          <div className="mb-8">
            <h1 className="text-3xl font-headline">{title}</h1>
            {userData?.department && (
              <p className="text-muted-foreground">{userData.department}</p>
            )}
          </div>
        )}
        {children}
      </main>

      <footer className="border-t bg-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CRMI WORKSPACE. Все права защищены.
        </div>
      </footer>
    </div>
  );
};

export default Layout;