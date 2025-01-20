'use client'

import { useParams } from 'next/navigation'
import { MacroEventForm } from '@/components/MacroEventForm'

export default function EditMacroEventPage() {
  const params = useParams()
  const macroEventId = typeof params.id === 'string' ? parseInt(params.id) : undefined

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-xl font-bold mb-5">Editar Macro Evento</h1>
      <MacroEventForm macroEventId={macroEventId} />
    </div>
  )
}