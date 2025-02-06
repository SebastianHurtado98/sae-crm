import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export const userTypes = [
  "Titular",
  "Cupo de cortesía",
  "Cupo adicional",
  "Cortesía de reuniones",
  "Cortesía de reportes",
  "Titular adicional",
  "Titular virtual",
  "Cliente potencial",
  "Titular Axpen",
  "Titular Vitalicio",
  "Titular indefinido",
  "Invitado por transición laboral",
  "Cliente beca",
  "Reemplazo",
  "AC",
  "Otros",
]

interface UserTypeSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function UserTypeSelector({ value, onValueChange }: UserTypeSelectorProps) {
  return (
    <div>
      <Label htmlFor="userType">Tipo de usuario</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un tipo de usuario" />
        </SelectTrigger>
        <SelectContent>
          {userTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

