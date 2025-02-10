'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Company } from "@/app/empresas/_types/EmpresasTypes"
import Link from 'next/link'
import { PlusCircle, Eye, Pencil, Trash2 } from 'lucide-react'


export default function EmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchCompanies()
  }, [searchQuery, currentPage])

  async function fetchCompanies() {
    let query = supabase
    .from('company')
    .select('*', { count: 'exact' }) // Incluye `count` para calcular las páginas
    .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.or(`razon_social.ilike.%${searchQuery}%,nombre_comercial.ilike.%${searchQuery}%,ruc.ilike.%${searchQuery}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching companies:', error)
    } else {
      setCompanies(data || [])
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

  const convertDateFormat = (dateString: string | null ) => {
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
          <h1 className="text-xl font-bold">Lista de empresas</h1>
          <Button asChild>
            <Link href="/empresas/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar empresa
            </Link>
          </Button>
        </div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Buscar por nombre de empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    <PaginationControls />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>RUC</TableHead>
            <TableHead>Razón social</TableHead>
            <TableHead>Nombre comercial</TableHead>
            <TableHead>Titulares</TableHead>
            <TableHead>País</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Fecha de ingreso</TableHead>
            <TableHead>Número de trabajadores</TableHead>
            <TableHead>Ventas</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell>{company.ruc}</TableCell>
              <TableCell>{company.razon_social}</TableCell>
              <TableCell>{company.nombre_comercial}</TableCell>
              <TableCell>{company.seats}</TableCell>
              <TableCell>{company.country}</TableCell>
              <TableCell>{company.department}</TableCell>
              <TableCell>{company.address}</TableCell>
              <TableCell>{company.phone_number}</TableCell>
              <TableCell>{company.industry}</TableCell>
              <TableCell>{company.status}</TableCell>
              <TableCell>{convertDateFormat(company.enrollment_date)}</TableCell>
              <TableCell>{company.headcount}</TableCell>
              <TableCell>{company.sales}</TableCell>
              <TableCell>{company.notes}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/empresas/${company.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/empresas/${company.id}/edit`}>
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
  <PaginationControls />
    </div>
  )
}