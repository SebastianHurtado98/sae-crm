'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Assistant } from "@/app/secretarias/_types/SecretariasTypes";
import Link from 'next/link'
import { PlusCircle, Eye, Pencil, Trash2 } from 'lucide-react'


export default function SecretariasPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchAssistants()
  }, [searchQuery, currentPage])

  async function fetchAssistants() {
    let query = supabase
      .from('assistant')
      .select(`
        *,
        company:company_id (razon_social)
      `, {count: 'exact'})
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.or(`name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching assistants:', error)
    } else {
      setAssistants(data || [])
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
          <h1 className="text-xl font-bold">Lista de secretarias</h1>
          <Button asChild>
            <Link href="/secretarias/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar secretaria
            </Link>
          </Button>
        </div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Buscar por nombre de secretaria..."
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
            <TableHead>Email</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Celular</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assistants.map((assistant) => (
            <TableRow key={assistant.id}>
              <TableCell>{assistant.dni}</TableCell>
              <TableCell>{assistant.name}</TableCell>
              <TableCell>{assistant.last_name}</TableCell>
              <TableCell>{assistant.email}</TableCell>
              <TableCell>{assistant.company_id ? assistant.company.razon_social : 'No asignado'}</TableCell>
              <TableCell>{formatPhoneNumber(assistant.cc_office_phone, assistant.office_phone, assistant.office_phone_extension)}</TableCell>
              <TableCell>{formatPhoneNumber(assistant.cc_mobile_phone, assistant.mobile_phone)}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/secretarias/${assistant.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/secretarias/${assistant.id}/edit`}>
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