'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ListaDeAsistentes } from '@/components/MacroEventGuest';
import * as XLSX from 'xlsx';

interface Event {
    id: number;
    name: string;
    event_type: string;
    macro_event_id: number;
  }
export default function MacroReportsPage() {
  const [macroEventId, ] = useState<number>(1);
  const [presentialEvents, setPresentialEvents] = useState<Event[]>([]);
  const [virtualEvents, setVirtualEvents] = useState<Event[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [eventGuestStats, setEventGuestStats] = useState<{ [key: number]: { guests: number; registered: number; assisted: number } }>({});
  const [totalGuests, setTotalGuests] = useState<{ presential: number; virtual: number }>({ presential: 0, virtual: 0 });
  const [totalRegistered, setTotalRegistered] = useState<{ presential: number; virtual: number }>({ presential: 0, virtual: 0 });
  const [totalAssisted, setTotalAssisted] = useState<{ presential: number; virtual: number }>({ presential: 0, virtual: 0 });

  useEffect(() => {
    fetchEvents();
  }, [macroEventId]);

  const fetchEvents = async () => {
    setStatus('Cargando eventos...');
    const { data: eventsData, error } = await supabase
      .from('event')
      .select('*')
      .order('date_hour', { ascending: true })
      .eq('macro_event_id', macroEventId);

    if (error) {
      console.error('Error fetching events:', error);
      setStatus('Error cargando eventos.');
      return;
    }

    const presential = eventsData.filter((event) => event.event_type === 'Presencial');
    const virtual = eventsData.filter((event) => event.event_type === 'Virtual');

    setPresentialEvents(presential);
    setVirtualEvents(virtual);
    setStatus(null);

    fetchEventGuests(eventsData, presential, virtual);
  };

    // @ts-expect-error prisa
  const fetchEventGuests = async (events, presential, virtual) => {
    // @ts-expect-error prisa
    const eventIds = events.map((event) => event.id);

    const { data: guestsData, error } = await supabase
      .from('event_guest')
      .select('event_id, registered, email, assisted')
      .in('event_id', eventIds);

    if (error) {
      console.error('Error fetching event guests:', error);
      return;
    }

    const stats = {};
    const presentialEmails = new Set();
    const virtualEmails = new Set();
    const presentialRegistered = new Set();
    const virtualRegistered = new Set();
    const presentialAssisted = new Set();
    const virtualAssisted = new Set();

    // @ts-expect-error prisa
    events.forEach((event) => {
        // @ts-expect-error prisa
      stats[event.id] = { guests: 0, registered: 0, assisted: 0 };
    });

    const uniqueEmailsByEvent = new Map();

    guestsData.forEach((guest) => {
      if (!uniqueEmailsByEvent.has(guest.event_id)) {
        uniqueEmailsByEvent.set(guest.event_id, new Set());
      }

      const emailSet = uniqueEmailsByEvent.get(guest.event_id);

      if (!emailSet.has(guest.email)) {
        emailSet.add(guest.email);
        // @ts-expect-error prisa
        stats[guest.event_id].guests++;

    // @ts-expect-error prisa
        const isPresential = presential.some((event) => event.id === guest.event_id);
        // @ts-expect-error prisa
        const isVirtual = virtual.some((event) => event.id === guest.event_id);

        if (isPresential) presentialEmails.add(guest.email);
        if (isVirtual) virtualEmails.add(guest.email);
      }

      if (guest.registered) {
        // @ts-expect-error prisa
        stats[guest.event_id].registered++;
        if (guest.email === "mfedalto@hotmail.com") {
            console.log(guest);
        }

    // @ts-expect-error prisa
        const isPresential = presential.some((event) => event.id === guest.event_id);
        // @ts-expect-error prisa
        const isVirtual = virtual.some((event) => event.id === guest.event_id);

        if (isPresential) presentialRegistered.add(guest.email);
        if (isVirtual) virtualRegistered.add(guest.email);
      }

      if (guest.assisted) {
        // @ts-expect-error prisa
        stats[guest.event_id].assisted++;

        
        // @ts-expect-error prisa
        const isPresential = presential.some((event) => event.id === guest.event_id);
        
    // @ts-expect-error prisa
        const isVirtual = virtual.some((event) => event.id === guest.event_id);
    
        if (isPresential) presentialAssisted.add(guest.email);
        if (isVirtual) virtualAssisted.add(guest.email);
      }
    });

    setEventGuestStats(stats);
    setTotalGuests({
      presential: presentialEmails.size,
      virtual: virtualEmails.size,
    });
    setTotalRegistered({
      presential: presentialRegistered.size,
      virtual: virtualRegistered.size,
    });
    setTotalAssisted({
      presential: presentialAssisted.size,
      virtual: virtualAssisted.size,
    });
  };

  const handleDownloadReport = () => {
    if (!presentialEvents.length && !virtualEvents.length) {
      console.error('No hay datos para descargar.');
      return;
    }
  
    const combinedData = [];
  
    // Agregar título y tabla para eventos presenciales
    if (presentialEvents.length > 0) {
      combinedData.push(['Eventos Presenciales']); // Título
      combinedData.push([
        'Evento',
        'Invitados',
        'Registrados',
        '% Registrados',
        'Asistencia',
        '% Asistencia',
      ]); // Encabezado
  
      presentialEvents.forEach((event) => {
        const stats = eventGuestStats[event.id] || {};
        const registeredPercentage = stats.guests
          ? ((stats.registered / stats.guests) * 100).toFixed(2) + '%'
          : '0.00%';
        const assistedPercentage = stats.registered
          ? ((stats.assisted / stats.registered) * 100).toFixed(2) + '%'
          : '0.00%';
  
        combinedData.push([
          event.name,
          stats.guests || 0,
          stats.registered || 0,
          registeredPercentage,
          stats.assisted || 0,
          assistedPercentage,
        ]);
      });
  
      combinedData.push([]); // Línea en blanco para separar secciones
    }
  
    // Agregar título y tabla para eventos virtuales
    if (virtualEvents.length > 0) {
      combinedData.push(['Eventos Virtuales']); // Título
      combinedData.push([
        'Evento',
        'Invitados',
        'Registrados',
        '% Registrados',
        'Asistencia',
        '% Asistencia',
      ]); // Encabezado
  
      virtualEvents.forEach((event) => {
        const stats = eventGuestStats[event.id] || {};
        const registeredPercentage = stats.guests
          ? ((stats.registered / stats.guests) * 100).toFixed(2) + '%'
          : '0.00%';
        const assistedPercentage = stats.registered
          ? ((stats.assisted / stats.registered) * 100).toFixed(2) + '%'
          : '0.00%';
  
        combinedData.push([
          event.name,
          stats.guests || 0,
          stats.registered || 0,
          registeredPercentage,
          stats.assisted || 0,
          assistedPercentage,
        ]);
      });
  
      combinedData.push([]); // Línea en blanco para separar secciones
    }
  
    // Crear la hoja de Excel
    const worksheet = XLSX.utils.aoa_to_sheet(combinedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Eventos');
  
    // Descargar el archivo
    XLSX.writeFile(workbook, 'reporte_eventos.xlsx');
  };


    // @ts-expect-error prisa
  const renderEventTable = (events, title) => (
    <div>
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="overflow-x-auto">
      <table className="table-auto border-collapse border border-gray-200 w-full text-sm md:text-base">
      <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Evento</th>
            <th className="border border-gray-300 px-4 py-2">Invitados</th>
            <th className="border border-gray-300 px-4 py-2">Registrados</th>
            <th className="border border-gray-300 px-4 py-2">Asistencia</th>
          </tr>
        </thead>
        <tbody>
          {
          
    // @ts-expect-error prisa
        events.map((event) => (
            <tr key={event.id}>
              <td className="border border-gray-300 px-4 py-2">{event.name}</td>
              <td className="border border-gray-300 px-4 py-2">{eventGuestStats[event.id]?.guests || 0}</td>
              <td className="border border-gray-300 px-4 py-2">{eventGuestStats[event.id]?.registered || 0}</td>
              <td className="border border-gray-300 px-4 py-2">{eventGuestStats[event.id]?.assisted || 0}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="border border-gray-300 px-4 py-2 font-bold">Total</td>
            <td className="border border-gray-300 px-4 py-2 font-bold">
              {title === 'Eventos Presenciales' ? totalGuests.presential : totalGuests.virtual}
            </td>
            <td className="border border-gray-300 px-4 py-2 font-bold">
              {title === 'Eventos Presenciales' ? totalRegistered.presential : totalRegistered.virtual}
            </td>
            <td className="border border-gray-300 px-4 py-2 font-bold">
              {title === 'Eventos Presenciales' ? totalAssisted.presential : totalAssisted.virtual}
            </td>
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      <h1 className="text-xl font-bold">Seguimiento de registro</h1>
      <button
        onClick={handleDownloadReport}
        className="px-4 py-2 mt-4 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Descargar Seguimiento
      </button>
      {status && <p className="mt-2 text-sm text-gray-700">{status}</p>}

      {renderEventTable(presentialEvents, "Eventos Presenciales")}
      {renderEventTable(virtualEvents, "Eventos Virtuales")}

      <ListaDeAsistentes eventIds={presentialEvents.map((event) => event.id)} />
      <ListaDeAsistentes eventIds={virtualEvents.map((event) => event.id)} />
    </div>
  );
}
