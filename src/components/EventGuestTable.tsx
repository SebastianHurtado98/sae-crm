'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditGuestForm } from './EditGuestForm'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import QRCode from 'qrcode'
import JSZip from 'jszip'

type EventGuest = {
  id: string
  event_id: number
  company_id: number | null
  is_client_company: boolean
  company_razon_social: string | null
  executive_id: number | null
  is_user: boolean
  name: string
  dni: string
  email: string
  phone: string
  assistant_name: string | null
  assistant_email: string | null
  substitute: boolean
  substitute_name: string | null
  substitute_email: string | null
  virtual_session_time: number | null
  tipo_usuario: string | null
  tipo_membresia: string | null
  registered: boolean
  assisted: boolean
  position: string | null
  company?: {
    razon_social: string
  }
  executive?: {
    name: string
    last_name: string
    email: string
    office_phone: string
    position: string
  }
}

export function EventGuestTable({ eventId }: { eventId: number }) {
  const [guests, setGuests] = useState<EventGuest[]>([])
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    fetchGuests()
  }, [searchQuery, currentPage])

  async function fetchGuests() {
    console.log("Fetching guests")
    const { data, error, count } = await supabase
      .from('event_guest')
      .select(`
        *,
        company:company_id (razon_social),
        executive:executive_id (name, last_name, email, office_phone, position)
      `, { count: 'exact' })
      .eq('event_id', eventId)
      .ilike('name', `%${searchQuery}%`)
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
  
    if (error) {
      console.error('Error fetching guests:', error)
      return
    }
  
    if (data && count !== null) {
      const sortedData = data.sort((a, b) => {
        const companyNameA = a.is_client_company ? a.company?.razon_social : a.company_razon_social;
        const companyNameB = b.is_client_company ? b.company?.razon_social : b.company_razon_social;
        return (companyNameA || '').localeCompare(companyNameB || '');
      });
      setGuests(sortedData)
      setTotalPages(Math.ceil(count / itemsPerPage))
    }
  }

  async function deleteGuest(guestId: string) {
    const { error } = await supabase
      .from('event_guest')
      .delete()
      .eq('id', guestId)

    if (error) {
      console.error('Error deleting guest:', error)
    } else {
      fetchGuests()
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const PaginationControls = () => (
    <div className="flex items-center justify-between px-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Anterior
      </Button>
      <span>
        Página {currentPage} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Siguiente
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  )

  const handleQRClick = async (eventGuestId: string | null = null) => {  
    let query = supabase
      .from('event_guest')
      .select(`
        *,
        company:company_id (razon_social),
        executive:executive_id (id, name, last_name, email, office_phone, position)
      `)
      .eq('event_id', eventId)
      .ilike('name', `%${searchQuery}%`);
    
    if (eventGuestId) {
      query = query.eq('id', eventGuestId);
    }
    
    const { data, error } = await query;    
  
    if (error) {
      console.error('Error fetching guests:', error)
      return
    }
    
    const guestsQR = data ;
    const zip = new JSZip()
    const qrPromises = guestsQR.map(async (guest) => {
      const guestName = guest.is_user
        ? `${guest.executive?.name} ${guest.executive?.last_name || ''}`.trim()
        : guest.name

      const qrData = guest.is_user 
        ? `I-${guest.executive.id}`
        : `E-${guest.id}`  

      const guestCompany = guest.is_user 
        ? guest.company.razon_social
        : guest.company_razon_social  

      try {
        
        const qrCodeUrl = await QRCode.toDataURL(qrData)
  
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('No se pudo obtener el contexto 2D del canvas');
        }

        const qrImage = new Image();

        qrImage.src = qrCodeUrl;

        await new Promise<void>((resolve) => {
          qrImage.onload = () => {
            const qrSize = 500; 
            const textHeight = 60; 
            const canvasWidth = qrSize;
            const canvasHeight = qrSize + textHeight;

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            ctx.drawImage(qrImage, 0, 0, qrSize, qrSize);

            ctx.fillStyle = 'white';
            ctx.fillRect(0, qrSize, canvasWidth, textHeight);
            
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'black';

            ctx.fillText(guestName, canvasWidth / 2, qrSize + 20);
            ctx.fillText(guestCompany, canvasWidth / 2, qrSize + 40);

            resolve();
          };
        });

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  
        if (!blob) {
          throw new Error(`No se pudo generar el blob para ${guestName}`);
        }
        
        zip.file(`${guestName}-QR-${guest.id}.png`, blob)
  
        
      } catch (error) {
        console.error(`Error generando QR para ${guestName}:`, error)
      }
    })
      
    await Promise.all(qrPromises)    
    
    zip.generateAsync({ type: 'blob' }).then((content) => {
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = 'codigos_qr.zip' 
      link.click() 
      console.log('Archivo ZIP descargado')
    })
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Lista de invitados</h1>
        </div>
        <div className="mt-4">
          <Input
            type="text"
            placeholder="Buscar por nombre de usuario..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      <PaginationControls />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Email del evento</TableHead>
            <TableHead>Tipo de usuario</TableHead>
            <TableHead>Tipo de membresía</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead>Asistió</TableHead>
            <TableHead>Tiempo en sesión virtual</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.map((guest) => (
            <>
              <TableRow key={guest.id}>
                <TableCell>
                  {guest.is_user 
                    ? `${guest.executive?.name} ${guest.executive?.last_name || ''}`.trim()
                    : guest.name
                  }
                </TableCell>
                <TableCell>
                  {guest.is_client_company
                    ? guest.company?.razon_social
                    : guest.company_razon_social}
                </TableCell>
                <TableCell>
                  {guest.is_user 
                    ? guest.executive?.position ?? '' 
                    : guest.position ?? ''}
                </TableCell>
                <TableCell>{guest.email}</TableCell>
                <TableCell>{guest.tipo_usuario || ''}</TableCell>
                <TableCell>{guest.tipo_membresia || ''}</TableCell>
                <TableCell>{guest.registered ? 'Sí' : 'No'}</TableCell>
                <TableCell>{guest.assisted ? 'Sí' : 'No'}</TableCell>
                <TableCell>{guest.virtual_session_time || 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingGuestId(guest.id)}
                    >
                      Editar
                    </Button>
                    <Button onClick={() => handleQRClick(guest.id)}>
                      QR
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Borrar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al invitado del evento.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteGuest(guest.id)}>
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
              {editingGuestId === guest.id && (
                <TableRow>
                  <TableCell colSpan={10}>
                    <div className="space-y-4">
                      <EditGuestForm 
                        guestId={parseInt(guest.id)} 
                        onComplete={() => {
                          setEditingGuestId(null)
                          fetchGuests()
                        }} 
                      />
                      <div className="flex">
                        <Button 
                          variant="outline"
                          onClick={() => setEditingGuestId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
      <PaginationControls />
      <Button onClick={() => handleQRClick()}>
        Generar Códigos QR
      </Button>
    </div>
  )
}

