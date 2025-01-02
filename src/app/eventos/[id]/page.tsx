'use client'

import { use } from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventGuestTable } from '@/components/EventGuestTable'
import { CreateGuestForm } from '@/components/CreateGuestForm'
import { ImportUsers } from '@/components/ImportUsers'
import { ImportExternals } from '@/components/ImportExternals'
import { UploadZoomAttendance } from '@/components/UploadZoomAttendance'
import { EventReportTab } from '@/components/EventReportTab'
import { ScanQRTab } from '@/components/ScanGuests'
import { useSearchParams } from 'next/navigation'
import { Parser } from 'json2csv'

type Event = {
  id: number
  name: string
  event_type: string
  date_hour: string
  place: string
  register_open: boolean
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [event, setEvent] = useState<Event | null>(null)
  const [showForm, setShowForm] = useState(false)

  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'invitados' // Leer el tab de la URL o usar "invitados" por defecto.

  useEffect(() => {
    fetchEvent()
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
      setEvent(data)
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

  const handleCSVClick = async () => {
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
          registered: guest.registered === null ? false : guest.registered,
          registration_link: `https://sae-register.vercel.app/${encodeURIComponent(guest.email)}`
        }));
  
        const fields = ['name', 'email', 'registered', 'registration_link'];
        const parser = new Parser({ fields });
        const csv = parser.parse(enrichedData);
  
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'event_guests.csv';
        link.style.display = 'none';
  
        document.body.appendChild(link);
        link.click();
  
        document.body.removeChild(link);
      } catch (parseError) {
        console.error('Error generating CSV:', parseError);
      }
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
             https://sae-crm.vercel.app/eventos/{event.id}?tab=reporte
        </p>
        </div>
      </div>
      
      <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="sm:hidden flex gap-2 overflow-x-auto scrollbar-hide w-full">
        <TabsTrigger value="invitados" className="flex-shrink-0 text-sm px-4 py-2">
          Invitados
        </TabsTrigger>
        <TabsTrigger value="importar-usuarios" className="flex-shrink-0 text-sm px-4 py-2">
          Importar Usuarios
        </TabsTrigger>
        <TabsTrigger value="importar-externos" className="flex-shrink-0 text-sm px-4 py-2">
          Importar Externos
        </TabsTrigger>
        <TabsTrigger value="subir-asistencia" className="flex-shrink-0 text-sm px-4 py-2">
          Subir Asistencia Zoom
        </TabsTrigger>
        <TabsTrigger value="escanear-qr" className="flex-shrink-0 text-sm px-4 py-2">
          Escanear QR
        </TabsTrigger>
        <TabsTrigger value="reporte" className="flex-shrink-0 text-sm px-4 py-2">
          Reporte
        </TabsTrigger>
      </TabsList>
      <TabsList className="hidden sm:grid w-full grid-cols-6">
        <TabsTrigger value="invitados">Invitados</TabsTrigger>
        <TabsTrigger value="importar-usuarios">Importar Usuarios</TabsTrigger>
        <TabsTrigger value="importar-externos">Importar Externos</TabsTrigger>
        <TabsTrigger value="subir-asistencia">Subir Asistencia Zoom</TabsTrigger>
        <TabsTrigger value="escanear-qr">Escanear QR</TabsTrigger>
        <TabsTrigger value="reporte">Reporte</TabsTrigger>
      </TabsList>
        
        <TabsContent value="invitados">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cerrar formulario' : 'Añadir invitado'}
              </Button>
              <div className="flex ml-auto space-x-2">
                <Button variant="outline" onClick={() => handleCSVClick()}>Descargar CSV</Button>
              </div>
            </div>
            {showForm && <CreateGuestForm eventId={parseInt(resolvedParams.id)} onComplete={() => setShowForm(false)} />}
            <EventGuestTable eventId={parseInt(resolvedParams.id)} />
          </div>
        </TabsContent>
        
        <TabsContent value="importar-usuarios">
          <ImportUsers eventId={parseInt(resolvedParams.id)} />
        </TabsContent>
        
        <TabsContent value="importar-externos">
          <ImportExternals eventId={parseInt(resolvedParams.id)} />
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