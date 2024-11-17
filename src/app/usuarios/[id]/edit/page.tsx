'use client'

import { useParams } from 'next/navigation'
import { ExecutiveForm } from '@/components/ExecutiveForm'

export default function EditExecutivePage() {
  const params = useParams()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Editar Usuario</h1>
      <ExecutiveForm executiveId={parseInt(params.id as string)} />
    </div>
  )
}