import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StatsCardsProps = {
  totals: {
    totalInvitados: number
    totalRegistrados: number
    totalAsistentes: number
  }
}

export function StatsCards({ totals }: StatsCardsProps) {
  const { totalInvitados, totalRegistrados, totalAsistentes } = totals

  const porcentajeRegistrados = totalInvitados === 0 ? "0.00" : ((totalRegistrados / totalInvitados) * 100).toFixed(2)
  const porcentajeAsistentes = totalRegistrados === 0 ? "0.00" : ((totalAsistentes / totalRegistrados) * 100).toFixed(2)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invitados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInvitados}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRegistrados}</div>
          <p className="text-xs text-muted-foreground">({porcentajeRegistrados}%)</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Asistentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAsistentes}</div>
          <p className="text-xs text-muted-foreground">({porcentajeAsistentes}%)</p>
        </CardContent>
      </Card>
    </div>
  )
}

