'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectMacroEventos() {
  const router = useRouter();

  useEffect(() => {
    router.push('/eventos-nuevo'); 
  }, [router]);

  return null; 
}
