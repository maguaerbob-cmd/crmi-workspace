
'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, DocumentReference } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function useAppSettings() {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'settings', 'app');
  }, [db]);

  const { data: settings, isLoading } = useDoc(settingsRef as DocumentReference);

  const defaultLogo = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;
  const logo = settings?.logoURL || defaultLogo;

  return { logo, isLoading };
}
