'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from 'next/link'
import { PlusCircle, Pencil, ChevronDown, Trash2, Eye } from 'lucide-react'

type MacroEvent = {
    id: number
    name: string
}

type List = {
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
}

export default function EventosNuevo() {
    const [macroEvents, setMacroEvents] = useState<MacroEvent[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
    const [lists, setLists] = useState<List[]>([])
    const [filteredLists, setFilteredLists] = useState<List[]>([])
    const [expandedMacroEvent, setExpandedMacroEvent] = useState<number | null>(null)
    
    useEffect(() => {
        fetchEvents()
    }, [])

    async function fetchEvents() {
        const { data: dataMacroEvent, error: errorMacroEvent } = await supabase
        .from('macro_event')
        .select('*')
        .order('created_at', { ascending: true })

        if (errorMacroEvent) {
            console.error('Error fetching macro_events:', errorMacroEvent)
          } else {
            console.log(dataMacroEvent)
            setMacroEvents(dataMacroEvent || [])
        }

        const { data: dataEvent, error: errorEvent } = await supabase.from('event').select('*').order('date_hour', { ascending: true })

        if (errorEvent) {
            console.error('Error fetching events:', errorEvent)
          } else {
            console.log(dataEvent)
            setEvents(dataEvent || [])
        }

        const { data: dataList, error: errorList } = await supabase.from('list').select('*')

        if (errorList) {
            console.error('Error fetching lists:', errorList)
          } else {
            console.log(dataList)
            setLists(dataList || [])
        }
    }

    async function deleteMacroEvent(macroEventId: number) {
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

    async function deleteList(listId: number) {
        if (!confirm('¿Estás seguro que quieres borrar esta lista? Esta acción no se puede deshacer.')) {
          return
        }
        try {
            await deleteListRelated(listId)

            const { error: deleteListError } = await supabase
            .from('list')
            .delete()
            .eq('id', listId)
    
            if (deleteListError) {
                console.error('Error deleting list:', deleteListError)
            } else {
                setFilteredLists(filteredLists.filter((list) => list.id !== listId))
                alert('Lista eliminada con éxito.')
            }

        } catch (error) {
            console.error('Error in deleteList:', error)
        }
    }

    async function deleteListRelated(listId: number) {
        const { data: guestData, error: guestSelectError } = await supabase
        .from('guest')
        .select('id')
        .eq('list_id', listId);
        if (guestSelectError) {
            console.error('Error fetching guest IDs:', guestSelectError);
            return;
        }
        if (!guestData || guestData.length === 0) {
            console.log('No guests found with the specified list_id');
            return;
        }

        const guestIds = guestData.map((guest) => guest.id);

        const { error: eventGuestError } = await supabase
        .from('event_guest')
        .delete()
        .in('guest_id', guestIds);        
        if (eventGuestError) {
            console.error('Error deleting event_guest:', eventGuestError)
            return
        } 


        const { error: guestError } = await supabase
        .from('guest')
        .delete()
        .eq('list_id', listId);
        if (guestError) {
            console.error('Error deleting guest:', guestError)
            return
        }        

        const { error: eventListError } = await supabase
        .from('event_list')
        .delete()
        .eq('list_id', listId);
        if (eventListError) {
            console.error('Error deleting guest:', eventListError)
            return
        }
    }

    async function deleteEvent(eventId: number) {
        if (!confirm('¿Estás seguro que quieres borrar este evento? Esta acción no se puede deshacer.')) {
          return
        }
        try {
            await deleteEventRelated(eventId);

            const { error: deleteEventError } = await supabase
            .from('event')
            .delete()
            .eq('id', eventId)
    
            if (deleteEventError) {
                console.error('Error deleting event:', deleteEventError)
            } else {
                setFilteredEvents(filteredEvents.filter((event) => event.id !== eventId))
                alert('Evento eliminada con éxito.')
            }

        } catch (error) {
            console.error('Error in deleteEvent:', error)
        }
    }

    async function deleteEventRelated(eventId: number) {
        const { error: eventGuestError } = await supabase
        .from('event_guest')
        .delete()
        .eq('event_id', eventId);        
        if (eventGuestError) {
            console.error('Error deleting event_guest:', eventGuestError)
            return
        }       

        const { error: eventListError } = await supabase
        .from('event_list')
        .delete()
        .eq('event_id', eventId);
        if (eventListError) {
            console.error('Error deleting guest:', eventListError)
            return
        }
    }

    const toggleExpand = (macroEventId: number) => {
        if(expandedMacroEvent === macroEventId){
            setExpandedMacroEvent(null)
        } else{
            setExpandedMacroEvent(macroEventId)

            const filteredEvents = events.filter(event => event.macro_event_id === macroEventId);
            setFilteredEvents(filteredEvents);
            console.log(filteredEvents)
            const filteredLists = lists.filter(list => list.macro_event_id === macroEventId);
            setFilteredLists(filteredLists);
            console.log(filteredLists)
        }        
    }

    return (
        <div className="container mx-auto py-10">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold">Lista de macro eventos</h1>
              <Button asChild>
                <Link href="/macro-eventos/new">
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
                        const isExpanded = expandedMacroEvent === macroEvent.id
                return (
                <>
                <TableRow key={macroEvent.id}>
                    <TableCell>{macroEvent.name}</TableCell>
                    <TableCell>
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                        <Link href={`/macro-eventos/${macroEvent.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                        </Link>
                        </Button>

                        <Button
                        variant="outline"
                        size="sm"
                        disabled
                        onClick={() => deleteMacroEvent(macroEvent.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Borrar</span>
                        </Button>

                        <Button variant="outline" size="sm"
                            onClick={() => toggleExpand(macroEvent.id)}>
                            <ChevronDown className="h-4 w-4" />
                            <span className="sr-only">Ver</span>
                        </Button>
                    </div>                    
                    </TableCell>
                </TableRow>

                {isExpanded && (
                    <TableRow>
                        <TableCell colSpan={2}>
                            <div className="p-4 bg-gray-100 border rounded">
                                <h2 className="text-lg font-bold mb-2">Detalles</h2>
                                <p className="text-md mb-4">{macroEvent.name}</p>
                                <Button asChild>
                                    <Link href={`/macro-eventos/reportes?macroEventId=${macroEvent.id}`}>
                                        Ver reporte
                                    </Link>
                                </Button>

                                <h3 className="text-md font-semibold mt-4 mb-2">Listas</h3>
                                {filteredLists.length > 0 ? (
                                    <div className="mt-4">
                                        <ul>
                                            {filteredLists.map((list) => (
                                                <li key={list.id} className="mb-2 flex items-center justify-between border-t border-gray-300 pt-2">
                                                    <p className="text-sm">{list.name}</p>
                                                    <div className="flex space-x-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/macro-eventos/listas/${list.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">Ver</span>
                                                    </Link>
                                                    </Button>

                                                    <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/macro-eventos/listas/${list.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">Editar</span>
                                                    </Link>
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"                                                        
                                                        onClick={() => deleteList(list.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Borrar</span>
                                                    </Button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No hay listas disponibles para este macro evento.</p>
                                )}
                                <div className="flex space-x-2">
                                    <Button asChild>
                                        <Link href={`/macro-eventos/listas/new?macroEventId=${macroEvent.id}`}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Crear lista
                                        </Link>
                                    </Button>                                    
                                </div>

                                <h3 className="text-md font-semibold mt-4 mb-2">Eventos</h3>
                                {filteredEvents.length > 0 ? (
                                    <div className="mt-4">
                                        <ul>
                                            {filteredEvents.map((event) => (
                                                <li key={event.id} className="mb-2 flex items-center justify-between border-t border-gray-300 pt-2">
                                                    <p className="text-sm">{event.name}</p>
                                                    <div className="flex space-x-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/macro-eventos/eventos/${event.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">Ver</span>
                                                    </Link>
                                                    </Button>

                                                    <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/macro-eventos/eventos/${event.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">Editar</span>
                                                    </Link>
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"                                                        
                                                        onClick={() => deleteEvent(event.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Borrar</span>
                                                    </Button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No hay eventos disponibles para este macro evento.</p>
                                )}
                                <div className="flex space-x-2">
                                    <Button asChild>
                                        <Link href={`/macro-eventos/eventos/new?macroEventId=${macroEvent.id}`}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Crear evento
                                        </Link>
                                    </Button>
                                    
                                </div>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
                </>
                )
            })}
            </TableBody>
        </Table>
        </div>
      )
}
