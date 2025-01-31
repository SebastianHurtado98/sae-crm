'use client'

import { use } from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UploadZoomAttendance } from '@/components/UploadZoomAttendance'
import { EventReportTab } from '@/components/EventReportTab'
import { ScanQRTab } from '@/components/ScanGuests'
import { useSearchParams } from 'next/navigation'
//import * as XLSX from 'xlsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateEventGuestForm } from '@/components/CreateGuestForm'
import { GuestTable } from '@/components/macroEvent/EventGuestTable'

type Event = {
  id: number
  name: string
  event_type: string
  date_hour: string
  place: string
  register_open: boolean
  macro_event_id: number
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [event, setEvent] = useState<Event | null>(null)
  const [hasList, setHasList] = useState<boolean>(false)
  const [eventLists, setEventLists] = useState<{ id: number; name: string }[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false)
  const [eventSetList, setEventSetList] = useState<number | null>(null);

  const searchParams = useSearchParams()
  const defaultTab = searchParams?.get('tab') || 'invitados' 

  useEffect(() => {
    fetchEvent()
    checkIfHasList()    
  }, [])

  async function fetchEvent() {
    const { data, error } = await supabase
      .from('event')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (error) {
      console.error('Error fetching event:', error)
    } else {
      console.log(data)
      setEvent(data)
      fetchLists(data.macro_event_id)
    }
  }

  async function checkIfHasList() {
    const { data, error } = await supabase
      .from('event_list')
      .select('*')
      .eq('event_id', resolvedParams.id)
      .single(); 
  
    if (error) {
      console.error('Error checking event list:', error);
    } else {
      setHasList(!!data);
      if (data && data.list_id !== null) {
        setEventSetList(data.list_id);
      }
    }
  }

  async function fetchLists(macro_event_id: number) { 
    const { data, error } = await supabase
      .from('list')
      .select('id, name')
      .eq('macro_event_id', macro_event_id);
  
    if (error) {
      console.error('Error fetching event lists:', error);
    } else {
      setEventLists(data || []);
    }
  }

  function formatDateHour(dateHour: string) {
    const date = new Date(dateHour)
    return date.toLocaleString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  if (!event) return <div>Cargando...</div>

  /*const handleExcelClick = async () => {
    const { data, error } = await supabase
      .from('event_guest')
      .select(`
        *,
        executive:executive_id (name, last_name)
      `)
      .eq('event_id', resolvedParams.id);
  
    if (error) {
      console.error('Error fetching guests:', error);
      return;
    }
  
    if (data) {
      try {
        // Agregar la columna de enlace de registro
        const enrichedData = data.map((guest) => ({
          email: guest.email,
          name: guest.is_user
          ? `${guest.executive?.name} ${guest.executive?.last_name || ''}`.trim()
          : guest.name,
          company: guest.company_razon_social,
          tipo_usuario: guest.tipo_usuario,
          tipo_membresia: guest.tipo_membresia,
          registered: guest.registered === null ? false : guest.registered,
          assisted: guest.assisted === null ? false : guest.assisted,
          registration_link: `https://sae-register.vercel.app/${encodeURIComponent(guest.email)}`
        }));
  
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(enrichedData);
        XLSX.utils.book_append_sheet(wb, ws, "Guests");
  
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'event_guests.xlsx';
        link.style.display = 'none';
  
        document.body.appendChild(link);
        link.click();
  
        document.body.removeChild(link);
      } catch (parseError) {
        console.error('Error generating Excel:', parseError);
      }
    }
  };*/

  const handleSelectList = async () => {
    if (selectedListId) {

      const { error: eventListError } = await supabase
        .from('event_list')
        .insert([
          { event_id: event.id, list_id: selectedListId },
        ])
      if (eventListError) {
        console.error('Error insert event_list:', eventListError)
        return
      }

      const { data: guestData, error: guestError } = await supabase
        .from('guest')
        .select('id, name')
        .eq('list_id', selectedListId)

      if (guestError) {
        console.error('Error fetching guest:', guestError)
      } else {

        const guestEventEntries = guestData.map(guest => ({
          guest_id: guest.id,
          event_id: event.id,
          name: guest.name,
        }));
  
        const { error: guestEventError } = await supabase
          .from('event_guest')
          .insert(guestEventEntries);
  
        if (guestEventError) {
          console.error('Error insert event_guest:', guestEventError);
        }
      }
      
      setHasList(true)
      setEventSetList(selectedListId)
    } else {
      console.log('Por favor selecciona una lista primero');
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-xl font-bold mb-6">{event.name}</h1>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p><strong>Modalidad:</strong> {event.event_type}</p>
          <p><strong>Fecha y hora:</strong> {formatDateHour(event.date_hour)}</p>
          <p><strong>Registro Abierto:</strong> {event.register_open ? "Sí" : "No"}</p>
        </div>
        <div>
          <p><strong>Lugar:</strong> {event.place}</p><p>
          <strong>Link a reporte: </strong> 
             https://sae-crm.vercel.app/macro-eventos/eventos/{event.id}?tab=reporte
        </p>
        </div>
      </div>
      
      <Tabs defaultValue={defaultTab} className="w-full">
        


      <div className="sm:hidden mb-6">
        <Select value={defaultTab} onValueChange={(value) => window.location.search = `?tab=${value}`}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una sección" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="invitados">Invitados</SelectItem>
            <SelectItem value="subir-asistencia">Subir Asistencia Zoom</SelectItem>
            {event.event_type === "Presencial" && (
            <SelectItem value="escanear-qr">Escanear QR</SelectItem>
            )}            
            <SelectItem value="reporte">Reporte</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TabsList className="hidden sm:grid w-full grid-cols-4">
        <TabsTrigger value="invitados">Invitados</TabsTrigger>
        <TabsTrigger value="subir-asistencia">Subir Asistencia Zoom</TabsTrigger>
        {event.event_type === "Presencial" && (
        <TabsTrigger value="escanear-qr">Escanear QR</TabsTrigger>
        )}
        <TabsTrigger value="reporte">Reporte</TabsTrigger>
      </TabsList>
        
        <TabsContent value="invitados">
          {hasList ? 
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex ml-auto space-x-2">
                <Button onClick={() => setShowForm(!showForm)}>
                  {showForm ? 'Cerrar formulario' : 'Añadir invitado'}
                </Button>
              </div>
            </div>
            {showForm && <CreateEventGuestForm eventId={parseInt(resolvedParams.id)} onComplete={() => setShowForm(false)} />}
              {
                eventSetList ? 
                <GuestTable listId={eventSetList} eventId={parseInt(resolvedParams.id)} />
                :
                <h2>Hubo problemas al recuperar la lista</h2>
              }
          </div> 
          :
          <div className="space-y-4">
            <div>
              <label htmlFor="event-list-dropdown" className="block text-sm font-medium text-gray-700">
                Selecciona una lista de invitados:
              </label>
              <select
                id="event-list-dropdown"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={selectedListId || ''}
                onChange={(e) => setSelectedListId(Number(e.target.value))}
              >
                <option value="" disabled>Selecciona una lista</option>
                {eventLists.map((list) => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
            </div>
            <Button variant="outline" onClick={handleSelectList}>
              Usar Lista de invitados
            </Button>
          </div> 
          }
        </TabsContent>
             
        <TabsContent value="subir-asistencia">
          <UploadZoomAttendance eventId={parseInt(resolvedParams.id)} />
        </TabsContent>
        
        <TabsContent value="escanear-qr">
          <ScanQRTab eventId={parseInt(resolvedParams.id)} />
        </TabsContent>

        <TabsContent value="reporte">
          <EventReportTab eventId={parseInt(resolvedParams.id)}/>
        </TabsContent>
      </Tabs>
    </div>
  )
}