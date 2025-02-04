'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'

type SupabaseGuest = {
  id: string
  name: string
  company_razon_social: string | null
  virtual_session_time: number | null
  is_user: boolean
  registered: boolean
  assisted: boolean
  is_client_company: boolean
  position: string | null
  tipo_usuario: string | null
  tipo_membresia: string | null
  guest?: {
    name: string
    is_user: string
    company_razon_social: string
    tipo_usuario: string
    tipo_membresia: string
    executive?: {
      name: string
      last_name: string
      position: string
      user_type: string
    } | null
    company?: {
      razon_social: string
    } | null
  }
  event_id: string
}

type ReportGuest = {
  id: string
  name: string
  company: string
  position: string
  registered: boolean
  assisted: boolean
  virtual_session_time: number
  tipo_usuario: string
  tipo_membresia: string
  eventName: string
}

type EventData = {
  totalInvitados: number
  totalRegistrados: number
  totalAsistentes: number
  tiempoConexionPromedio: string
  invitados: ReportGuest[]
}

export function MacroEventReportList({ macroEventId, defaultCompany = "Todas", showGuestsTable = true, searchQuery }: { macroEventId: number, defaultCompany?: string, showCompanyFilter?: boolean, showGuestsTable?: boolean, searchQuery: string }) {
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [companySeleccionada, setEmpresaSeleccionada] = useState(defaultCompany)
  const [currentPage, setCurrentPage] = useState(1)
  const [registeredFilter, setRegisteredFilter] = useState("Todos")
  const [attendedFilter, setAttendedFilter] = useState("Todos")
  const itemsPerPage = 10

  useEffect(() => {
    fetchEventData()
  }, [macroEventId])

  useEffect(() => {
    setEmpresaSeleccionada(defaultCompany);
  }, [defaultCompany]);

  async function fetchEventData() {
    const { data: events, error: eventError} = await supabase
     .from('event')
     .select(`
       id,
       name,
       event_type
     `)
      .eq('macro_event_id', macroEventId)
    
    if (eventError) {
        console.error('Error fetching event data:', eventError)
        setLoading(false)
        return
    }

    if (!events || events.length === 0) {
        console.warn('No events found for macroEventId:', macroEventId);
        setLoading(false);
        return;
    }

    console.log(events);

    const eventIds = events.map(event => event.id);
    const eventMap = new Map(events.map(event => [event.id, event.name]));

    const { data: guests, error } = await supabase
      .from('event_guest')
      .select(`
        id,
        name,
        company_razon_social,
        virtual_session_time,
        is_user,
        registered,
        assisted,
        position,
        is_client_company,
        tipo_usuario,
        tipo_membresia,
        guest: guest_id (
          name,
          is_user,
          company_razon_social,
          tipo_usuario,
          tipo_membresia,
          company: company_id (razon_social),
          executive: executive_id (name, last_name, user_type, observation)
          ),
        event_id
      `)
      .in('event_id', eventIds)

    if (error) {
      console.error('Error fetching event data:', error)
      setLoading(false)
      return
    }

    const sortedGuests = guests.sort((a, b) => {
      // @ts-expect-error - TS doesn't know that sortedGuests is an array of SupabaseGuest
      const companyNameA = a.is_client_company ? a.company?.razon_social : a.company_razon_social;
      // @ts-expect-error - TS doesn't know that sortedGuests is an array of SupabaseGuest
      const companyNameB = b.is_client_company ? b.company?.razon_social : b.company_razon_social;
      return (companyNameA || '').localeCompare(companyNameB || '');
    });

    // @ts-expect-error - TS doesn't know that sortedGuests is an array of SupabaseGuest
    const formattedGuests: ReportGuest[] = sortedGuests.map((eventGuest: SupabaseGuest) => ({
      id: eventGuest.id,
      name: eventGuest.guest?.is_user ? `${eventGuest.guest?.executive?.name} ${eventGuest.guest?.executive?.last_name}` : eventGuest.guest?.name ? eventGuest.guest?.name : eventGuest.name,
      position: eventGuest.is_user ? eventGuest.guest?.executive?.position || '' : eventGuest.position || '',
      company: eventGuest.guest?.is_user ? eventGuest.guest.company?.razon_social : eventGuest.guest?.company_razon_social || " ",
      registered: eventGuest.registered,
      assisted: eventGuest.assisted,
      virtual_session_time: eventGuest.virtual_session_time || 0,
      tipo_usuario: eventGuest.guest?.is_user ? eventGuest.guest?.executive?.user_type : eventGuest.guest?.tipo_usuario,
      tipo_membresia: eventGuest.guest?.tipo_membresia || "",
      eventName: eventMap.get(eventGuest.event_id) || '',
    }))


    setEventData({
      totalInvitados: formattedGuests.length,
      totalRegistrados: formattedGuests.filter(guest => guest.registered).length,
      totalAsistentes: formattedGuests.filter(guest => guest.assisted).length,
      tiempoConexionPromedio: calcularTiempoConexionPromedio(formattedGuests),
      invitados: formattedGuests
    })
    setLoading(false)
  }

  function calcularTiempoConexionPromedio(guests: ReportGuest[]): string {
    const asistentes = guests.filter(guest => guest.assisted)
    const totalTiempo = asistentes.reduce((sum, guest) => sum + guest.virtual_session_time, 0)
    const promedio = asistentes.length > 0 ? Math.round(totalTiempo / asistentes.length) : 0
    return formatTime(promedio)
  }

  function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const filtrarPorEmpresa = (data: EventData | null) => {
    if (!data) return null
    if (companySeleccionada === "Todas") return data

    const invitadosFiltrados = data.invitados.filter(a => a.company === companySeleccionada)
    return {
      totalInvitados: invitadosFiltrados.length,
      totalRegistrados: invitadosFiltrados.filter(a => a.registered).length,
      totalAsistentes: invitadosFiltrados.filter(a => a.assisted).length,
      tiempoConexionPromedio: calcularTiempoConexionPromedio(invitadosFiltrados),
      invitados: invitadosFiltrados,
    }
  }

  const filtrarTabla = (invitados: ReportGuest[]) => {
    return invitados.filter(invitado => {
      const cumpleRegistro = registeredFilter === "Todos" || 
        (registeredFilter === "Sí" && invitado.registered) || 
        (registeredFilter === "No" && !invitado.registered)
      const cumpleAsistencia = attendedFilter === "Todos" || 
        (attendedFilter === "Sí" && invitado.assisted) || 
        (attendedFilter === "No" && !invitado.assisted)
      const cumpleBusqueda = searchQuery === '' || 
        invitado.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (invitado.company && invitado.company.toLowerCase().includes(searchQuery.toLowerCase()))


      return cumpleRegistro && cumpleAsistencia && cumpleBusqueda
    })
  }

  const datosFiltradosA = useMemo(() => filtrarPorEmpresa(eventData), [eventData, companySeleccionada])
  const datosFiltradosB = useMemo(() => datosFiltradosA ? filtrarTabla(datosFiltradosA.invitados) : [], [datosFiltradosA, registeredFilter, attendedFilter, searchQuery])

  const paginatedGuests = datosFiltradosB.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(datosFiltradosB.length / itemsPerPage)

  if (loading) {
    return <div>Cargando datos del evento...</div>
  }

  if (!eventData || !datosFiltradosA) {
    return <div>No se pudieron cargar los datos del evento.</div>
  }

  const handleExcelClick = async () => {    
    if (datosFiltradosB) {
      try {          
        const enrichedData = datosFiltradosB.map((guest) => ({          
          name: guest.name,
          company: guest.company,
          tipo_usuario: guest.tipo_usuario,
          tipo_membresia: guest.tipo_membresia,
          eventName: guest.eventName,
          registered: guest.registered === null ? false : guest.registered,
          assisted: guest.assisted === null ? false : guest.assisted,
          virtual_session_time: guest.virtual_session_time
        }));
  
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(enrichedData);
        XLSX.utils.book_append_sheet(wb, ws, "Macro-Reporte");
  
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Macro-Reporte.xlsx';
        link.style.display = 'none';
  
        document.body.appendChild(link);
        link.click();
  
        document.body.removeChild(link);
      } catch (parseError) {
        console.error('Error generating Excel:', parseError);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Lista de invitados */}
      { showGuestsTable && 
        <Card>
          <CardHeader>
            <CardTitle>Lista de Invitados</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Buscador y filtros */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 sm:space-x-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="registered-filter" className="text-sm font-medium">Se registró</label>
                  <Select onValueChange={setRegisteredFilter} defaultValue="Todos">
                    <SelectTrigger id="registered-filter" className="w-full sm:w-[120px]">
                      <SelectValue placeholder="Total" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Total</SelectItem>
                      <SelectItem value="Sí">Sí</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-2">
                  <label htmlFor="attended-filter" className="text-sm font-medium">Asistió</label>
                  <Select onValueChange={setAttendedFilter} defaultValue="Todos">
                    <SelectTrigger id="attended-filter" className="w-full sm:w-[120px]">
                      <SelectValue placeholder="Total" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Total</SelectItem>
                      <SelectItem value="Sí">Sí</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex ml-auto space-x-2">
                  <Button variant="outline" onClick={() => handleExcelClick()}>Descargar Excel</Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px] min-w-[150px]">Nombre</TableHead>
                    <TableHead className="w-[150px] min-w-[150px]">Empresa</TableHead>
                    <TableHead className="w-[100px] min-w-[100px]">Tipo de usuario</TableHead>
                    <TableHead className="w-[100px] min-w-[100px]">Evento</TableHead>
                    <TableHead className="w-[100px] min-w-[100px]">Registrado</TableHead>
                    <TableHead className="w-[100px] min-w-[100px]">Asistió</TableHead>
                    
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedGuests.map((invitado, index) => (
                    <TableRow key={index}>
                      <TableCell>{invitado.name}</TableCell>
                      <TableCell>{invitado.company}</TableCell>
                      <TableCell>{invitado.tipo_usuario}</TableCell>
                      <TableCell>{invitado.eventName}</TableCell>
                      <TableCell>{invitado.registered ? 'Sí' : 'No'}</TableCell>
                      <TableCell>{invitado.assisted ? 'Sí' : 'No'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Paginación */}
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-2 py-4">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Anterior</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only sm:not-sr-only sm:mr-2">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
            </div>
          </CardContent>
        </Card>
      }
    </div>
  )
}

export default MacroEventReportList

