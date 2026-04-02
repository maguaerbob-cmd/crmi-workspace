
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth as useFirebaseCore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAppSettings } from '@/hooks/useAppSettings';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useFirebaseCore();
  const { logo } = useAppSettings();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка входа",
        description: "Неверный логин или пароль",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-2xl border-none bg-white rounded-3xl overflow-hidden">
        <div className="h-1.5 bg-slate-900" />
        <CardHeader className="space-y-1 text-center pt-10">
          <div className="flex justify-center mb-6">
            {logo && (
              <div className="relative w-24 h-24">
                <Image 
                  src={logo} 
                  alt="CRMI Logo" 
                  fill 
                  className="object-contain"
                />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Авторизация</CardTitle>
          <CardDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
            Введите данные для входа
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-slate-200 bg-slate-50 focus-visible:ring-slate-900/10 rounded-xl font-bold text-slate-900 placeholder:text-slate-300"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Пароль</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-slate-200 bg-slate-50 focus-visible:ring-slate-900/10 rounded-xl font-bold text-slate-900"
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Войти в систему"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center bg-slate-50 p-6 border-t border-slate-100">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-slate-900 hover:underline">
              Создать профиль
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
