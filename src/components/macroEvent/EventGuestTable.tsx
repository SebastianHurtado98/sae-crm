'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditGuestForm } from '@/components/macroEvent/EditGuestForm'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Guest = {
  id: string
  list_id: number
  company_id: number | null
  is_client_company: boolean
  company_razon_social: string | null
  executive_id: number | null
  is_user: boolean
  name: string
  dni: string
  email: string
  phone: string
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
    user_type: string
  }
  tipo_usuario?: string
  tipo_membresia?: string
  event_guest?: {
    id: number
    assisted: boolean
    registered: boolean
  }
}

export function GuestTable({ listId, eventId = null }: { listId: number; eventId?: number | null }) {
  const [guests, setGuests] = useState<Guest[]>([])
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 100

  useEffect(() => {
    fetchGuests()
  }, [searchQuery, currentPage])

  async function fetchGuests() {
    console.log("Fetching guests");

    const { data, error, count } = await supabase
      .from('guest')
      .select(
        `
        *,
        company:company_id (razon_social),
        executive:executive_id (name, last_name, email, office_phone, position, user_type)
      `,
        { count: 'exact' }
      )
      .eq('list_id', listId)
      .ilike('name', `%${searchQuery}%`)
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

    if (error) {
      console.error('Error fetching guests:', error);
      return;
    }

    if (data && count !== null) {
      let eventGuestMap: Record<string, { id: number; assisted: boolean; registered: boolean }> = {};

      // Si se pasa un eventId, obtener datos de event_guest
      if (eventId) {
        const { data: eventGuestData, error: eventGuestError } = await supabase
          .from('event_guest')
          .select('id, guest_id, assisted, registered')
          .eq('event_id', eventId);

        if (eventGuestError) {
          console.error('Error fetching event_guest:', eventGuestError);
        } else {
          // Crear un diccionario con los datos de event_guest
          eventGuestMap = eventGuestData?.reduce((map, item) => {
            map[item.guest_id] = {
              id: item.id,
              assisted: item.assisted,
              registered: item.registered,
            };
            return map;
          }, {} as Record<string, { id: number; assisted: boolean; registered: boolean }>);
        }
      }

      // Ordenar datos
      const sortedData = data.sort((a, b) => {
        const companyNameA = a.is_client_company
          ? a.company?.razon_social
          : a.company_razon_social;
        const companyNameB = b.is_client_company
          ? b.company?.razon_social
          : b.company_razon_social;
        return (companyNameA || "").localeCompare(companyNameB || "");
      });

      // Agregar datos de event_guest si están disponibles
      const enrichedGuests = sortedData.map((guest) => ({
        ...guest,
        event_guest: eventGuestMap[guest.id] || null,
      }));

      setGuests(enrichedGuests);
      setTotalPages(Math.ceil(count / itemsPerPage));
    }
  }

  async function deleteGuest(guestId: string) {
    const { error } = await supabase
      .from('guest')
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
            <TableHead>Email</TableHead>
            <TableHead>Tipo de usuario</TableHead>
            <TableHead>Membresía</TableHead>
            {eventId && <TableHead>Asistió</TableHead>}
            {eventId && <TableHead>Registrado</TableHead>}
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
                <TableCell>{guest.is_user 
                    ? guest.executive?.user_type ?? '' 
                    : guest.tipo_usuario ?? ''}
                </TableCell>
                <TableCell>{guest.tipo_membresia}</TableCell>
                {eventId && <TableCell>{guest.event_guest?.assisted ? 'Sí' : 'No'}</TableCell>}
                {eventId && <TableCell>{guest.event_guest?.registered ? 'Sí' : 'No'}</TableCell>}
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingGuestId(guest.id)}
                    >
                      Editar
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
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al invitado de la lista.
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
                          setEditingGuestId(null);
                          fetchGuests();
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
    </div>
  )
}
