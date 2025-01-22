'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type EventFormProps = {
  eventId?: number
  copyEventId?: number
  macroEventId?: string;
}

type MacroEvent = {
  id: number
  name: string
}

const eventTypeOptions = ['Presencial', 'Virtual', 'Híbrido']

export function EventForm({ eventId, copyEventId, macroEventId: initialMacroEventId }: EventFormProps) {
  const [name, setName] = useState('')
  const [eventType, setEventType] = useState('')
  const [dateHour, setDateHour] = useState('')
  const [place, setPlace] = useState('')
  const [registerOpen, setRegisterOpen] = useState(false)
  const [macroEventId, setMacroEventId] = useState(initialMacroEventId || '')
  const [macroEvents, setMacroEvents] = useState<MacroEvent[]>([])

  const router = useRouter()

  const fetchEvent = useCallback(async () => {
    if (!eventId) return
    const { data, error } = await supabase
      .from('event')
      .select('*')
      .eq('id', eventId)
      .single()

    if (error) {
      console.error('Error fetching event:', error)
    } else if (data) {
      setName(data.name)
      setEventType(data.event_type)
      setDateHour(data.date_hour)
      setPlace(data.place)
      setRegisterOpen(data.register_open)
    }
  }, [eventId])

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

  useEffect(() => {
    fetchMacroEvent()
    if (eventId) {
      fetchEvent()
    }
  }, [eventId, fetchEvent])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const event = {
      name,
      event_type: eventType,
      date_hour: dateHour,
      place,
      register_open: registerOpen,
      macro_event_id: macroEventId
    }

    if (eventId) {
      const { error } = await supabase
        .from('event')
        .update(event)
        .eq('id', eventId)

      if (error) console.error('Error updating event:', error)
      else router.push('/eventos2')
    } else {
      const { data: newEvent, error } = await supabase
        .from('event')
        .insert([event])
        .select()
        .single()

      if (error) console.error('Error creating event:', error)

      if(copyEventId){
        
        const { data: guests, error: guestsError } = await supabase
        .from('event_guest')
        .select('*')
        .eq('event_id', copyEventId);

        if (guestsError) {
          console.error('Error obteniendo invitados:', guestsError);
          return;
        }

        if (guests && guests.length > 0) {
          const copiedGuests = guests.map(({ id, ...guest }) => ({
            ...guest,
            event_id: true ? newEvent.id : id,               
          }));
    
          const { error: copyGuestsError } = await supabase
            .from('event_guest')
            .insert(copiedGuests);
    
          if (copyGuestsError) {
            console.error('Error copiando invitados:', copyGuestsError);
            return;
          }
    
          console.log("Invitados copiados exitosamente.");
        }
      }

      router.push('/eventos2')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="macroEventId">Macro Evento</Label>
        <Select value={macroEventId} onValueChange={setMacroEventId}>
        <SelectTrigger>
            <SelectValue placeholder="Selecciona un macro evento" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="0">Otro</SelectItem>
            {macroEvents.map((macroEvent) => (
            <SelectItem key={macroEvent.id} value={macroEvent.id.toString()}>
                {`${macroEvent.name}`}
            </SelectItem>
            ))}
        </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="name">Nombre del evento</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          //required
        />
      </div>
      <div>
        <Label htmlFor="eventType">Modalidad</Label>
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona la modalidad" />
          </SelectTrigger>
          <SelectContent>
            {eventTypeOptions.map((option, index) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="dateHour">Fecha y hora</Label>
        <Input
          id="dateHour"
          type="datetime-local"
          value={dateHour}
          onChange={(e) => setDateHour(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="place">Lugar</Label>
        <Input
          id="place"
          type="text"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          //required
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="registerOpen"
          checked={registerOpen}
          onCheckedChange={(checked) => setRegisterOpen(checked as boolean)}
        />
        <Label htmlFor="registerOpen" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Registro Abierto
        </Label>
      </div>
      <Button type="submit">{eventId ? 'Actualizar' : 'Agregar Nuevo Evento'}</Button>
    </form>
  )
}