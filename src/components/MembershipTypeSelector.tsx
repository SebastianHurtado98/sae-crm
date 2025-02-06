import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export const membershipTypes = [
  "SAE Ejecutivo",
  "SAE Reuniones",
  "SAE Virtual",
  "SAE Virtual Nuevo",
  "SAE Virtual Power",
  "SAE Básico",
  "SAE Básico Nuevo",
  "SAE Básico reuniones",
  "SAE Completo",
  "SAE Especial",
  "AC",
]

interface MembershipTypeSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function MembershipTypeSelector({ value, onValueChange }: MembershipTypeSelectorProps) {
  return (
    <div>
      <Label htmlFor="membershipType">Tipo de membresía</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un tipo de membresía" />
        </SelectTrigger>
        <SelectContent>
          {membershipTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

