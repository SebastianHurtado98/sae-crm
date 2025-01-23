'use client';

import { useState, useEffect } from 'react';
import { EventReportTab } from '@/components/macroEvent/EventReportTab';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { GuestsTable } from '@/components/ConsolidatedGuestTable';
import { CompanySelect } from '@/components/ReportCompanySelect';
import { Button } from "@/components/ui/button"
import MacroEventSummary from '@/components/macroEvent/Summary';
import * as XLSX from 'xlsx';

const macroReports = [
  {
    name: "Encuentro Diciembre",
    id: "2",
    groups: [
      { id: 1, name: "Virtual AM", eventIds: [22] },
      { id: 2, name: "Virtual PM", eventIds: [23] },
    ],
  },
  {
    name: "Encuentro Enero",
    id: "1",
    groups: [
      { id: 1, name: "Martes 14 almuerzo", eventIds: [53] },
      { id: 2, name: "Miércoles 15 desayuno", eventIds: [60] },
      { id: 3, name: "Miércoles 15 almuerzo", eventIds: [61] },
      { id: 4, name: "Jueves 16 mañana (Virtual)", eventIds: [55] },
      { id: 5, name: "Jueves 16 almuerzo", eventIds: [62] },
    ],
  },
  /*
  {
    name: "Encuentro Enero por evento",
    groups: [
      { id: 1, name: "Martes 14 almuerzo", eventIds: [53] },
      { id: 2, name: "Miércoles 15 desayuno", eventIds: [60] },
      { id: 3, name: "Miércoles 15 almuerzo", eventIds: [61] },
      { id: 4, name: "Jueves 16 mañana (Virtual)", eventIds: [55] },
      { id: 5, name: "Jueves 16 almuerzo", eventIds: [62] },
    ],
  },
  {
    name: "Encuentro Enero por día",
    groups: [
      { id: 1, name: "Martes", eventIds: [53] },
      { id: 2, name: "Miércoles", eventIds: [60, 61] },
      { id: 3, name: "Jueves", eventIds: [55, 62] },
    ],
  },
  {
    name: "Encuentro Enero por modalidad",
    groups: [
      { id: 1, name: "Presencial", eventIds: [53, 60, 61, 62] },
      { id: 2, name: "Virtual", eventIds: [55] },
    ],
  },
  {
    name: "Encuentro Enero por turno",
    groups: [
      { id: 1, name: "Mañana", eventIds: [60, 55] },
      { id: 2, name: "Tarde", eventIds: [53, 61, 62] },
    ],
  },
  */
];

const macroReportsEnero = [
  {
    name: "Encuentro Enero por evento",
    groups: [
      { id: 1, name: "Martes 14 almuerzo", eventIds: [53] },
      { id: 2, name: "Miércoles 15 desayuno", eventIds: [60] },
      { id: 3, name: "Miércoles 15 almuerzo", eventIds: [61] },
      { id: 4, name: "Jueves 16 mañana (Virtual)", eventIds: [55] },
      { id: 5, name: "Jueves 16 almuerzo", eventIds: [62] },
    ],
  },
  {
    name: "Encuentro Enero por día",
    groups: [
      { id: 1, name: "Martes", eventIds: [53] },
      { id: 2, name: "Miércoles", eventIds: [60, 61] },
      { id: 3, name: "Jueves", eventIds: [55, 62] },
    ],
  },
  {
    name: "Encuentro Enero por modalidad",
    groups: [
      { id: 1, name: "Presencial", eventIds: [53, 60, 61, 62] },
      { id: 2, name: "Virtual", eventIds: [55] },
    ],
  },
  {
    name: "Encuentro Enero por turno",
    groups: [
      { id: 1, name: "Mañana", eventIds: [60, 55] },
      { id: 2, name: "Tarde", eventIds: [53, 61, 62] },
    ],
  },
];


interface Guest {
  id: string;
  name: string;
  company: string;
  email: string;
  registered: boolean;
  assisted: boolean;
  virtual_session_time: number;
  position: string;
}

type GroupSummary = {
  name: string;
  totalInvitados: number;
  totalRegistrados: number;
  totalAsistentes: number;
};

interface Group {
  id: number; // Identificador único del grupo
  eventIds: number[]; // IDs de eventos en este grupo
  guests: Guest[]; // Invitados del grupo
}

type ConsolidatedData = {
  totalInvitados: number;
  totalRegistrados: number;
  totalAsistentes: number;
};

