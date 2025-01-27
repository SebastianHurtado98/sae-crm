'use client'

import { PresentationForm } from '@/components/PresentationForm'
import { useParams } from 'next/navigation'

export default function EditPresentationPage() {
  const params = useParams()
  const presentationId = typeof params?.id === 'string' ? parseInt(params.id) : undefined

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-xl font-bold mb-6">Editar presentación</h1>
      <PresentationForm presentationId={presentationId} />
    </div>
  )
}