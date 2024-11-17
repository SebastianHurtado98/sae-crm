'use client'

import { useParams } from 'next/navigation'
import { AssistantForm } from '@/components/AssistantForm'

export default function EditAssistantPage() {
  const params = useParams()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Editar Secretaria</h1>
      <AssistantForm assistantId={parseInt(params.id as string)} />
    </div>
  )
}