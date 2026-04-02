import React, { createContext, useContext, useMemo } from 'react';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc, DocumentReference } from 'firebase/firestore';
import { Role, Department } from '@/lib/constants';

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
}

const AuthContext = createContext<AuthContextType>({ user: null, userData: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'userProfiles', user.uid);
  }, [db, user]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc<UserData>(userDocRef as DocumentReference);

  const value = useMemo(() => ({
    user,
    userData: profileData,
    loading: isUserLoading || isProfileLoading,
  }), [user, profileData, isUserLoading, isProfileLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
