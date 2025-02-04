"use client"

import { useState, useMemo, useCallback, useEffect, Suspense } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EventsReportTable } from "@/components/EventsReportTable"
import { StatsCards } from "@/components/StatsCards"
import { MacroEventReportList } from "@/components/MacroEventReportList"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { SearchableSelectFilterGuestCompany } from "@/components/SearchableSelectFilterGuestCompany"

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
  company_razon_social: string
  guest?: {
    name: string
    email: string
    is_user: boolean
    company_razon_social: string
    company? :{
      razon_social: string
    }
    executive? : {
      name: string
      last_name: string
    }
  }
}


const calculateStats = (macroEventId: number, events: Event[], eventGuests: EventGuest[]) => {
  const macroEventEvents = events.filter((event) => event.macro_event_id === macroEventId)
  const macroEventGuests = eventGuests.filter((guest) => macroEventEvents.some((event) => event.id === guest.event_id))

  const uniqueInvitados = new Set(macroEventGuests.map((eventGuest) => eventGuest.guest?.email));
  const uniqueRegistrados = new Set(
    macroEventGuests.filter((eventGuest) => eventGuest.registered).map((eventGuest) => eventGuest.guest?.email)
  );
  const uniqueAsistentes = new Set(
    macroEventGuests.filter((eventGuest) => eventGuest.assisted).map((eventGuest) => eventGuest.guest?.email)
  );

  const totalInvitados = uniqueInvitados.size;
  const totalRegistrados = uniqueRegistrados.size;
  const totalAsistentes = uniqueAsistentes.size;

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
  
  const [searchQuery, setSearchQuery] = useState('')
  const [guestsName, setGuestsName] = useState<string[]>([])

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
        *,
        guest: guest_id (name, email, is_user, company_razon_social, company: company_id (razon_social), executive: executive_id (name, last_name, user_type))
      `)
      .in('event_id', eventIds)

    if (guestError) {
      console.error('Error fetching event data:', guestError)
      return
    } else {
      const guestsName = [...new Set(guests.map(eventGuest => 
        eventGuest.guest?.is_user ? `${eventGuest.guest?.executive?.name} ${eventGuest.guest?.executive?.last_name}` : eventGuest.guest?.name ? eventGuest.guest?.name : eventGuest.name || "z",
      ))];
      setGuestsName(guestsName)
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


  const filtrarTabla = (invitados: EventGuest[]) => {
    return invitados.filter(invitado => {
      const name = invitado.guest?.is_user ? `${invitado.guest?.executive?.name} ${invitado.guest?.executive?.last_name}` : invitado.guest?.name ? invitado.guest?.name : invitado.name
      const company = invitado.guest?.is_user ? invitado.guest?.company?.razon_social : invitado.guest?.company_razon_social || " "

      const cumpleBusqueda = searchQuery === '' || 
      name.toLowerCase().includes(searchQuery.toLowerCase()) 
        || (company && company.toLowerCase().includes(searchQuery.toLowerCase()))

      return cumpleBusqueda
    })
  }

  const filterGuests = useMemo(() => {
    const filterGuests = filtrarTabla(eventGuests)
    console.log("filterGuests", filterGuests)
    return filterGuests

  }, [macroEventId, events, eventGuests, searchQuery])

  const stats = useMemo(() => {
    if (macroEventId) {
      return calculateStats(Number.parseInt(macroEventId, 10), events, filterGuests)
    }
    return null
  }, [macroEventId, events, eventGuests, filterGuests])

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
      <div>
        <h4 className="text-md font-medium">Buscar empresa o invitado</h4>
        <SearchableSelectFilterGuestCompany
          onSelect={(value) => setSearchQuery(value)}
          guestsName={guestsName}
        />
      </div>

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
          <MacroEventReportList macroEventId={parseInt(macroEventId)} searchQuery={searchQuery}/>        
      </div>
    </div>
  )
}

