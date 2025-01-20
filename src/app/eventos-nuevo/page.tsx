'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from 'next/link'
import { PlusCircle, Pencil, ChevronDown, Trash2 } from 'lucide-react'

type MacroEvent = {
    id: number
    name: string
}

/*type List = {
    id: number
    name: string
    macro_event_id: number
}
type Event = {
    id: number
    name: string
    event_type: string
    date_hour: string
    place: string
    register_open: boolean
    macro_event_id: number
}*/

export default function EventosNuevo() {
    const [macroEvents, setMacroEvents] = useState<MacroEvent[]>([])
    
    useEffect(() => {
        fetchEvents()
    }, [])

    async function fetchEvents() {
        const { data, error } = await supabase.from('macro_event').select('*')

        if (error) {
            console.error('Error fetching macro_events:', error)
          } else {
            console.log(data)
            setMacroEvents(data || [])
          }
    }

    async function deleteEvent(macroEventId: number) {
        if (!confirm('¿Estás seguro que quieres borrar este evento? Esta acción no se puede deshacer.')) {
          return
        }
        try {
            const { error: deleteEventError } = await supabase
            .from('macro_event')
            .delete()
            .eq('id', macroEventId)
    
            if (deleteEventError) {
                console.error('Error deleting event:', deleteEventError)
            } else {
                setMacroEvents(macroEvents.filter((macroEvent) => macroEvent.id !== macroEventId))
                alert('Evento eliminado con éxito.')
            }

        } catch (error) {
            console.error('Error in deleteEvent:', error)
        }
    }

    return (
        <div className="container mx-auto py-10">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold">Lista de macro eventos</h1>
              <Button asChild>
                <Link href="/eventos-nuevo/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Agregar macro evento
                </Link>
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Acciones</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {macroEvents.map((macroEvent) => {
                return (
                <TableRow key={macroEvent.id}>
                    <TableCell>{macroEvent.name}</TableCell>
                    <TableCell>
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                        <Link href={`/eventos-nuevo/${macroEvent.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                        </Link>
                        </Button>

                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteEvent(macroEvent.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Borrar</span>
                        </Button>

                        <Button variant="outline" size="sm" asChild>
                        <Link href={`/eventos-nuevo`}>
                            <ChevronDown className="h-4 w-4" />
                            <span className="sr-only">Ver</span>
                        </Link>
                        </Button>                        
                    </div>
                    </TableCell>
                </TableRow>
                )
            })}
            </TableBody>
        </Table>
        </div>
      )
}
