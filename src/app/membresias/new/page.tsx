'use client'

import { MembershipForm } from '@/components/MembershipForm'

export default function NewMembershipPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Crear nueva membresía</h1>
      <MembershipForm />
    </div>
  )
}