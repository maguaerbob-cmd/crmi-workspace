
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useFirebaseCore, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { DEPARTMENTS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAppSettings } from '@/hooks/useAppSettings';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useFirebaseCore();
  const firestore = useFirestore();
  const { logo } = useAppSettings();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId) {
      toast({ variant: "destructive", title: "Ошибка", description: "Выберите отдел" });
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const profileData = {
        id: user.uid,
        name,
        email,
        departmentId,
        role: 'reader',
        isApproved: false,
        createdAt: new Date().toISOString()
      };

      setDocumentNonBlocking(doc(firestore, 'userProfiles', user.uid), profileData, { merge: true });
      
      toast({
        title: "Заявка отправлена",
        description: "Ваш профиль ожидает одобрения администратором.",
      });

      router.push('/');
    } catch (error: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Ошибка регистрации",
        description: "Пользователь с таким email уже существует или пароль слишком простой",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
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
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Регистрация</CardTitle>
          <CardDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
            Рабочее пространство CRMI
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Полное имя</Label>
              <Input 
                id="name" 
                placeholder="Иванов Иван Иванович" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 border-slate-200 bg-slate-50 focus-visible:ring-slate-900/10 rounded-xl font-bold text-slate-900 placeholder:text-slate-300"
              />
            </div>
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
            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ваш отдел</Label>
              <Select onValueChange={setDepartmentId}>
                <SelectTrigger className="h-12 border-slate-200 bg-slate-50 rounded-xl font-bold text-slate-900">
                  <SelectValue placeholder="Выберите из списка" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id} className="text-xs font-bold text-slate-900">{dept.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Зарегистрироваться"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center bg-slate-50 p-6 border-t border-slate-100">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Уже зарегистрированы?{" "}
            <Link href="/login" className="text-slate-900 hover:underline">
              Войти в систему
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
