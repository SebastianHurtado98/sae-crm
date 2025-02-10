'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Presentation } from '@/app/presentaciones/_types/PresentacionesTypes'
import Link from 'next/link'
import { PlusCircle, Eye, Pencil, Trash2 } from 'lucide-react'

export default function PresentationsPage() {
  const [allPresentations, setAllPresentations] = useState<Presentation[]>([])
  const [filteredPresentations, setFilteredPresentations] = useState<Presentation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchPresentations()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, currentPage, allPresentations])

  async function fetchPresentations() {
    const { data, error } = await supabase
      .from('presentation')
      .select(`
        *,
        company:company_id (razon_social),
        executive:executive_id (name, last_name)
      `)

    if (error) {
      console.error('Error fetching presentations:', error)
    } else {
      setAllPresentations(data || [])
      setFilteredPresentations(data || [])
      setTotalPages(Math.ceil((data || []).length / itemsPerPage))
    }
  }

  function applyFilters() {
    let filtered = allPresentations

    // Filtrar por búsqueda (razón social)
    if (searchQuery.trim() !== '') {
      const lowerSearch = searchQuery.toLowerCase()
      filtered = allPresentations.filter((presentation) =>
        presentation.company?.razon_social?.toLowerCase().includes(lowerSearch)
      )
    }

    // Actualizar cantidad de páginas
    setTotalPages(Math.ceil(filtered.length / itemsPerPage))

    // Paginación
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)

    setFilteredPresentations(paginated)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  function formatListOfStrings(list: string[]) {
    return list.join(', ')
  }

  function formatBillableInfo(presentation: Presentation) {
    if (presentation.billable && presentation.billable_currency && presentation.billable_amount) {
      return `${presentation.billable_currency} ${presentation.billable_amount.toFixed(2)}`
    }
    return 'No facturable'
  }

  const convertDateFormat = (dateString: string) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-')
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Lista de presentaciones</h1>
        <Button asChild>
          <Link href="/presentaciones/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar presentación
          </Link>
        </Button>
      </div>

      <div className="mt-4 mb-4">
        <input
          type="text"
          placeholder="Buscar por razón social..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <PaginationControls />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead>Responsable(s) de la elaboración</TableHead>
            <TableHead>Expositor(es)</TableHead>
            <TableHead>Origen de solicitud</TableHead>
            <TableHead>Fecha de ingreso</TableHead>
            <TableHead>Fecha y hora de presentación</TableHead>
            <TableHead>Tipo de presentación</TableHead>
            <TableHead>Modalidad</TableHead>
            <TableHead>Facturación</TableHead>
            <TableHead>Comentarios</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPresentations.map((presentation) => (
            <TableRow key={presentation.id}>
              <TableCell>{presentation.company.razon_social}</TableCell>
              {presentation.other_executive ? (
                <TableCell>{presentation.other_fullname}</TableCell>
              ) : (
                  <TableCell>
                    {presentation.executive
                      ? `${presentation.executive.name || ''} ${presentation.executive.last_name || ''}`.trim()
                      : ''}
                  </TableCell>
              )}
              <TableCell>{formatListOfStrings(presentation.elaboration_assignee)}</TableCell>
              <TableCell>{formatListOfStrings(presentation.presentation_assignee)}</TableCell>
              <TableCell>{presentation.order_source}</TableCell>
              <TableCell>{convertDateFormat(presentation.order_date)}</TableCell>
              <TableCell>{presentation.presentation_date_hour}</TableCell>
              <TableCell>{presentation.presentation_type}</TableCell>
              <TableCell>{presentation.modalidad}</TableCell>
              <TableCell>{formatBillableInfo(presentation)}</TableCell>
              <TableCell>{presentation.comments}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/presentaciones/${presentation.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/presentaciones/${presentation.id}/edit`}>
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
