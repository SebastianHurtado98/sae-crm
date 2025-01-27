import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EmailConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (emailType: string) => void
  guestCount: number
}

export function EmailConfirmationModal({ isOpen, onClose, onConfirm, guestCount }: EmailConfirmationModalProps) {
  const [emailType, setEmailType] = useState("registro")

  const handleConfirm = () => {
    onConfirm(emailType)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar envío de correos</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>¿Está seguro que desea enviar {guestCount} correos?</p>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de correo</label>
            <Select value={emailType} onValueChange={setEmailType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione el tipo de correo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registro">Registro</SelectItem>
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

