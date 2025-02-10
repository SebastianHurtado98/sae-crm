'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { PresentationDetail } from '@/app/presentaciones/_types/PresentacionesTypes'
import { Card, CardContent } from "@/components/ui/card"
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'



export default function PresentationDetailsPage() {
  const [presentation, setPresentation] = useState<PresentationDetail | null>(null)
  const params = useParams()

  const fetchPresentation = useCallback(async () => {
    if (typeof params?.id !== 'string') return
    const { data, error } = await supabase
      .from('presentation')
      .select(`
        *,
        company:company_id (razon_social),
        executive:executive_id (name, last_name, position)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching presentation:', error)
    } else {
      setPresentation(data)
    }
  }, [params?.id])

  useEffect(() => {
    fetchPresentation()
  }, [fetchPresentation])

  if (!presentation) return <div>Loading...</div>

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Detalles de la presentación</h1>
        <div className="space-x-2">
          <Button variant="outline" asChild>
            <Link href="/presentaciones">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/presentaciones/${presentation.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 ">
                <h3 className="text-xl font-semibold">Información general</h3>
                <p className="flex items-center">
                  Empresa: {presentation.company.razon_social}
                </p>
                {presentation.other_executive ? (
                  <p>Solicitante: {presentation.other_fullname}</p>
                ) : (
                  <p>Solicitante: {`${presentation.executive.name} ${presentation.executive.last_name}`}</p>
                )}
                {presentation.other_executive ? (
                  <p>Cargo: No disponible</p>
                ) : (
                  <p>Cargo: {presentation.executive.position}</p>
                )}
                <p className="flex items-center">
                  Origen de solicitud: {presentation.order_source}
                </p>
                <p className="flex items-center">
                  Fecha de ingreso: {presentation.order_date}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Detalles de la presentación</h3>
                <p className="flex items-center">
                  Fecha y hora: {presentation.presentation_date_hour}
                </p>
                <p className="flex items-center">
                  Tipo: {presentation.presentation_type}
                </p>
                <p className="flex items-center">
                  Modalidad: {presentation.modalidad}
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 ">
                <h3 className="text-xl font-semibold">Responsables y expositores</h3>
                <p className="flex items-center">
                  Responsable(s) de la elaboración: {presentation.elaboration_assignee.join(', ')}
                </p>
                <p className="flex items-center">
                  Expositor(es): {presentation.presentation_assignee.join(', ')}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Facturación</h3>
                <p className="flex items-center">
                  Facturable: {presentation.billable ? 'Sí' : 'No'}
                </p>
                {presentation.billable && (
                  <>
                    <p>Moneda: {presentation.billable_currency}</p>
                    <p>Monto: {presentation.billable_amount?.toFixed(2)}</p>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2 ">
                <h3 className="text-xl font-semibold">Comentarios</h3>
                <p className="flex items-center">
                {presentation.comments}
                </p>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}