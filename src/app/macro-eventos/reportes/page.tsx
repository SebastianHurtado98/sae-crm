"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EventsReportTable } from "@/components/EventsReportTable"
import { StatsCards } from "@/components/StatsCards"
import { MacroEventReportList } from "@/components/MacroEventReportList"


type MacroEvent = {
  id: number
  name: string
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

type EventGuest = {
  id: string
  event_id: number
  company_id: number | null
  is_client_company: boolean
  company_razon_social: string | null
  executive_id: number | null
  is_user: boolean
  name: string
  dni: string
  email: string
  phone: string
  assistant_name: string | null
  assistant_email: string | null
  substitute: boolean
  substitute_name: string | null
  substitute_email: string | null
  virtual_session_time: number | null
  tipo_usuario: string | null
  tipo_membresia: string | null
  registered: boolean
  assisted: boolean
  position: string | null
}

// Función para generar datos simulados
const generateMockData = (): { macroEvents: MacroEvent[]; events: Event[]; eventGuests: EventGuest[] } => {
  const macroEvents: MacroEvent[] = [
    { id: 1, name: "Encuentro Enero" },
    { id: 2, name: "Macro Evento 2" },
  ]

  const events: Event[] = [
    {
      id: 1,
      name: "Evento 1",
      event_type: "Conferencia",
      date_hour: "2023-06-01 10:00",
      place: "Sala A",
      register_open: true,
      macro_event_id: 1,
    },
    {
      id: 2,
      name: "Evento 2",
      event_type: "Taller",
      date_hour: "2023-06-02 14:00",
      place: "Sala B",
      register_open: true,
      macro_event_id: 1,
    },
    {
      id: 3,
      name: "Evento 3",
      event_type: "Seminario",
      date_hour: "2023-06-03 09:00",
      place: "Sala C",
      register_open: true,
      macro_event_id: 2,
    },
  ]

  const eventGuests: EventGuest[] = Array(100)
    .fill(null)
    .map((_, index) => ({
      id: `guest-${index + 1}`,
      event_id: Math.floor(Math.random() * 3) + 1,
      company_id: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : null,
      is_client_company: Math.random() > 0.5,
      company_razon_social: Math.random() > 0.5 ? `Empresa ${index + 1}` : null,
      executive_id: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : null,
      is_user: Math.random() > 0.5,
      name: `Invitado ${index + 1}`,
      dni: `DNI${index + 1}`,
      email: `invitado${index + 1}@example.com`,
      phone: `+1234567890${index}`,
      assistant_name: Math.random() > 0.7 ? `Asistente ${index + 1}` : null,
      assistant_email: Math.random() > 0.7 ? `asistente${index + 1}@example.com` : null,
      substitute: Math.random() > 0.9,
      substitute_name: Math.random() > 0.9 ? `Sustituto ${index + 1}` : null,
      substitute_email: Math.random() > 0.9 ? `sustituto${index + 1}@example.com` : null,
      virtual_session_time: Math.random() > 0.5 ? Math.floor(Math.random() * 120) : null,
      tipo_usuario: Math.random() > 0.5 ? "Regular" : "VIP",
      tipo_membresia: Math.random() > 0.5 ? "Básica" : "Premium",
      registered: Math.random() > 0.3,
      assisted: Math.random() > 0.5,
      position: Math.random() > 0.5 ? `Posición ${index + 1}` : null,
    }))

  return { macroEvents, events, eventGuests }
}

// Función para calcular totales y estadísticas de eventos
const calculateStats = (macroEventId: number, events: Event[], eventGuests: EventGuest[]) => {
  const macroEventEvents = events.filter((event) => event.macro_event_id === macroEventId)
  const macroEventGuests = eventGuests.filter((guest) => macroEventEvents.some((event) => event.id === guest.event_id))

  const totalInvitados = macroEventGuests.length
  const totalRegistrados = macroEventGuests.filter((guest) => guest.registered).length
  const totalAsistentes = macroEventGuests.filter((guest) => guest.assisted).length

  const eventStats = macroEventEvents.map((event) => {
    const eventGuests = macroEventGuests.filter((guest) => guest.event_id === event.id)
    return {
      eventId: event.id,
      eventName: event.name,
      registrados: eventGuests.filter((guest) => guest.registered).length,
      asistentes: eventGuests.filter((guest) => guest.assisted).length,
    }
  })

  return {
    totals: { totalInvitados, totalRegistrados, totalAsistentes },
    eventStats,
  }
}

export default function MacroReportePage() {
  const [selectedMacroEvent, setSelectedMacroEvent] = useState<string>("")
  const { macroEvents, events, eventGuests } = useMemo(() => generateMockData(), [])

  const stats = useMemo(() => {
    if (selectedMacroEvent) {
      const macroEventId = Number.parseInt(selectedMacroEvent, 10)
      return calculateStats(macroEventId, events, eventGuests)
    }
    return null
  }, [selectedMacroEvent, events, eventGuests])

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">
        Macro Reporte:{" "}
        {selectedMacroEvent ? macroEvents.find((me) => me.id === Number.parseInt(selectedMacroEvent, 10))?.name : ""}
      </h1>

      <Select onValueChange={setSelectedMacroEvent} value={selectedMacroEvent}>
        <SelectTrigger className="w-[280px] mb-8">
          <SelectValue placeholder="Seleccionar Macro Evento" />
        </SelectTrigger>
        <SelectContent>
          {macroEvents.map((macroEvent) => (
            <SelectItem key={macroEvent.id} value={macroEvent.id.toString()}>
              {macroEvent.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {stats && (
        <>
          <div className="my-8">
          <h2 className="text-2xl font-semibold mb-4">Consolidado</h2>
            <StatsCards totals={stats.totals} />
          </div>

          <div className="my-8">
            <EventsReportTable eventStats={stats.eventStats} />
          </div>
        </>
      )}

      <div className="my-8">
          <MacroEventReportList macroEventId={parseInt(selectedMacroEvent)}/>        
      </div>
    </div>
  )
}

