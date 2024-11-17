'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { PlusCircle, Eye, Pencil, Trash2 } from 'lucide-react'

type Assistant = {
  id: number
  dni: string
  name: string
  last_name: string
  email: string
  company_id: number
  company: {
    razon_social: string
  }
}

export default function SecretariasPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([])

  useEffect(() => {
    fetchAssistants()
  }, [])

  async function fetchAssistants() {
    const { data, error } = await supabase
      .from('assistant')
      .select(`
        *,
        company:company_id (razon_social)
      `)
    
    if (error) {
      console.error('Error fetching assistants:', error)
    } else {
      setAssistants(data || [])
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Lista de Secretarias</h1>
        <Button asChild>
          <Link href="/secretarias/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Secretaria
          </Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>DNI</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Apellido</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assistants.map((assistant) => (
            <TableRow key={assistant.id}>
              <TableCell>{assistant.dni}</TableCell>
              <TableCell>{assistant.name}</TableCell>
              <TableCell>{assistant.last_name}</TableCell>
              <TableCell>{assistant.email}</TableCell>
              <TableCell>{assistant.company.razon_social}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/secretarias/${assistant.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/secretarias/${assistant.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Borrar</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}