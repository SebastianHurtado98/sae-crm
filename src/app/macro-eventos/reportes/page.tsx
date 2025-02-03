"use client"

import { useState, useMemo, useCallback, useEffect, Suspense } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EventsReportTable } from "@/components/EventsReportTable"
import { StatsCards } from "@/components/StatsCards"
import { MacroEventReportList } from "@/components/MacroEventReportList"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

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
  name: string
  email: string
  virtual_session_time: number | null
  registered: boolean
  assisted: boolean
}


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
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <MacroReporteContent />
    </Suspense>
  );
}

function MacroReporteContent() {
  const searchParams = useSearchParams();
  const initialMacroEventId = searchParams ? searchParams.get("macroEventId") || "" : "";
  const [macroEventId, setMacroEventId] = useState(initialMacroEventId || '')
  const [macroEvents, setMacroEvents] = useState<MacroEvent[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [eventGuests, setEventGuests] = useState<EventGuest[]>([])
  

  const fetchMacroEvent = useCallback(async () => {
    const { data, error } = await supabase
      .from('macro_event')
      .select('id, name')

    if (error) {
      console.error('Error fetching macro_event:', error)
    } else {
      setMacroEvents(data || [])
    }
  }, [])

  const fetchEventData = useCallback(async () => {
    const { data, error } = await supabase
      .from('event')
      .select('id, name, event_type, date_hour, place, register_open, macro_event_id')
      .eq('macro_event_id', macroEventId)
      .order('date_hour', { ascending: true })


    if (error) {
      console.error('Error fetching macro_event:', error)
      return
    } else {
      setEvents(data || [])
    }

    const eventIds = data.map(event => event.id);

    const { data: guests, error: guestError } = await supabase
      .from('event_guest')
      .select(`
        *
      `)
      .in('event_id', eventIds)

    if (guestError) {
      console.error('Error fetching event data:', guestError)
      return
    } else {
      setEventGuests(guests || [])
    }


  }, [macroEventId])

  useEffect(() => {
    fetchMacroEvent();
  }, []);
  
  useEffect(() => {
    if (macroEventId) {
      fetchEventData();
    }
  }, [macroEventId]);

  const stats = useMemo(() => {
    if (macroEventId) {
      return calculateStats(Number.parseInt(macroEventId, 10), events, eventGuests)
    }
    return null
  }, [macroEventId, events, eventGuests])

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">
        Macro Reporte:{" "}
        {macroEventId ? macroEvents.find((me) => me.id === Number.parseInt(macroEventId, 10))?.name : ""}
      </h1>

      <Select onValueChange={setMacroEventId} value={macroEventId}>
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
          <MacroEventReportList macroEventId={parseInt(macroEventId)}/>        
      </div>
    </div>
  )
}

