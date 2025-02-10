'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Project } from '@/app/proyectos/_types/ProyectosTypes'
import Link from 'next/link'
import { PlusCircle, Eye, Pencil, Trash2 } from 'lucide-react'

export default function ProjectsPage() {
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, currentPage, allProjects])

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('project')
      .select(`
        *,
        company:company_id (razon_social),
        executive:executive_id (name, last_name)
      `)

    if (error) {
      console.error('Error fetching projects:', error)
    } else {
      setAllProjects(data || [])
      setFilteredProjects(data || [])
      setTotalPages(Math.ceil((data || []).length / itemsPerPage))
    }
  }

  function applyFilters() {
    let filtered = allProjects

    // Filtrar por búsqueda (razón social)
    if (searchQuery.trim() !== '') {
      const lowerSearch = searchQuery.toLowerCase()
      filtered = allProjects.filter((project) =>
        project.company?.razon_social?.toLowerCase().includes(lowerSearch)
      )
    }

    // Actualizar cantidad de páginas
    setTotalPages(Math.ceil(filtered.length / itemsPerPage))

    // Paginación
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)

    setFilteredProjects(paginated)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
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
        <h1 className="text-xl font-bold">Lista de proyectos</h1>
        <Button asChild>
          <Link href="/proyectos/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar proyecto
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
            <TableHead>Código</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead>Responsable(s)</TableHead>
            <TableHead>Fecha de ingreso</TableHead>
            <TableHead>Fecha de cierre</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProjects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>{project.project_code}</TableCell>
              <TableCell>{project.company.razon_social}</TableCell>
              {project.other_executive ? (
                <TableCell>{project.other_fullname}</TableCell>
              ) : (
                <TableCell>{`${project.executive.name} ${project.executive.last_name}`}</TableCell>
              )}
              <TableCell>{project.assignee.join(', ')}</TableCell>
              <TableCell>{convertDateFormat(project.start_date)}</TableCell>
              <TableCell>{convertDateFormat(project.end_date)}</TableCell>
              <TableCell>{project.status}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/proyectos/${project.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/proyectos/${project.id}/edit`}>
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
