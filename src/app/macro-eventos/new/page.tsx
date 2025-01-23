'use client'

import { MacroEventForm } from '@/components/MacroEventForm'

export default function NewMacroEventPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-xl font-bold mb-5">Agregar Nuevo Macro Evento</h1>
      <MacroEventForm />
    </div>
  )
}