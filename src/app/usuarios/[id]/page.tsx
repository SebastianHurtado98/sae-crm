'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { ArrowLeft, Pencil, User } from 'lucide-react'

type Executive = {
  id: number
  dni: string
  name: string
  last_name: string
  company_id: number
  assistant_id: number
  tareco: string
  birth_date: string
  country: string
  email: string
  position: string
  area: string
  user_type: string
  active: boolean
  office_phone_cc: string
  office_phone: string
  office_phone_extension: string
  mobile_phone_cc: string
  mobile_phone: string
  start_date: string
  end_date: string | null
  company: {
    razon_social: string
  }
  assistant: {
    name: string
    last_name: string
    cc_office_phone: string
    office_phone: string
    office_phone_extension: string
    cc_mobile_phone: string
    mobile_phone: string
  }
  membership: {
    name: string
    membership_type: string
  } | null
  reemplaza_a: number | null
  reemplazado_executive?: {
    name: string
    last_name: string
  }
  sae_meetings: string[] | null
}

export default function ExecutiveDetailsPage() {
  const [executive, setExecutive] = useState<Executive | null>(null)
  const params = useParams()

  const fetchExecutive = useCallback(async () => {
    if (typeof params?.id !== 'string') return
    const { data, error } = await supabase
      .from('executive')
      .select(`
        *,
        company:company_id (razon_social),
        assistant:assistant_id (
          name,
          last_name,
          cc_office_phone,
          office_phone,
          office_phone_extension,
          cc_mobile_phone,
          mobile_phone
        ),
        membership:membership_id (name, membership_type),
        reemplazado_executive:reemplaza_a (name, last_name)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching executive:', error)
    } else {
      setExecutive(data)
    }
  }, [params?.id])

  useEffect(() => {
    fetchExecutive()
  }, [fetchExecutive])

  if (!executive) return <div>Loading...</div>

  function formatPhoneNumber(cc: string | null = '', phone: string | null = '', extension?: string | null): string {
    const cleanedCc = (cc ?? '').trim(); // Usa '' si cc es null o undefined
    const cleanedPhone = (phone ?? '').trim(); // Usa '' si phone es null o undefined
    const cleanedExtension = (extension ?? '').trim(); // Usa '' si extension es null o undefined
    // Formatear el número telefónico
    let formattedPhone = `${cleanedCc} ${cleanedPhone}`.trim(); // Elimina espacios innecesarios
    if (cleanedExtension) {
      formattedPhone += ` (${cleanedExtension})`;
    }
    return formattedPhone;
  }
  

  function formatSaeMeetings(meetings: string[] | null): string {
    if (!meetings || meetings.length === 0) {
      return 'No asignado'
    }
    return meetings.join(', ')
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Detalles del usuario</h1>
        <div className="space-x-2">
          <Button variant="outline" asChild>
            <Link href="/usuarios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/usuarios/${executive.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>


      <Card>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 ">
              <h3 className="text-xl font-semibold">Información personal</h3>
              <p className="flex items-center">
                Nombre: {executive.name} {executive.last_name}
              </p>
              <p className="flex items-center">
                DNI: {executive.dni}
              </p>
              <p className="flex items-center">
                Tareco: {executive.tareco}
              </p>
              <p className="flex items-center">
                Fecha de nacimiento: {executive.birth_date}
              </p>
              <p className="flex items-center">
                País: {executive.country}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Información laboral</h3>
              <p className="flex items-center">
                Empresa: {executive.company?.razon_social}
              </p>
              <p className="flex items-center">
                Membresía: {executive.membership ? executive.membership.membership_type : 'No asignado'}
              </p>
              <p className="flex items-center">
                Cargo: {executive.position}
              </p>
              <p className="flex items-center">
                Área: {executive.area}
              </p>
              <p className="flex items-center">
                Tipo de usuario: {executive.user_type}
              </p>
              <p className="flex items-center">
                Reuniones SAE: {formatSaeMeetings(executive.sae_meetings)}
              </p>
              <p className="flex items-center">Status: <Badge variant={executive.active ? "default" : "secondary"}>{executive.active ? 'Activo' : 'No activo'}</Badge></p>
              {executive.reemplaza_a && executive.reemplazado_executive && (
                <p><User className="inline mr-2" /> Reemplaza a: {`${executive.reemplazado_executive.name} ${executive.reemplazado_executive.last_name}`}</p>
              )}
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 ">
              <h3 className="text-xl font-semibold">Contacto</h3>
              <p className="flex items-center">
              Teléfono: {formatPhoneNumber(executive.office_phone_cc, executive.office_phone, executive.office_phone_extension)}
              </p>
              <p className="flex items-center">
              Celular: {formatPhoneNumber(executive.mobile_phone_cc, executive.mobile_phone)}
              </p>
              <p className="flex items-center">
              Email: {executive.email}
              </p>
              <p className="flex items-center">
              Secretaria: {executive.assistant_id !== null
                ? `${executive.assistant.name} ${executive.assistant.last_name}`
                : ""}
              </p>
              <p className="flex items-center">
              Teléfono de secretaria: {formatPhoneNumber(executive.assistant?.cc_office_phone, executive.assistant?.office_phone, executive.assistant?.office_phone_extension)}
              </p>
              <p className="flex items-center">
              Celular de secretaria: {formatPhoneNumber(executive.assistant?.cc_mobile_phone, executive.assistant?.mobile_phone)}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Fechas importantes</h3>
              <p className="flex items-center">
              Fecha de ingreso: {executive.start_date}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}