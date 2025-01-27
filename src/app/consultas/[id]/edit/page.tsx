'use client'

import { QueryForm } from '@/components/QueryForm'
import { useParams } from 'next/navigation'

export default function EditQueryPage() {
  const params = useParams()
  const queryId = typeof params?.id === 'string' ? parseInt(params.id) : undefined

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-xl font-bold mb-4">Editar consulta</h1>
      <QueryForm queryId={queryId} />
    </div>
  )
}