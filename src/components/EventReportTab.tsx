'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ConnectionTimeDistributionChart } from './ConnectionTimeDistributionChart'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CompanySelect } from './ReportCompanySelect'

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
  executive?: {
    name: string
    last_name: string
    position: string
  } | null
  company?: {
    razon_social: string
  } | null
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
}

type EventData = {
  totalInvitados: number
  totalRegistrados: number
  totalAsistentes: number
  tiempoConexionPromedio: string
  invitados: ReportGuest[]
}

export function EventReportTab({ eventId, defaultCompany = "Todas", showCompanyFilter = true, showGuestsTable = true }: { eventId: number, defaultCompany?: string, showCompanyFilter?: boolean, showGuestsTable?: boolean }) {
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [companySeleccionada, setEmpresaSeleccionada] = useState(defaultCompany)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [registeredFilter, setRegisteredFilter] = useState("Todos")
  const [attendedFilter, setAttendedFilter] = useState("Todos")
  const [timeFilter, setTimeFilter] = useState("Todos")
  const [showConnectionTimeChart, setShowConnectionTimeChart] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    fetchEventData()
  }, [eventId])

  useEffect(() => {
    setEmpresaSeleccionada(defaultCompany);
  }, [defaultCompany]);

  async function fetchEventData() {
    const { data: event, } = await supabase
     .from('event')
     .select(`
       id,
       name,
       event_type
     `)
      .eq('id', eventId)
      if (event) {
        setShowConnectionTimeChart(event[0].event_type === 'Virtual')
        console.log(event)
      }


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
        executive:executive_id (name, last_name, position),
        company:company_id (razon_social)
      `)
      .eq('event_id', eventId)

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
    const formattedGuests: ReportGuest[] = sortedGuests.map((guest: SupabaseGuest) => ({
      id: guest.id,
      name: guest.is_user && guest.executive? `${guest.executive.name} ${guest.executive.last_name}`.trim(): guest.name || '',
      position: guest.is_user ? guest.executive?.position || '' : guest.position || '',
      company: guest.is_client_company && guest.company ? guest.company.razon_social : guest.company_razon_social || '',
      registered: guest.registered,
      assisted: guest.assisted,
      virtual_session_time: guest.virtual_session_time || 0,
      tipo_usuario: guest.tipo_usuario || '',
      tipo_membresia: guest.tipo_membresia || '',
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
        invitado.company.toLowerCase().includes(searchQuery.toLowerCase())

      const cumpleTiempo = timeFilter === "Todos" ||
      (timeFilter === "30" &&  invitado.virtual_session_time <= 30) || 
      (timeFilter === "60" &&  invitado.virtual_session_time <= 60 &&  invitado.virtual_session_time > 30) || 
      (timeFilter === "90" &&  invitado.virtual_session_time <= 90 &&  invitado.virtual_session_time > 60) || 
      (timeFilter === "120" && invitado.virtual_session_time <= 120 && invitado.virtual_session_time > 90)

      return cumpleRegistro && cumpleAsistencia && cumpleBusqueda && cumpleTiempo
    })
  }

  const datosFiltradosA = useMemo(() => filtrarPorEmpresa(eventData), [eventData, companySeleccionada])
  const datosFiltradosB = useMemo(() => datosFiltradosA ? filtrarTabla(datosFiltradosA.invitados) : [], [datosFiltradosA, registeredFilter, attendedFilter, timeFilter, searchQuery])

  const paginatedGuests = datosFiltradosB.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(datosFiltradosB.length / itemsPerPage)

  const companies = eventData ? ["Todas", ...new Set(eventData.invitados.map(a => a.company).filter(Boolean))] : []

  if (loading) {
    return <div>Cargando datos del evento...</div>
  }

  if (!eventData || !datosFiltradosA) {
    return <div>No se pudieron cargar los datos del evento.</div>
  }

  const porcentajeRegistrados = (datosFiltradosA.totalRegistrados / datosFiltradosA.totalInvitados * 100).toFixed(2)
  const porcentajeAsistencia = (datosFiltradosA.totalAsistentes / datosFiltradosA.totalRegistrados * 100).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Filtro de empresa */}
      { showCompanyFilter && 
          <div className="flex justify-between items-center">
          <CompanySelect
            companies={companies}
            onValueChange={setEmpresaSeleccionada}
            defaultValue="Todas"
          />
        </div>
      }

      {/* Métricas principales */}
      <div className={`grid gap-4 grid-cols-2 sm:grid-cols-2 lg:${showConnectionTimeChart ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <Card className="col-span-1">
          <CardHeader className="p-4">
            <CardTitle className="text-sm sm:text-base">Total Invitados</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{datosFiltradosA.totalInvitados}</div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="p-4">
            <CardTitle className="text-sm sm:text-base">Total Registrados</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{datosFiltradosA.totalRegistrados}</div>
            <div className="text-xs sm:text-sm text-gray-500">({porcentajeRegistrados}%)</div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="p-4">
            <CardTitle className="text-sm sm:text-base">Total Asistentes</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{datosFiltradosA.totalAsistentes}</div>
            <div className="text-xs sm:text-sm text-gray-500">({porcentajeAsistencia}%)</div>
          </CardContent>
        </Card>
        { showConnectionTimeChart &&
          <Card className="col-span-1">
          <CardHeader className="p-4">
            <CardTitle className="text-sm sm:text-base">Tiempo Promedio</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{datosFiltradosA.tiempoConexionPromedio}</div>
          </CardContent>
        </Card>
        }

      </div>
    { showConnectionTimeChart &&
      <div>
      <ConnectionTimeDistributionChart asistentes={datosFiltradosA.invitados.filter(i => i.assisted)} />
    </div>
    }


      {/* Lista de invitados */}
      { showGuestsTable && 
        <Card>
          <CardHeader>
            <CardTitle>Lista de Invitados</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Buscador y filtros */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 sm:space-x-4 mb-4">
              <Input
                type="text"
                placeholder="Buscar invitados..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:max-w-xs"
              />
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
                <div className="flex flex-col space-y-2">
                  <label htmlFor="time-filter" className="text-sm font-medium">Tiempo de conexión</label>
                  <Select onValueChange={setTimeFilter} defaultValue="Todos">
                    <SelectTrigger id="time-filter" className="w-full sm:w-[120px]">
                      <SelectValue placeholder="Total" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Total</SelectItem>
                      <SelectItem value="30">0-30 min</SelectItem>
                      <SelectItem value="60">30-60 min</SelectItem>
                      <SelectItem value="90">60-90 min</SelectItem>
                      <SelectItem value="120">90-120 min</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <TableHead className="w-[100px] min-w-[100px]">Tipo de membresía</TableHead>
                    <TableHead className="w-[100px] min-w-[100px]">Registrado</TableHead>
                    <TableHead className="w-[100px] min-w-[100px]">Asistió</TableHead>
                    { showConnectionTimeChart &&
                    <TableHead className="w-[150px] min-w-[150px]">Tiempo de Conexión</TableHead>
                    }
                    
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedGuests.map((invitado, index) => (
                    <TableRow key={index}>
                      <TableCell>{invitado.name}</TableCell>
                      <TableCell>{invitado.company}</TableCell>
                      <TableCell>{invitado.tipo_usuario}</TableCell>
                      <TableCell>{invitado.tipo_membresia}</TableCell>
                      <TableCell>{invitado.registered ? 'Sí' : 'No'}</TableCell>
                      <TableCell>{invitado.assisted ? 'Sí' : 'No'}</TableCell>
                      { showConnectionTimeChart &&
                      <TableCell>{formatTime(invitado.virtual_session_time)}</TableCell>
                      }
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

export default EventReportTab

