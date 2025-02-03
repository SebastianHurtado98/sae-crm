'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { PlusCircle, Eye, Pencil, Trash2 } from 'lucide-react'

type Executive = {
  id: number
  dni: string
  name: string
  last_name: string
  assistant_id: number
  company_id: number
  tareco: string
  birth_date: string
  country: string
  email: string
  position: string
  area: string
  user_type: string
  active: boolean
  office_phone_cc: string
  office_phone: string
  office_phone_extension: string
  mobile_phone_cc: string
  mobile_phone: string
  start_date: string
  end_date: string | null
  apodo: string
  estimado: string
  observation: boolean
  company: {
    razon_social: string
  }
  assistant: {
    name: string
    last_name: string
  }
  membership_id: number | null
  membership: {
    name: string
    membership_type: string
  } | null
  sae_meetings: string[] | null
}

export default function UsuariosPage() {
  const [executives, setExecutives] = useState<Executive[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10


  useEffect(() => {
    fetchExecutives()
  }, [searchQuery, currentPage])

  async function fetchExecutives() {
    let query = supabase
      .from('executive')
      .select(`
        *,
        company:company_id (razon_social),
        assistant:assistant_id (name, last_name),
        membership:membership_id (name, membership_type)
      `,  { count: 'exact' })
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (searchQuery && searchQuery.trim() !== '') {
        const terms = searchQuery.trim().split(' '); // Divide el query en palabras
        // @ts-expect-error no se
        const filters = [];
      
        terms.forEach(term => {
          // Construye los filtros para cada palabra
          filters.push(`name.ilike.%${term}%`);
          filters.push(`last_name.ilike.%${term}%`);
        });
      
        // Une los filtros con `or`
        // @ts-expect-error no se
        const filterQuery = filters.join(',');
      
        // Aplica la consulta con los filtros dinámicos
        query = query.or(filterQuery);
      }
      

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching executives:', error)
    } else {
      setExecutives(data || [])
      if (count !== null) {
        setTotalPages(Math.ceil(count / itemsPerPage))
      }
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }
  

  function formatPhoneNumber(cc: string | null = '', phone: string | null = '', extension?: string | null): string {
    const cleanedCc = (cc ?? '').trim(); // Usa '' si cc es null o undefined
    const cleanedPhone = (phone ?? '').trim(); // Usa '' si phone es null o undefined
    const cleanedExtension = (extension ?? '').trim(); // Usa '' si extension es null o undefined
    // Formatear el número telefónico
    let formattedPhone = `${cleanedCc} ${cleanedPhone}`.trim(); // Elimina espacios innecesarios
    if (cleanedExtension) {
      formattedPhone += ` (${cleanedExtension})`;
    }
    return formattedPhone;
  }
  
  
  function formatSaeMeetings(meetings: string[] | null): string {
    if (!meetings || meetings.length === 0) {
      return ''
    }
    return meetings.join(', ')
  }

  const convertDateFormat = (dateString: string) => {
    if (!dateString) return ''
    // Split the date string
    const [year, month, day] = dateString.split('-')
    // Rearrange into DD-MM-YYYY format
    return `${day}-${month}-${year}`
  }

  const PaginationControls = () => (
    <div className="flex items-center justify-between px-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
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
      </Button>
    </div>
  )
  

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Lista de usuarios</h1>
          <Button asChild>
            <Link href="/usuarios/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar usuario
            </Link>
          </Button>
        </div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Buscar por nombre de usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <PaginationControls/>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>DNI</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Apellido</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Membresía</TableHead>
            <TableHead>Secretaria</TableHead>
            <TableHead>Tareco</TableHead>
            <TableHead>Fecha de nacimiento</TableHead>
            <TableHead>País</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Tipo de usuario</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Celular</TableHead>
            <TableHead>Fecha de ingreso</TableHead>
            <TableHead>Fecha de baja</TableHead>
            <TableHead>Estimado</TableHead>
            <TableHead>Apodo</TableHead>
            <TableHead>En alerta</TableHead>
            <TableHead>Reuniones SAE</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {executives.map((executive) => (
            <TableRow key={executive.id}>
              <TableCell>{executive.dni}</TableCell>
              <TableCell>{executive.name}</TableCell>
              <TableCell>{executive.last_name}</TableCell>
              <TableCell>{executive.company_id ? executive.company.razon_social : ''}</TableCell>
              <TableCell>{executive.membership ? executive.membership.membership_type : ''}</TableCell>
              <TableCell>{executive.assistant_id ? executive.assistant.name : ''} </TableCell>
              <TableCell>{executive.tareco}</TableCell>
              <TableCell>{executive.birth_date}</TableCell>
              <TableCell>{executive.country}</TableCell>
              <TableCell>{executive.email}</TableCell>
              <TableCell>{executive.position}</TableCell>
              <TableCell>{executive.area}</TableCell>
              <TableCell>{executive.user_type}</TableCell>
              <TableCell>{executive.active ? 'Activo' : 'No activo'}</TableCell>
              <TableCell>{formatPhoneNumber(executive.office_phone_cc, executive.office_phone, executive.office_phone_extension)}</TableCell>
              <TableCell>{formatPhoneNumber(executive.mobile_phone_cc, executive.mobile_phone)}</TableCell>
              <TableCell>{convertDateFormat(executive.start_date)}</TableCell>
              <TableCell>{executive.end_date || 'N/A'}</TableCell>
              <TableCell>{executive.estimado}</TableCell>
              <TableCell>{executive.apodo}</TableCell>
              <TableCell>{executive.observation ? "Si" : "No"}</TableCell>
              <TableCell>{formatSaeMeetings(executive.sae_meetings)}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/usuarios/${executive.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/usuarios/${executive.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Borrar</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationControls/>
    </div>
  )
}