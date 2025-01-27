'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'
import { ArrowLeft, Pencil, Building, User, Users, FileText, Calendar, Briefcase } from 'lucide-react'

type Query = {
  id: number
  company_id: number
  executive_id: number | null
  other_executive: boolean
  other_fullname: string | null
  other_email: string | null
  assignee: string[]
  description: string
  solved_date: string | null
  company: {
    razon_social: string
  }
  executive: {
    name: string
    last_name: string
    position: string
  }
}

export default function QueryDetailsPage() {
  const [query, setQuery] = useState<Query | null>(null)
  const params = useParams()

  const fetchQuery = useCallback(async () => {
    if (typeof params?.id !== 'string') return
    const { data, error } = await supabase
      .from('query')
      .select(`
        *,
        company:company_id (razon_social),
        executive:executive_id (name, last_name, position)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching query:', error)
    } else {
      setQuery(data)
    }
  }, [params?.id])

  useEffect(() => {
    fetchQuery()
  }, [fetchQuery])

  if (!query) return <div>Loading...</div>

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Detalles de la consulta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-gray-500" />
            <span >Empresa:</span>
            <span>{query.company.razon_social}</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-500" />
            <span >Solicitante:</span>
            {query.other_executive ? (
              <span>{query.other_fullname}</span>
            ) : (
              <span>{`${query.executive.name} ${query.executive.last_name}`}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-gray-500" />
            <span >Cargo del solicitante:</span>
            {query.other_executive ? (
              <span>No disponible</span>
            ) : (
              <span>{query.executive.position}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-500" />
            <span >Encargado:</span>
            <span>{query.assignee.join(', ')}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <span >Descripción:</span>
            </div>
            <p className="pl-7">{query.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span >Fecha de resolución:</span>
            <span>{query.solved_date || 'Pendiente'}</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/consultas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/consultas/${query.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}