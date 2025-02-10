import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type EventStats = {
  eventId: number
  eventName: string
  registrados: number
  asistentes: number
}

type EventsTableProps = {
  eventStats: EventStats[]
}

export function EventsReportTable({ eventStats }: EventsTableProps) {
  return (
    <div className="border border-gray-300 rounded-lg p-4 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Encuentro por evento</h2>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Evento</TableHead>
          <TableHead>Registrados</TableHead>
          <TableHead>Asistentes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {eventStats.map((event) => (
          <TableRow key={event.eventId}>
            <TableCell>{event.eventName}</TableCell>
            <TableCell>{event.registrados}</TableCell>
            <TableCell>
              {event.asistentes} ({
                event.registrados === 0 ? "0.00" : ((event.asistentes / event.registrados) * 100).toFixed(2)
              }%)
              </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  )
}

