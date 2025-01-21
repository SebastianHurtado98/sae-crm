'use client'

import { ListForm } from '@/components/ListForm'

export default function NewListPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-xl font-bold mb-5">Agregar Nueva Lista</h1>
      <ListForm />
    </div>
  )
}