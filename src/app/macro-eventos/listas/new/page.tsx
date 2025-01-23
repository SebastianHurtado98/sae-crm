'use client'

import { ListForm } from '@/components/ListForm'
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ListPageContent() {
  const searchParams = useSearchParams();
  const macroEventId = searchParams.get('macroEventId') || '';

  return <ListForm macroEventId={macroEventId} />;
}

export default function NewListPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-xl font-bold mb-5">Agregar Nueva Lista</h1>
      <Suspense fallback={<p>Cargando...</p>}>
        <ListPageContent />
      </Suspense>
    </div>
  )
}