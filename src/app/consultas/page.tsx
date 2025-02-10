'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Query } from "@/app/consultas/_types/ConsultasTypes"
import Link from 'next/link'
import { PlusCircle, Eye, Pencil, Trash2 } from 'lucide-react'

export default function ConsultasPage() {
  const [allQueries, setAllQueries] = useState<Query[]>([])
  const [filteredQueries, setFilteredQueries] = useState<Query[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchQueries()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, currentPage, allQueries])

  async function fetchQueries() {
    const { data, error } = await supabase
      .from('query')
      .select(`
        *,
        company:company_id (razon_social)
      `)

    if (error) {
      console.error('Error fetching queries:', error)
    } else {
      setAllQueries(data || [])
      setFilteredQueries(data || [])
      setTotalPages(Math.ceil((data || []).length / itemsPerPage))
    }
  }

  function applyFilters() {
    let filtered = allQueries

    // Filtrar por búsqueda (razón social)
    if (searchQuery.trim() !== '') {
      const lowerSearch = searchQuery.toLowerCase()
      filtered = allQueries.filter((q) =>
        q.company?.razon_social?.toLowerCase().includes(lowerSearch)
      )
    }

    // Actualizar cantidad de páginas
    setTotalPages(Math.ceil(filtered.length / itemsPerPage))

    // Paginación
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)

    setFilteredQueries(paginated)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const convertDateFormat = (dateString: string) => {
    if (!dateString) return ''
    if (dateString === 'Pendiente') return 'Pendiente'
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
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Lista de consultas</h1>
        <Button asChild>
          <Link href="/consultas/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Nueva consulta
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
            <TableHead>Encargado</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Fecha de resolución</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredQueries.map((query) => (
            <TableRow key={query.id}>
              <TableCell>{query.company.razon_social}</TableCell>
              <TableCell>{query.assignee.join(', ')}</TableCell>
              <TableCell>{query.description.substring(0, 50)}...</TableCell>
              <TableCell>{convertDateFormat(query.solved_date || 'Pendiente')}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/consultas/${query.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/consultas/${query.id}/edit`}>
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
