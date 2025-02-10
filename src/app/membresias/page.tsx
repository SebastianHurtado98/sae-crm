'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Membership } from '@/app/membresias/_types/MembresiasTypes'
import Link from 'next/link'
import { PlusCircle, Eye, Pencil, Trash2 } from 'lucide-react'

export default function MembershipsPage() {
  const [allMemberships, setAllMemberships] = useState<Membership[]>([]);
  const [filteredMemberships, setFilteredMemberships] = useState<Membership[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Cargar todos los datos al inicio
  useEffect(() => {
    fetchAllMemberships();
  }, []);

  // Actualizar resultados al cambiar la búsqueda o la página
  useEffect(() => {
    applyFilters();
  }, [searchQuery, currentPage]);

  async function fetchAllMemberships() {
    const { data, error } = await supabase
      .from('membership')
      .select(`
        *,
        company:company_id (razon_social)
      `);

    if (error) {
      console.error('Error fetching memberships:', error);
    } else {
      setAllMemberships(data || []);
      setFilteredMemberships(data || []); // Inicialmente, todos los datos están filtrados
      setTotalPages(Math.ceil((data || []).length / itemsPerPage));
    }
  }

  function applyFilters() {
    let filtered = allMemberships;

    // Filtrar por búsqueda
    if (searchQuery.trim() !== '') {
      const lowerSearch = searchQuery.toLowerCase();
      filtered = allMemberships.filter((membership) =>
        membership.name?.toLowerCase().includes(lowerSearch) ||
        membership.company?.razon_social?.toLowerCase().includes(lowerSearch)
      );
    }

    // Actualizar la cantidad de páginas
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));

    // Aplicar paginación
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    setFilteredMemberships(paginated);
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
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
          <h1 className="text-xl font-bold">Lista de membresías</h1>
          <Button asChild>
            <Link href="/membresias/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar membresía
            </Link>
          </Button>
        </div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Buscar por nombre de membresía..."
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
            <TableHead>Nombre de la membresía</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Tipo de membresía</TableHead>
            <TableHead>Membresía por área</TableHead>
            <TableHead>Titulares</TableHead>
            <TableHead>Cupos adicionales</TableHead>
            <TableHead>Fecha de renovación</TableHead>
            <TableHead>Forma de pago</TableHead>
            <TableHead>Renovación completa</TableHead>
            <TableHead>Tarifa</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMemberships.map((membership) => (
            <TableRow key={membership.id}>
              <TableCell>{membership.name}</TableCell>
              <TableCell>{membership.company?.razon_social}</TableCell>
              <TableCell>{membership.membership_type}</TableCell>
              <TableCell>{membership.area_scope ? membership.area : ''}</TableCell>
              <TableCell>{membership.titulares}</TableCell>
              <TableCell>{membership.cupos_adicionales}</TableCell>
              <TableCell>{convertDateFormat(membership.fecha_renovacion)}</TableCell>
              <TableCell>{membership.payment_method}</TableCell>
              <TableCell>{membership.signed_proposal && membership.invoice_sent ? 'Sí' : 'No'}</TableCell>
              <TableCell>{`${membership.payment_currency} ${membership.payment_amount}`}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/membresias/${membership.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/membresias/${membership.id}/edit`}>
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