'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Assistant } from '@/app/secretarias/_types/SecretariasTypes'
import { Card, CardContent } from "@/components/ui/card"
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'



export default function AssistantDetailsPage() {
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const params = useParams()

  const fetchAssistant = useCallback(async () => {
    if (typeof params?.id !== 'string') return
    const { data, error } = await supabase
      .from('assistant')
      .select(`
        *,
        company:company_id (razon_social)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching assistant:', error)
    } else {
      setAssistant(data)
    }
  }, [params?.id])

  useEffect(() => {
    fetchAssistant()
  }, [fetchAssistant])

  if (!assistant) return <div>Loading...</div>

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

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Detalles de la secretaria</h1>
        <div className="space-x-2">
          <Button variant="outline" asChild>
            <Link href="/secretarias">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/secretarias/${assistant.id}/edit`}>
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
                <h3 className="text-xl font-semibold">Información personal</h3>
                <p className="flex items-center">
                Nombre: {assistant.name} {assistant.last_name}
                </p>
                <p className="flex items-center">
                DNI: {assistant.dni}
                </p>
                <p className="flex items-center">
                Email: {assistant.email}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Información laboral</h3>
                <p className="flex items-center">
                Empresa: {assistant.company.razon_social}
                </p>
              </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Contacto</h3>
                <p className="flex items-center">
                Teléfono de oficina: {formatPhoneNumber(assistant.cc_office_phone, assistant.office_phone, assistant.office_phone_extension)}
                </p>
                <p className="flex items-center">
                Celular: {formatPhoneNumber(assistant.cc_mobile_phone, assistant.mobile_phone)}
                </p>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}