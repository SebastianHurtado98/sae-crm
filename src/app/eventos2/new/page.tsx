"use client"

import React, { Suspense } from 'react'
import { EventForm } from '@/components/EventForm'
import { SearchParamsHandler } from '@/components/SearchParamsHandler'

export default function NewEventPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-xl font-bold mb-5">Agregar Nuevo Evento</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SearchParamsHandler>
          {(copyEventId) => <EventForm copyEventId={copyEventId} />}
        </SearchParamsHandler>
      </Suspense>
    </div>
  )
}