
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useAuth as useFirebaseCore, updateDocumentNonBlocking, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Building, ShieldCheck, Mail, Calendar, Edit2, Check, X, Camera, Loader2 } from 'lucide-react';
import { DEPARTMENTS, ROLE_LABELS, Role } from '@/lib/constants';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { userData } = useAuth();
  const auth = useFirebaseCore();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');

  useEffect(() => {
    if (userData) {
      setEditName(userData.name || '');
      setEditPhotoURL(userData.photoURL || '');
    }
  }, [userData]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleSave = () => {
    if (!userData || !db) return;
    updateDocumentNonBlocking(doc(db, 'userProfiles', userData.id), {
      name: editName,
      photoURL: editPhotoURL
    });
    setIsEditing(false);
    toast({
      title: "ПРОФИЛЬ ОБНОВЛЕН",
      description: "Ваши данные были успешно сохранены в системе."
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // Лимит 1MB для Firestore Base64
      toast({
        variant: "destructive",
        title: "ФАЙЛ СЛИШКОМ БОЛЬШОЙ",
        description: "Пожалуйста, выберите изображение размером менее 1 МБ."
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setEditPhotoURL(base64String);
      setIsUploading(false);
      toast({
        title: "ФОТО ВЫБРАНО",
        description: "Нажмите 'Сохранить', чтобы применить изменения."
      });
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast({
        variant: "destructive",
        title: "ОШИБКА ЧТЕНИЯ",
        description: "Не удалось прочитать файл."
      });
    };
    reader.readAsDataURL(file);
  };

  const currentDepartment = DEPARTMENTS.find(d => d.id === userData?.departmentId);

  return (
    <Layout title="Профиль">
      <div className="max-w-xl mx-auto space-y-6">
        <Card className="border-none shadow-sm overflow-hidden bg-card rounded-3xl">
          <div className="h-16 bg-muted/30 border-b flex items-center justify-center">
            {logo && (
              <div className="relative w-8 h-8 opacity-80">
                <Image 
                  src={logo.imageUrl} 
                  alt="CRMI Logo" 
                  fill 
                  className="object-contain"
                  data-ai-hint={logo.imageHint}
                />
              </div>
            )}
          </div>
          
          <CardContent className="pt-8 px-6 pb-8">
            <div className="flex flex-col items-center mb-8 relative">
              <div className="relative group">
                <Avatar className="h-24 w-24 mb-4 shadow-sm border-4 border-background overflow-hidden">
                  <AvatarImage src={isEditing ? editPhotoURL : userData?.photoURL} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-black uppercase">
                    {userData?.name?.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                {isEditing && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full transition-opacity opacity-0 group-hover:opacity-100"
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                  </button>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>
              
              {!isEditing ? (
                <>
                  <h2 className="text-xl font-black text-foreground tracking-tight uppercase flex items-center gap-2">
                    {userData?.name}
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </h2>
                  <div className="mt-2">
                    <Badge variant="secondary" className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] bg-primary/10 text-primary border-none">
                      {ROLE_LABELS[userData?.role as Role] || 'Сотрудник'}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="w-full space-y-4 px-4">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Имя в системе</Label>
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-10 text-sm font-bold rounded-xl"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      className="h-10 rounded-xl text-[9px] font-black uppercase tracking-widest border-2" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Camera className="w-3 h-3 mr-2" /> 
                      {editPhotoURL ? "Изменить фото" : "Загрузить из галереи"}
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button className="flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest" onClick={handleSave}>
                        <Check className="w-3 h-3 mr-1" /> Сохранить
                      </Button>
                      <Button variant="outline" className="flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest border-2" onClick={() => setIsEditing(false)}>
                        <X className="w-3 h-3 mr-1" /> Отмена
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-transparent">
                <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-0.5">Email</p>
                  <p className="text-sm font-bold text-foreground truncate">{userData?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-transparent">
                <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Building className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-0.5">Отдел</p>
                  <p className="text-sm font-bold text-foreground truncate">
                    {currentDepartment?.label || userData?.departmentId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-transparent">
                <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-0.5">Регистрация</p>
                  <p className="text-sm font-bold text-foreground">
                    {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('ru-RU') : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3">
              {userData?.role === 'owner' && (
                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 hover:bg-primary/5 text-primary"
                  onClick={() => router.push('/admin')}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" /> Панель управления
                </Button>
              )}
              <Button 
                variant="default" 
                className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" /> Выйти из системы
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
