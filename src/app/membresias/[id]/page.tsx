'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { MembershipDetail } from '@/app/membresias/_types/MembresiasTypes'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'
import { ArrowLeft, Pencil,Check, X } from 'lucide-react'


export default function MembershipDetailsPage() {
  const [membership, setMembership] = useState<MembershipDetail | null>(null)
  const params = useParams()

  const fetchMembership = useCallback(async () => {
    if (typeof params?.id !== 'string') return
    const { data, error } = await supabase
      .from('membership')
      .select(`
        *,
        company:company_id (razon_social)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching membership:', error)
    } else {
      setMembership(data)
    }
  }, [params?.id])

  useEffect(() => {
    fetchMembership()
  }, [fetchMembership])

  if (!membership) return <div>Loading...</div>

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Detalles de la membresía</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Información general</h3>
              <p className="flex items-center">
                <span className="mr-2">Nombre de la membresía:</span>
                {membership.name}
              </p>
              <p className="flex items-center">
                <span className="mr-2">Empresa:</span>
                {membership.company.razon_social}
              </p>
              <p className="flex items-center">
                <span className="mr-2">Tipo de membresía:</span>
                {membership.membership_type}
              </p>
              <p className="flex items-center">
                <span className="mr-2">Membresía por área:</span>
                {membership.area_scope ? membership.area : ''}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Detalles de la membresía</h3>
              <p className="flex items-center">
                <span className="mr-2">Titulares:</span>
                {membership.titulares}
              </p>
              <p className="flex items-center">
                <span className="mr-2">Cupos adicionales:</span>
                {membership.cupos_adicionales}
              </p>
              <p className="flex items-center">
                <span className="mr-2">Titular adicional:</span>
                {membership.titular_adicional}
              </p>
              <p className="flex items-center">
                <span className="mr-2">Cupos foros:</span>
                {membership.cupos_foros}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Servicios incluidos</h3>
            <div className="grid gap-2 md:grid-cols-2">
              <p className="flex items-center">
                {membership.panorama_economico ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
                <span className="mr-2">Panorama económico</span>
              </p>
              <p className="flex items-center">
                {membership.panorama_politico ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
                <span className="mr-2">Panorama político</span>
              </p>
              <p className="flex items-center">
                {membership.informe_sae ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
                <span className="mr-2">Informe SAE</span>
              </p>
              <p className="flex items-center">
                {membership.sae_mercados ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
                <span className="mr-2">SAE Mercados</span>
              </p>
              <p className="flex items-center">
                {membership.daily_note ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
                <span className="mr-2">Daily note</span>
              </p>
              <p className="flex items-center">
                {membership.app_sae ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
                <span className="mr-2">App SAE</span>
              </p>
              <p className="flex items-center">
                {membership.web_sae ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
                <span className="mr-2">Web SAE</span>
              </p>
              <p className="flex items-center">
                {membership.forum_consumer_first_semester ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
                <span className="mr-2">Foro Consumidor 1er semestre</span>
              </p>
              <p className="flex items-center">
                {membership.forum_consumer_second_semester ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
                <span className="mr-2">Foro Consumidor 2do semestre</span>
              </p>
              <p className="flex items-center">
                {membership.forum_sectorial_first_semester ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
                <span className="mr-2">Foro Sectorial 1er semestre</span>
              </p>
              <p className="flex items-center">
                {membership.forum_sectorial_second_semester ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
                <span className="mr-2">Foro Sectorial 2do semestre</span>
              </p>
              <p className="flex items-center">
                {membership.consultas_acceso ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
                <span className="mr-2">Acceso a consultas</span>
              </p>
            </div>
            <p className="flex items-center">
              <span className="mr-2">Cantidad de reuniones:</span>
              {membership.cantidad_reuniones}
            </p>
            <p className="flex items-center">
              <span className="mr-2">Titular virtual:</span>
              {membership.titular_virtual}
            </p>
            <p className="flex items-center">
              <span className="mr-2">Cantidad de presentaciones:</span>
              {membership.cantidad_presentaciones}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Información de Pago</h3>
            <p className="flex items-center">
              
              <span >Fecha de renovación:</span>
              {membership.fecha_renovacion}
            </p>
            <p className="flex items-center">
              <span >Forma de pago:</span>
              {membership.payment_method}
            </p>
            <p className="flex items-center">
              
              <span >Tarifa:</span>
              {`${membership.payment_currency} ${membership.payment_amount}`}
            </p>
            <p className="flex items-center">
              {membership.oc_needed ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
              <span >Necesita O/C</span>
            </p>
            <p className="flex items-center">
              {membership.signed_proposal ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
              <span >Propuesta firmada</span>
            </p>
            <p className="flex items-center">
              {membership.invoice_sent ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
              <span >Factura enviada</span>
            </p>
            <p className="flex items-center">
              {membership.invoice_sent && membership.signed_proposal ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <X className="w-5 h-5 mr-2 text-red-500" />}
              <span >Renovación completa</span>
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Información del Firmante</h3>
            <p className="flex items-center">
              
              <span>Nombre:</span>
              {membership.signer_name}
            </p>
            <p className="flex items-center">
              <span>Email:</span>
              {membership.signer_email}
            </p>
            <p className="flex items-center">
              <span>Teléfono:</span>
              {membership.signer_phone}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Comentarios</h3>
            <p className="flex items-start">
              
              {membership.comments}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/membresias">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/membresias/${membership.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}