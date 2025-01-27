'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"

import { EditGuestForm } from '@/components/macroEvent/EditGuestForm'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import QRCode from 'qrcode'
import JSZip from 'jszip'

/*
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
    end_date: string
    membership_id: number | null
    membership?: {
      membership_type: string
    }
  }
  tipo_usuario?: string
  tipo_membresia?: string
  event_guest?: {
    id: number
    assisted: boolean
    registered: boolean
  }
}
  */

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
}

export function GuestTable({ listId, eventId = null }: { listId: number; eventId?: number | null }) {
  const [guests, setGuests] = useState<ConsolidatedGuest[]>([])
  const [visibleGuests, setVisibleGuests] = useState<ConsolidatedGuest[]>([])
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterRegistered, setFilterRegistered] = useState<'todos' | 'si' | 'no'>('todos');
  const [filterAssisted, setFilterAssisted] = useState<'todos' | 'si' | 'no'>('todos');
  const [filterDateFrom, setFilterDateFrom] = useState<string | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<string | null>(null);

  const itemsPerPage = 100

  useEffect(() => {
    console.log("Fetching guests")
    fetchGuests()
    console.log("Guests fetched", guests)
  }, [])

  useEffect(() => {
    let filteredGuests = guests;

    if (searchQuery) {
      filteredGuests = searchQuery
        ? guests.filter((guest) => {
            const normalizeString = (str: string) =>
              str
                .normalize('NFD') // Descompone caracteres acentuados en su forma básica
                .replace(/[\u0300-\u036f]/g, '') // Elimina los diacríticos (tildes)
    
            const lowerQuery = normalizeString(searchQuery.toLowerCase());
            const nameMatch = normalizeString(guest.name.toLowerCase()).includes(lowerQuery);
            const companyMatch = normalizeString(guest.company.toLowerCase()).includes(lowerQuery);
    
            return nameMatch || companyMatch;
          })
        : guests;
    }
      // Filtro por registrado
      if (filterRegistered !== 'todos') {
        const isRegistered = filterRegistered === 'si';
        filteredGuests = filteredGuests.filter((guest) => guest.registered === isRegistered);
      }

      // Filtro por asistió
      if (filterAssisted !== 'todos') {
        const isAssisted = filterAssisted === 'si';
        filteredGuests = filteredGuests.filter((guest) => guest.assisted === isAssisted);
      }

      // Filtro por rango de fecha
      if (filterDateFrom) {
        filteredGuests = filteredGuests.filter(
          (guest) => new Date(guest.end_date) >= new Date(filterDateFrom)
        );
      }

      if (filterDateTo) {
        filteredGuests = filteredGuests.filter(
          (guest) => new Date(guest.end_date) <= new Date(filterDateTo)
        );
      }
  
    const paginatedGuests = filteredGuests.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    const sortedData = paginatedGuests.sort((a, b) => {
      return (a.company || "").localeCompare(b.company || "");
    });
    setVisibleGuests(sortedData);
    setTotalPages(Math.ceil(filteredGuests.length / itemsPerPage));
  }, [searchQuery, filterRegistered, filterAssisted, filterDateFrom, filterDateTo, currentPage, guests])

  async function fetchGuests() {
    console.log("Fetching guests");

    const { data, error, count } = await supabase
      .from('guest')
      .select(
        `
        *,
        company:company_id (razon_social),
        executive:executive_id (
        name,
        last_name,
        email,
        position,
        end_date,
        user_type,
        membership_id,
        membership:membership_id (membership_type)
      )
      `,
        { count: 'exact' }
      )
      .eq('list_id', listId)

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
              assisted: item.assisted || false,
              registered: item.registered || false,
            };
            return map;
          }, {} as Record<string, { id: number; assisted: boolean; registered: boolean }>);
        }
      } else {
        const { data: eventIds, error: eventsInListError } = await supabase
          .from('event_list')
          .select('event_id')
          .eq('list_id', listId);
        
        const eventIdsList = eventIds?.map((event) => event.event_id) || [];

        if (eventsInListError) {
          console.error('Error fetching events in list:', eventsInListError);
        } else {
          console.log("eventIds", eventIdsList);
          if (eventIdsList.length > 0) {
            const { data: eventGuestData, error: eventGuestError } = await supabase
              .from('event_guest')
              .select('id, guest_id, assisted, registered')
              .in('event_id', eventIdsList);

            console.log("events", eventGuestData);
            if (eventGuestError) {
              console.error('Error fetching event_guest:', eventGuestError);
            } else {
              // Crear un diccionario con los datos de event_guest
              eventGuestMap = eventGuestData?.reduce((map, item) => {
                // Si el guest_id ya existe en el mapa, hacemos un "OR" con los valores actuales
                if (map[item.guest_id]) {
                  map[item.guest_id].assisted = map[item.guest_id].assisted || item.assisted || false;
                  map[item.guest_id].registered = map[item.guest_id].registered || item.registered || false;
                } else {
                  // Si no existe en el mapa, lo inicializamos con los valores actuales
                  map[item.guest_id] = {
                    id: item.id,
                    assisted: item.assisted || false,
                    registered: item.registered || false,
                  };
                }
                return map;
              }, {} as Record<string, { id: number; assisted: boolean; registered: boolean }>); // Diccionario inicial vacío
            }
          }          
        }
      }

      const consolidatedGuests: ConsolidatedGuest[] = data.map((guest) => ({
        id: guest.id,
        name: guest.is_user
          ? `${guest.executive?.name} ${guest.executive?.last_name || ''}`.trim()
          : guest.name ?? '',
        company: guest.is_client_company
          ? guest.company?.razon_social ?? ''
          : guest.company_razon_social ?? '',
        position: guest.is_user
          ? guest.executive?.position ?? ''
          : guest.position ?? '',
        email: guest.email ?? '',
        tipo_usuario: guest.is_user
          ? guest.executive?.user_type ?? ''
          : guest.tipo_usuario ?? '',
        tipo_membresia: guest.is_user ? guest.executive?.membership?.membership_type ?? '' : guest.tipo_membresia ?? '',
        end_date: guest.executive?.end_date ?? '',
        assisted: eventGuestMap[guest.id]?.assisted ?? false,
        registered: eventGuestMap[guest.id]?.registered ?? false,
      }));


      // Agregar datos de event_guest si están disponibles
      const enrichedGuests = consolidatedGuests.map((guest) => ({
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

    const handleQRClick = async (guestId: string | null = null) => {  
      let query = supabase
        .from('guest')
        .select(`
          *,
          company:company_id (razon_social),
          executive:executive_id (id, name, last_name, email, office_phone, position)
        `).eq('list_id', listId)
      
      if (guestId) {
        query = query.eq('id', guestId);
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
      <div className="flex items-center justify-between mb-6">
      <Button onClick={() => handleQRClick()}>
      Generar Códigos QR
      </Button>
      <div className="flex flex-wrap items-end gap-4">
      {/* Filtro Registrado */}
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-gray-700">Registrado</label>
        <Select
          onValueChange={(value) => setFilterRegistered(value as 'todos' | 'si' | 'no')}
          value={filterRegistered}
        >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="si">Sí</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Asistió */}
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700">Asistió</label>
            <Select
              onValueChange={(value) => setFilterAssisted(value as 'todos' | 'si' | 'no')}
              value={filterAssisted}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="si">Sí</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Fecha Desde */}
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700">Fecha Desde</label>
            <Input
              type="date"
              value={filterDateFrom || ''}
              onChange={(e) => setFilterDateFrom(e.target.value || null)}
              className="w-full sm:w-40"
            />
          </div>

          {/* Filtro Fecha Hasta */}
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700">Fecha Hasta</label>
            <Input
              type="date"
              value={filterDateTo || ''}
              onChange={(e) => setFilterDateTo(e.target.value || null)}
              className="w-full sm:w-40"
            />
          </div>
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
            <TableHead>Fecha de fin</TableHead>
            <TableHead>Asistió</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleGuests.map((guest) => (
            <>
              <TableRow key={guest.id}>
                <TableCell>
                  {guest.name}
                </TableCell>
                <TableCell>
                  {guest.company}
                </TableCell>
                <TableCell>
                  {guest.position}
                </TableCell>
                <TableCell>{guest.email}</TableCell>
                <TableCell>{guest.tipo_usuario}
                </TableCell>
                <TableCell>{guest.tipo_membresia}</TableCell>
                <TableCell>{guest.end_date}</TableCell>
                <TableCell>{guest.assisted ? 'Sí' : 'No'}</TableCell>
                <TableCell>{guest.registered ? 'Sí' : 'No'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                  <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(`https://sae-register.vercel.app/${encodeURIComponent(guest.email)}`, '_blank')}
                    >
                      🔗
                    </Button>
                    <Button onClick={() => handleQRClick(guest.id)}>
                      QR
                    </Button>
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
                        eventId={eventId}
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
