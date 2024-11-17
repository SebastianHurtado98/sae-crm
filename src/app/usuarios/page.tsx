'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { PlusCircle, Eye, Pencil, Trash2 } from 'lucide-react'

type Executive = {
  id: number
  dni: string
  name: string
  last_name: string
  assistant_id: number
  company_id: number
  company: {
    razon_social: string
  }
  assistant: {
    name: string
    last_name: string
  }
}

export default function UsuariosPage() {
  const [executives, setExecutives] = useState<Executive[]>([])

  useEffect(() => {
    fetchExecutives()
  }, [])

  async function fetchExecutives() {
    const { data, error } = await supabase
      .from('executive')
      .select(`
        *,
        company:company_id (razon_social),
        assistant:assistant_id (name, last_name)
      `)
    
    if (error) {
      console.error('Error fetching executives:', error)
    } else {
      setExecutives(data || [])
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Lista de Usuarios</h1>
        <Button asChild>
          <Link href="/usuarios/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Usuario
          </Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>DNI</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Apellido</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Secretaria</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {executives.map((executive) => (
            <TableRow key={executive.id}>
              <TableCell>{executive.dni}</TableCell>
              <TableCell>{executive.name}</TableCell>
              <TableCell>{executive.last_name}</TableCell>
              <TableCell>{executive.company.razon_social}</TableCell>
              <TableCell>{`${executive.assistant.name} ${executive.assistant.last_name}`}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/usuarios/${executive.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/usuarios/${executive.id}/edit`}>
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