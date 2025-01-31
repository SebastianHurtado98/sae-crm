import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ConsolidatedGuest = {
  id: string
  name: string
  company: string
  position: string
  email: string
  tipo_usuario: string
  tipo_membresia: string
  end_date: string
  assisted: boolean
  registered: boolean
  lastEmailSent: string
  lastEmailSentShow: string
  apodo: string
  estimado: string
  tareco: string
  is_user: string
}

interface EmailConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (emailType: string) => void
  guestCount: number
  guests: ConsolidatedGuest[]
  selectedGuests: string[]
}

export function EmailConfirmationModal({ isOpen, onClose, onConfirm, guestCount, guests, selectedGuests }: EmailConfirmationModalProps) {
  const [emailType, setEmailType] = useState("registro")

  const handleConfirm = () => {
    onConfirm(emailType)
    onClose()
  }

  const selectedGuestsData = guests.filter((guest) => selectedGuests.includes(guest.id))

  const hasAlreadySentEmail = selectedGuestsData.some(
    (guest) => guest.lastEmailSent === "registro-p" || guest.lastEmailSent === "registro-v"
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar envío de correos</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>¿Está seguro que desea enviar {guestCount} correos?</p>
          {hasAlreadySentEmail && (
            <p style={{ color: 'red' }}>Advertencia: está seleccionando usuarios a los que ya se les envió correo de registro</p>
          )}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de correo</label>
            <Select value={emailType} onValueChange={setEmailType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione el tipo de correo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registro-p">Registro presencial</SelectItem>
                <SelectItem value="registro-v">Registro virtual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

