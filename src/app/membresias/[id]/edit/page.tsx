'use client'

import { useParams } from 'next/navigation'
import { MembershipForm } from '@/components/MembershipForm'

export default function EditMembershipPage() {
  const params = useParams()
  const membershipId = typeof params?.id === 'string' ? parseInt(params.id) : undefined

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-xl font-bold mb-5">Editar membresía</h1>
      <MembershipForm membershipId={membershipId} />
    </div>
  )
}