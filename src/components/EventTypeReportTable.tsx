import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type EventStats = {
  eventId: number
  eventName: string
  eventType: string
  registrados: number
  asistentes: number
}

type EventsTableProps = {
  eventStats: EventStats[]
}

export function EventTypeReportTable({ eventStats }: EventsTableProps) {

  const groupedByType = eventStats.reduce((acc, event) => {
    if (!acc[event.eventType]) {
      acc[event.eventType] = { registrados: 0, asistentes: 0 }
    }
    acc[event.eventType].registrados += event.registrados
    acc[event.eventType].asistentes += event.asistentes
    return acc
  }, {} as Record<string, { registrados: number; asistentes: number }>)

  return (
    <div className="border border-gray-300 rounded-lg p-4 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Encuentro por modalidad</h2>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo de Evento</TableHead>
          <TableHead>Registrados</TableHead>
          <TableHead>Asistentes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
      {Object.entries(groupedByType).map(([eventType, stats]) => (
          <TableRow key={eventType}>
            <TableCell>{eventType}</TableCell>
            <TableCell>{stats.registrados}</TableCell>
            <TableCell>
              {stats.asistentes} ({
                stats.registrados === 0 ? "0.00" : ((stats.asistentes / stats.registrados) * 100).toFixed(2)
              }%)
              </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  )
}

