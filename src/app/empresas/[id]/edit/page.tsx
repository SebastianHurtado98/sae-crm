'use client'

import { useParams } from 'next/navigation'
import { CompanyForm } from '@/components/CompanyForm'

export default function EditCompanyPage() {
  const params = useParams()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Editar Empresa</h1>
      <CompanyForm companyId={parseInt(params.id as string)} />
    </div>
  )
}