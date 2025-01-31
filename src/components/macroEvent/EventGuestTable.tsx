'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import { EmailConfirmationModal } from '../EmailModal'
import * as XLSX from 'xlsx'

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
  lastEmailSent: string
  lastEmailSentShow: string
  apodo: string
  estimado: string
  tareco: string
  is_user: string
}

const emailTypeLabels: { [key: string]: string } = {
  "ninguno": "Invitación no enviada",
  "registro-p": "Invitación SAE enviada",
  "registro-v": "Invitación SAE virtual enviada",
};


export function GuestTable({ listId, eventId = null }: { listId: number; eventId?: number | null }) {
  const [guests, setGuests] = useState<ConsolidatedGuest[]>([])
  const [visibleGuests, setVisibleGuests] = useState<ConsolidatedGuest[]>([])
  const [filterGuests, setFilterGuests] = useState<ConsolidatedGuest[]>([])
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [userTypes, setUserTypes] = useState<string[]>(['Todos'])
  const [filterUserType, setFilterUserType] = useState<string>('Todos')
  const [filterLastEmailSent, setFilterLastEmailSent] = useState<'todos' | 'ninguno' | 'registro-p' | 'registro-v'>('todos');
  const [filterRegistered, setFilterRegistered] = useState<'todos' | 'si' | 'no'>('todos');
  const [filterAssisted, setFilterAssisted] = useState<'todos' | 'si' | 'no'>('todos');
  const [filterDateFrom, setFilterDateFrom] = useState<string | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<string | null>(null);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(10)

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
      console.log("filteredGuests", filteredGuests)
    }

      // Filtro por tipo de usuario
      if (filterUserType !== 'Todos') {
        filteredGuests = filteredGuests.filter((guest) => guest.tipo_usuario === filterUserType);
      }
      // Filtro por registrado
      if (filterRegistered !== 'todos') {
        const isRegistered = filterRegistered === 'si';
        filteredGuests = filteredGuests.filter((guest) => guest.registered === isRegistered);
      }

      // Filtro por correo enviado
      if (filterLastEmailSent !== 'todos') {
        filteredGuests = filteredGuests.filter((guest) => guest.lastEmailSent === filterLastEmailSent);
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
  
      setFilterGuests(filteredGuests)
      
      let paginatedGuests = filteredGuests
      if (itemsPerPage !== "all") {
        paginatedGuests = filteredGuests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        setTotalPages(Math.ceil(filteredGuests.length / itemsPerPage))
      } else {
        setTotalPages(1)
      }
    const sortedData = paginatedGuests.sort((a, b) => {
      return (a.company || "").localeCompare(b.company || "");
    });
    setVisibleGuests(sortedData);
  }, [searchQuery, filterUserType, filterLastEmailSent, filterRegistered, filterAssisted, filterDateFrom, filterDateTo, currentPage, guests, itemsPerPage])

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
        estimado,
        apodo,
        last_name,
        email,
        position,
        end_date,
        user_type,
        tareco,
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

      const macroEventId = 5;

      const { data: emailLogs, error } = await supabase
        .from("sendgridLogs")
        .select("email, email_type, created_at")
        .eq("macro_event_id", macroEventId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching sendgridLogs:", error);
      }

      const lastEmailSentMap = new Map<string, string>();

      if (emailLogs) {
        emailLogs.forEach((log) => {
          if (!lastEmailSentMap.has(log.email)) {
            lastEmailSentMap.set(log.email, log.email_type);
          }
        });
      }


      const consolidatedGuests: ConsolidatedGuest[] = data.map((guest) => {
        const email = guest.email ?? '';
        const lastEmailSent = lastEmailSentMap.get(email) || 'ninguno';
        const lastEmailSentShow = emailTypeLabels[lastEmailSent] || "Invitación no enviada";
        const name = guest.is_user
        ? `${guest.executive?.name?.trim()} ${guest.executive?.last_name?.trim() || ''}`.trim()
        : guest.name ?? '';
    
        // Generar `apodo`, asegurando que nunca sea vacío
        const apodo = guest.is_user
          ? (guest.executive?.apodo?.trim() ? guest.executive.apodo.trim() : name) // Si está vacío o null, usar name
          : name; // Si no es usuario, `apodo` es igual a `name`

        // Generar `estimado`, asegurando que nunca sea vacío
        const estimado = guest.is_user
          ? (guest.executive?.estimado?.trim() ? guest.executive.estimado.trim() : "Estimado(a)") // Si está vacío o null, usar "Estimado(a)"
          : "Estimado(a)"; // Si es externo, siempre "Estimado(a)"

        const tareco = guest.is_user
          ? (guest.executive?.tareco?.trim() ? guest.executive.tareco.trim() : "-") : "-";

        return {
          id: guest.id,
          name: name,
          company: guest.is_client_company
            ? guest.company?.razon_social ?? ''
            : guest.company_razon_social ?? '',
          position: guest.is_user
            ? guest.executive?.position ?? ''
            : guest.position ?? '',
          email: email,
          tipo_usuario: guest.is_user
            ? guest.executive?.user_type ?? ''
            : guest.tipo_usuario ?? '',
          tipo_membresia: guest.is_user ? guest.executive?.membership?.membership_type ?? '' : guest.tipo_membresia ?? '',
          end_date: guest.executive?.end_date ?? '',
          assisted: eventGuestMap[guest.id]?.assisted ?? false,
          registered: eventGuestMap[guest.id]?.registered ?? false,
          lastEmailSent: lastEmailSent,
          lastEmailSentShow: lastEmailSentShow,
          apodo: apodo,
          estimado: estimado,
          tareco: tareco,
          is_user: guest.is_user
      }
    });


      // Agregar datos de event_guest si están disponibles
      const enrichedGuests = consolidatedGuests.map((guest) => ({
        ...guest,
        event_guest: eventGuestMap[guest.id] || null,
      }));

      setGuests(enrichedGuests);
      setUserTypes([
        ...userTypes,
        ...[...new Set(enrichedGuests.map((guest) => guest.tipo_usuario))].filter(
          (tipo) => tipo && tipo !== "" && !userTypes.includes(tipo)
        )
      ]);      
      if (itemsPerPage !== "all") setTotalPages(Math.ceil(count / itemsPerPage));
    }
  }

  async function deleteGuest(guestId: string) {
    const { error: eventGuestError } = await supabase
    .from('event_guest')
    .delete()
    .eq('guest_id', guestId)

  if (eventGuestError) {
    console.error('Error deleting guest:', eventGuestError)
    return
  }

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
    {itemsPerPage !== "all" && (
      <>
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
      </>
      )}
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

  const handleGuestSelect = (guestId: string) => {
      setSelectedGuests(prev => 
        prev.includes(guestId)
          ? prev.filter(id => id !== guestId)
          : [...prev, guestId]
      )
  }
  
  const handleSelectAll = () => {
      const visibleIds = visibleGuests.map(guest => guest.id);
    
      if (selectAll) {

        setSelectedGuests(prev => prev.filter(id => !visibleIds.includes(id)));
      } else {

        setSelectedGuests(prev => [...new Set([...prev, ...visibleIds])]);
      }
      
      setSelectAll(!selectAll);
  };

  const handleEmailConfirmation = async (emailType: string) => {

    // TODO: Cambiar macro evento
    const macroEventId = 5;

    if (selectedGuests.length === 0) {
      console.log("No guests selected. Aborting email send.")
      setIsEmailModalOpen(false)
      return
    }

    console.log(`Sending ${emailType} emails to ${selectedGuests.length} guests`)

    const templateIds: { [key: string]: string } = {
      "registro-p": "d-e9c0123bda8f46eabd8cda5feb941e09",
      "registro-v": "d-19d5cfaf534948c48a9f8c9b16bc041f",
    }
    
    const template_id = templateIds[emailType]
    if (!template_id) {
      console.error(`Invalid emailType: ${emailType}. Aborting email send.`)
      return
    }
    
    const selectedGuestsData = guests.filter((guest) => selectedGuests.includes(guest.id))
    const batchSize = 1000
    const batches = Math.ceil(selectedGuestsData.length / batchSize)

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize
      const end = Math.min((i + 1) * batchSize, selectedGuestsData.length)
      const batchGuests = selectedGuestsData.slice(start, end)


      const emailData = {
        template_id: template_id,
        personalizations: batchGuests.map((guest) => ({
          to: guest.email,
          dynamicTemplateData: {
            first_name: guest.name,
            estimado: guest.estimado,
            apodo: guest.apodo,
            register_link: `https://sae-register.vercel.app/${encodeURIComponent(guest.email)}`,
          },
        })),
      }

      try {
        const response = await fetch("/api/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailData),
        })

        if (!response.ok) {
          throw new Error(`Failed to send email batch ${i + 1} of ${batches}`)
        }

        const { data, error } = await supabase.from("sendgridLogs").insert(
          batchGuests.map((guest) => ({
            email: guest.email,
            email_type: emailType,
            macro_event_id: macroEventId,
          }))
        )

        if (error) {
          console.error(`Error inserting logs into Supabase for batch ${i + 1}:`, error)
        } else {
          console.log(`Successfully inserted logs for batch ${i + 1}`)
          console.log(data)
        }

        console.log(`Successfully sent batch ${i + 1} of ${batches}`)
      } catch (error) {
        console.error(`Error sending email batch ${i + 1} of ${batches}:`, error)
      }
    }

    setIsEmailModalOpen(false)
    window.location.reload();
  }

  const handleExcelClick = async () => {
    const data = filterGuests;

    if (data) {
      try {
        const enrichedData = data.map((guest) => ({
          name: guest.name,
          company: guest.company,
          position: guest.position,
          email: guest.email,
          tipo_usuario: guest.tipo_usuario,
          estado_correo: guest.lastEmailSentShow,
          registered: guest.registered,
          assisted: guest.assisted,
          tipo_membresia: guest.tipo_membresia,
          apodo: guest.apodo,
          estimado: guest.estimado,
          tareco: guest.tareco,
          usuario: guest.is_user ? "Interno" : "Externo",
          registration_link: `https://sae-register.vercel.app/${encodeURIComponent(guest.email)}`,
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(enrichedData);
        XLSX.utils.book_append_sheet(wb, ws, "Guests");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'guests.xlsx';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
      } catch (parseError) {
        console.error('Error generating Excel:', parseError);
      }
    }
  };

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
      {/* Filtro Correo Enviado */}
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-gray-700">Correo Enviado</label>
        <Select
          onValueChange={(value) => setFilterLastEmailSent(value as 'todos' | 'ninguno' | 'registro-p' | 'registro-v')}
          value={filterLastEmailSent}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Selecciona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ninguno">Ninguno</SelectItem>
            <SelectItem value="registro-p">Invitación SAE</SelectItem>
            <SelectItem value="registro-v">Invitación SAE Virtual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Filtro Tipo de Usuario */}
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-gray-700">Tipo de Usuario</label>
        <Select
          onValueChange={(value) => setFilterUserType(value as string)}
          value={filterUserType}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Selecciona" />
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

          {/* Items por página */}
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700">Items por página</label>
            <Select
              onValueChange={(value) => {
                setItemsPerPage(value === "all" ? "all" : Number.parseInt(value))
                setCurrentPage(1)
              }}
              value={itemsPerPage.toString()}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>
      <div className="flex ml-auto space-x-2">
        <Button variant="outline" onClick={() => handleExcelClick()}>Descargar Excel</Button>
      </div>

      <Button className="mt-4" onClick={() => setIsEmailModalOpen(true)}>
        Enviar {selectedGuests.length} Correos
      </Button>
      <PaginationControls />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox checked={visibleGuests.every(guest => selectedGuests.includes(guest.id))} onCheckedChange={handleSelectAll} />
            </TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tipo de usuario</TableHead>
            <TableHead>Estado Correo</TableHead>
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
                <Checkbox
                  checked={selectedGuests.includes(guest.id)}
                  onCheckedChange={() => handleGuestSelect(guest.id)}
                />
              </TableCell>
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
                <TableCell>{guest.lastEmailSentShow}</TableCell>
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
      <EmailConfirmationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onConfirm={handleEmailConfirmation}
        guestCount={selectedGuests.length}
        guests={guests}
        selectedGuests={selectedGuests}
      />
    </div>
  )
}
