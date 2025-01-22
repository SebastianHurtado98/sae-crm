'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { Eye, PlusCircle} from 'lucide-react'

type List = {
  id: number
  name: string
  macro_event_id: number
}

export default function EventosPage() {
  const [lists, setLists] = useState<List[]>([])

  useEffect(() => {
    fetchLists()
  }, [])

  async function fetchLists() {    
    const { data, error } = await supabase.from('list').select('*')

    if (error) {
      console.error('Error fetching lists:', error)
    } else {
      setLists(data || [])
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Listas de Invitados</h1>
        </div>
        <Button asChild>
            <Link href="/eventos/listas/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar lista
            </Link>
          </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lists.map((list) => (
            <TableRow key={list.id}>
              <TableCell>{list.name}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/eventos/listas/${list.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver</span>
                    </Link>
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