'use client'

import { use } from 'react'
import { EventForm } from '@/components/EventForm'

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-xl font-bold mb-5">Editar Evento</h1>
      <EventForm eventId={parseInt(resolvedParams.id)} />
    </div>
  )
}