export default function CompareEventsPage() {
  const [groups, setGroups] = useState<Group[]>([
    { id: 0, eventIds: [], guests: [] }, // Grupo inicial
  ]);
  const [, setEvents] = useState<{ id: number; name: string }[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("Todas");
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedData | null>(null);
  const [consolidatedGuests, setConsolidatedGuests] = useState<Guest[]>([]);
  const [selectedMacroReport, setSelectedMacroReport] = useState<string | null>(null);
  const [groupCounter, setGroupCounter] = useState(1); // Contador para IDs únicos de grupos
  const [macroReportData, setMacroReportData] = useState<{ [key: string]: GroupSummary[] }>({});


  const handleSummariesChange = (summaries: { [key: string]: GroupSummary[] }) => {
    setMacroReportData(summaries);
  };


  useEffect(() => {
    fetchEvents();
    const params = new URLSearchParams(window.location.search);
    const macroReportParam = params.get('macroReport');
    setSelectedMacroReport(macroReportParam || null);
  }, []);

  useEffect(() => {
    if (selectedMacroReport) {
      const report = macroReports.find((r) => r.id === selectedMacroReport);
      if (report) {
        const newGroups = report.groups.map((group) => ({
          id: group.id,
          name: group.name,
          eventIds: group.eventIds,
          guests: [],
        }));
        setGroups(newGroups);
        newGroups.forEach((group) =>
          fetchGuestsForEventGroup(group.eventIds, group.id)
        );
      }
      
      const params = new URLSearchParams(window.location.search);
      params.set('macroReport', selectedMacroReport);
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
      
    }
  }, [selectedMacroReport]);
  

  useEffect(() => {
    fetchCompanies();
  }, [groups]);

  useEffect(() => {
    calculateConsolidatedData();
  }, [groups, selectedCompany]);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('event')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
  }

  function fetchCompanies() {
    const allGuests = groups.flatMap((group) => group.guests);
    const companySet = new Set<string>();

    allGuests.forEach((guest) => {
      if (guest.company) {
        companySet.add(guest.company);
      }
    });

    setCompanies(["Todas", ...Array.from(companySet).sort()]);
  }

  const handleDownloadReport = () => {
    if (!consolidatedData) {
      console.error('No hay datos consolidados para generar el reporte.');
      return;
    }
  
    if (!macroReportData || Object.keys(macroReportData).length === 0) {
      console.error('No hay datos del macro reporte para generar el Excel.');
      return;
    }
  
    const combinedData = [];
  
    // Agregar sección consolidada
    combinedData.push(['Consolidado']); // Título
    combinedData.push(['Metric', 'Value']); // Encabezado
    combinedData.push(['Total Invitados', consolidatedData.totalInvitados || 0]);
    combinedData.push(['Total Registrados', consolidatedData.totalRegistrados || 0]);
    combinedData.push([
      'Total Registrados %',
      consolidatedData.totalInvitados
        ? ((consolidatedData.totalRegistrados / consolidatedData.totalInvitados) * 100).toFixed(2) + '%'
        : '0.00%',
    ]);
    combinedData.push(['Total Asistentes', consolidatedData.totalAsistentes || 0]);
    combinedData.push([
      'Total Asistentes %',
      consolidatedData.totalRegistrados
        ? ((consolidatedData.totalAsistentes / consolidatedData.totalRegistrados) * 100).toFixed(2) + '%'
        : '0.00%',
    ]);
    combinedData.push([]); // Línea en blanco para separar secciones
  
    // Agregar datos detallados por sección
    Object.entries(macroReportData).forEach(([reportTitle, groups]) => {
      combinedData.push([reportTitle]); // Título de la sección
      combinedData.push([
        'Grupo',
        'Total Invitados',
        'Total Registrados',
        '% Registrados',
        'Total Asistentes',
        '% Asistentes',
      ]); // Encabezados de la tabla
  
      groups.forEach((group) => {
        combinedData.push([
          group.name,
          group.totalInvitados || 0,
          group.totalRegistrados || 0,
          group.totalInvitados
            ? ((group.totalRegistrados / group.totalInvitados) * 100).toFixed(2) + '%'
            : '0.00%',
          group.totalAsistentes || 0,
          group.totalRegistrados
            ? ((group.totalAsistentes / group.totalRegistrados) * 100).toFixed(2) + '%'
            : '0.00%',
        ]);
      });
  
      combinedData.push([]); // Línea en blanco entre tablas
    });
  
    // Crear el libro y la hoja
    const worksheet = XLSX.utils.aoa_to_sheet(combinedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
  
    // Descargar el archivo Excel
    XLSX.writeFile(workbook, 'reporte_encuentro_enero.xlsx');
  };
  
  
  
  

  async function fetchGuestsForEventGroup(eventIds: number[], groupId: number) {
    const { data: rawGuests, error } = await supabase
      .from('event_guest')
      .select(
        'id, email, registered, assisted, company_razon_social, company:company_id(razon_social), name, virtual_session_time'
      )
      .in('event_id', eventIds);
  
    if (error) {
      console.error('Error fetching guests for events:', error);
      return;
    }
  
    // Consolidar invitados únicos por email
    const consolidatedGuests: Guest[] = rawGuests.reduce((acc: Guest[], guest) => {
      const existingGuest = acc.find((g) => g.email === guest.email);
  
      if (existingGuest) {
        // Consolidar valores existentes
        existingGuest.registered = existingGuest.registered || guest.registered;
        existingGuest.assisted = existingGuest.assisted || guest.assisted;
        existingGuest.virtual_session_time += guest.virtual_session_time || 0;
      } else {
        // Agregar nuevo invitado único
        acc.push({
          id: guest.id,
          name: guest.name,
          // @ts-expect-error prisa
          company: guest.company?.razon_social || guest.company_razon_social || '',
          email: guest.email,
          registered: guest.registered || false,
          assisted: guest.assisted || false,
          virtual_session_time: guest.virtual_session_time || 0,
          position: '', // Puedes asignar un valor por defecto si es necesario
        });
      }
  
      return acc;
    }, []);
  
    // Actualizar el estado del grupo con los invitados consolidados
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, guests: consolidatedGuests } : group
      )
    );
  }
  

  function calculateConsolidatedData() {
    const allGuests = groups.flatMap((group) => group.guests);

    const consolidatedGuests = allGuests.reduce((acc: Guest[], guest) => {
      const existingGuest = acc.find((g) => g.email === guest.email);

      if (existingGuest) {
        existingGuest.registered = existingGuest.registered || guest.registered;
        existingGuest.assisted = existingGuest.assisted || guest.assisted;
        existingGuest.virtual_session_time += guest.virtual_session_time || 0;
      } else {
        acc.push(guest);
      }

      return acc;
    }, []);

    const filteredGuests = consolidatedGuests.filter((guest) => {
      return selectedCompany === 'Todas' || guest.company === selectedCompany;
    });

    const consolidated = filteredGuests.reduce(
      (acc, guest) => {
        acc.totalInvitados++;
        if (guest.registered) acc.totalRegistrados++;
        if (guest.assisted) acc.totalAsistentes++;
        return acc;
      },
      { totalInvitados: 0, totalRegistrados: 0, totalAsistentes: 0 }
    );

    setConsolidatedData(consolidated);
    setConsolidatedGuests(filteredGuests);
    console.log(filteredGuests);
  }

  function addGroup() {
    setGroups((prev) => [
      ...prev,
      { id: groupCounter, eventIds: [], guests: [] },
    ]);
    setGroupCounter((prev) => prev + 1); // Incrementar el contador
  }

  function removeGroup(groupId: number) {
    setGroups((prev) => prev.filter((group) => group.id !== groupId));
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Macro Reporte: {selectedMacroReport}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seleccionar Macro Reporte</CardTitle>
        </CardHeader>
        <CardContent>
        <Select value={selectedMacroReport || ''} onValueChange={setSelectedMacroReport}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un macro reporte" />
          </SelectTrigger>
          <SelectContent>
            {macroReports.map((report) => (
              <SelectItem key={report.id} value={report.id}>
                {report.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Botón para descargar reporte */}
        {selectedMacroReport === 'Encuentro Enero' && (
              <Button className="mt-4" onClick={handleDownloadReport}>
                Descargar reporte
              </Button>
            )}
        </CardContent>
      </Card>

      {consolidatedData && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Consolidado</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Invitados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{consolidatedData.totalInvitados}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Registrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{consolidatedData.totalRegistrados}</div>
                <div className="text-sm text-gray-500">
                  ({((consolidatedData.totalRegistrados / consolidatedData.totalInvitados) * 100).toFixed(2)}%)
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Asistentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{consolidatedData.totalAsistentes}</div>
                <div className="text-sm text-gray-500">
                  ({((consolidatedData.totalAsistentes / consolidatedData.totalRegistrados) * 100).toFixed(2)}%)
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtrar por Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanySelect
            companies={companies}
            onValueChange={setSelectedCompany}
            defaultValue="Todas"
          />
        </CardContent>
      </Card>

      <br />
      {
        selectedMacroReport == "Encuentro Enero" ? (
          <MacroEventSummary macroReports={macroReportsEnero} defaultCompany={selectedCompany} onSummariesChange={handleSummariesChange}/>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <div key={group.id}>
                <Card>
                  <CardHeader>
                    {/*@ts-expect-error prisa */}
                    <CardTitle>{group.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Selector de grupos */}
                    <Select
                      value={group.id.toString()} // Valor preseleccionado del grupo
                      onValueChange={(value) => {
                        const selectedGroup = groups.find((g) => g.id === Number(value));
                        if (selectedGroup) {
                          fetchGuestsForEventGroup(selectedGroup.eventIds, group.id);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((grp) => (
                          <SelectItem key={grp.id} value={grp.id.toString()}>
                    {/*@ts-expect-error prisa */}
                            {grp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <br />
                    {/* Reporte del grupo con filtro de empresa */}
                    <EventReportTab
                      guests={group.guests.filter(
                        (guest) =>
                          selectedCompany === "Todas" || guest.company === selectedCompany
                      )}
                      defaultCompany={selectedCompany}
                      showCompanyFilter={false}
                    />
                    <br />
                    {/* Botón para eliminar grupo */}
                    <Button onClick={() => removeGroup(group.id)}>
                      Eliminar Grupo
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
            </div>
            <br />
            <div className="grid gap-4 mb-6">
            <Button onClick={addGroup}>
              Agregar Grupo
            </Button>
            </div>
          </>
          )
            }
        <br />
      <GuestsTable guests={consolidatedGuests} />
    </div>
  );
}
