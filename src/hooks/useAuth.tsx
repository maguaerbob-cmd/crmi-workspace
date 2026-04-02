import React, { createContext, useContext, useMemo } from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, DocumentReference } from 'firebase/firestore';
import { Role } from '@/lib/constants';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string;
  createdAt: string;
}

interface AuthContextType {
  user: any | null;
  userData: UserData | null;
  loading: boolean;
  authenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userData: null, 
  loading: true,
  authenticated: false 
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc<UserData>(userDocRef as DocumentReference);

  const value = useMemo(() => ({
    user,
    userData: profileData,
    loading: isUserLoading || (!!user && isProfileLoading),
    authenticated: !!user && !!profileData,
  }), [user, profileData, isUserLoading, isProfileLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
