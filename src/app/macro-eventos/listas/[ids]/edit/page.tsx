'use client'

import { ListForm } from '@/components/ListForm'
import { use } from 'react'

export default function EditEventPage({ params }: { params: Promise<{ ids: string }> }) {
  const resolvedParams = use(params)
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-xl font-bold mb-5">Editar Evento</h1>
      <ListForm listId={parseInt(resolvedParams.ids)} />
    </div>
  )
}