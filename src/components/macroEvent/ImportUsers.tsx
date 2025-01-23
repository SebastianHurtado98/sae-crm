'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { SearchableSelectFilter } from '@/components/SearchableSelectFilter'
import Select, { MultiValue } from 'react-select';
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Option = { value: string, label: string };

type Membership = {
  id: number
  name: string
  company_id: number
  membership_type: string
  forum_consumer_first_semester: boolean
  forum_consumer_second_semester: boolean
  forum_sectorial_first_semester: boolean
  forum_sectorial_second_semester: boolean
}

type Executive = {
  id: number
  name: string
  email: string
  last_name: string
  user_type: string
  company_id: number
  membership_id: number
  active: boolean
  end_date: string
  sae_meetings: string[]
  membership: Membership
}

type Company = {
  id: number
  razon_social: string
  status: string
}

const forumTypes = [
  "Primero Comercial",
  "Segundo Comercial",
  "Primero Sectorial",
  "Segundo Sectorial"
]

const membershipTypes = [
  "SAE Ejecutivo",
  "SAE Reuniones",
  "SAE Virtual",
  "SAE Virtual Nuevo",
  "SAE Virtual Power",
  "SAE Básico",
  "SAE Básico Nuevo",
  "SAE Básico reuniones",
  "SAE Completo",
  "SAE Especial",
  "AC",
  "Free trial",
]

const userTypes = [
  "Titular",
  "Cupo de cortesía",
  "Cupo adicional",
  "Cortesía de reuniones",
  "Cortesía de reportes",
  "Titular adicional",
  "Titular virtual",
  "Cliente potencial",
  "Titular Axpen",
  "Titular Vitalicio",
  "Titular indefinido",
  "Invitado por transición laboral",
  "Cliente beca",
  "Reemplazo",
  "AC",
  "Otros",
]

const saeMeetingsOptions = [
  "Encuentro mensual presencial",
  "Encuentro mensual virtual",
  "Convención anual",
  "SAE Especiales",
  "Reuniones especiales con autoridades"
]

const statusOptions = ['Cliente SAE', 'Ex-cliente SAE', 'No cliente SAE']

export function ImportUsers({ listId }: { listId: number }) {
  const [executives, setExecutives] = useState<Executive[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedUserTypes, setSelectedUserTypes] = useState<Option[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all')
  const [selectedActive, setSelectedActive] = useState<string>('all')
  const [selectedSaeMeeting, setSelectedSaeMeeting] = useState<Option[]>([])
  const [selectedCompanyStatus, setSelectedCompanyStatus] = useState<Option[]>([])
  const [selectedExecutives, setSelectedExecutives] = useState<number[]>([])
  const [selectedMembershipType, setSelectedMembershipType] = useState<Option[]>([])
  const [selectedForumType, setSelectedForumType] = useState<Option[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const convertDateFormat = (dateString: string) => {
    if (!dateString) return '';
  
    // Determine the separator used in the date string
    const separator = dateString.includes('-') ? '-' : dateString.includes('/') ? '/' : null;
  
    if (!separator) return ''; // Return empty string if no valid separator is found
  
    // Split the date string using the identified separator
    const [month, day, year] = dateString.split(separator);
  
    // Rearrange into DD-MM-YYYY or DD/MM/YYYY format
    return `${day}${separator}${month}${separator}${year}`;
  };
  


  useEffect(() => {
    fetchExecutives()
    fetchCompanies()
  }, [])

  async function fetchExecutives() {
    let query = supabase
      .from('executive')
      .select(`
        *,
        company:company_id (razon_social),
        assistant:assistant_id (name, last_name),
        membership:membership_id (name, company_id, membership_type, forum_consumer_first_semester, forum_consumer_second_semester, forum_sectorial_first_semester, forum_sectorial_second_semester)
      `)

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.or(`name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching executives:', error)
    } else {
      setExecutives(data || [])
    }
  }

  async function fetchCompanies() {
    const { data, error } = await supabase
      .from('company')
      .select('id, razon_social, status')

    if (error) {
      console.error('Error fetching companies:', error)
    } else {
      setCompanies(data || [])
    }
  }

  const filteredExecutives = executives.filter(executive => {
    const userTypeMatch =
      selectedUserTypes.length === 0 || selectedUserTypes.some((option: Option) => option.value === executive.user_type);    
  
    const companyMatch =
      selectedCompanyId === 'all' || (executive.company_id && executive.company_id.toString() === selectedCompanyId);
  
    const activeMatch =
      selectedActive === 'all' || (executive.active !== null && executive.active === (selectedActive === 'true'));
  
    const saeMeetingMatch =
      selectedSaeMeeting.length === 0 || selectedSaeMeeting.some((selected: Option) => executive.sae_meetings && executive.sae_meetings.includes(selected.value));
  
    const companyStatusMatch =
      selectedCompanyStatus.length === 0 || selectedCompanyStatus.some((state: Option) => 
        companies.find(company => company.id === executive.company_id)?.status === state.value
      );
  
    const searchMatch =
      executive.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      executive.last_name.toLowerCase().includes(searchQuery.toLowerCase());

    const membershipTypeMatch = 
      selectedMembershipType.length === 0 || selectedMembershipType.some((option: Option) => executive.membership?.membership_type === option.value);

    const forumTypeMatch = 
    selectedForumType.length === 0 || selectedForumType.some((forum: Option) => {
      switch (forum.value) {
        case "Primero Comercial":
          return executive.membership?.forum_consumer_first_semester;
        case "Segundo Comercial":
          return executive.membership?.forum_consumer_second_semester;
        case "Primero Sectorial":
          return executive.membership?.forum_sectorial_first_semester;
        case "Segundo Sectorial":
          return executive.membership?.forum_sectorial_second_semester;
        default:
          return false;
      }
    });
    
  
    return userTypeMatch && companyMatch && activeMatch && saeMeetingMatch && companyStatusMatch && searchMatch && membershipTypeMatch && forumTypeMatch;
  });
  

  const handleExecutiveSelect = (executiveId: number) => {
    setSelectedExecutives(prev => 
      prev.includes(executiveId)
        ? prev.filter(id => id !== executiveId)
        : [...prev, executiveId]
    )
  }

  const handleSelectAll = () => {
    const visibleIds = filteredExecutives.map(executive => executive.id);
  
    if (selectAll) {
      // Deselect only the visible executives
      setSelectedExecutives(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible executives
      setSelectedExecutives(prev => [...new Set([...prev, ...visibleIds])]);
    }
    
    setSelectAll(!selectAll);
  };

  async function createGuestsBatch(listId: number, executiveIds: number[]) {
    const guests = executiveIds.map((executiveId) => {
      const executive = executives.find(e => e.id === executiveId)
      return {
        list_id: listId,
        executive_id: executiveId,
        company_id: executive?.company_id,
        email: executive?.email.toLowerCase().trim(),
        is_client_company: true,
        is_user: true,
        name: (executive?.name || " ") + (executive?.last_name || ""),
        tipo_membresia: executive?.membership?.membership_type || 'N/A'
      }
    })
  
    const { error } = await supabase
      .from('guest')
      .upsert(guests, { onConflict: "executive_id, list_id" });
  
    if (error) {
      console.error('Error creating/updating guests:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al importar los usuarios seleccionados.",
        variant: "destructive",
      });
    } else {
      console.log('Guests created/updated successfully!');
      toast({
        title: "Éxito",
        description: "Los usuarios seleccionados han sido importados correctamente.",
      });
      setSelectedExecutives([]);
    }
  }
  

  const handleImportSelected = () => {
    if (selectedExecutives.length === 0) {
      toast({
        title: "Advertencia",
        description: "Por favor, seleccione al menos un usuario para importar.",
        variant: "default",
      })
      return
    }
    createGuestsBatch(listId, selectedExecutives)
  }

  const getForumSemestrales = (executive: Executive) => {
    const forums = [];
    if (executive.membership?.forum_consumer_first_semester) forums.push("Primero Comercial");
    if (executive.membership?.forum_consumer_second_semester) forums.push("Segundo Comercial");
    if (executive.membership?.forum_sectorial_first_semester) forums.push("Primero Sectorial");
    if (executive.membership?.forum_sectorial_second_semester) forums.push("Segundo Sectorial");
    return forums.join(", ") || "N/A";
  };


  return (
    <div className="space-y-8">
      <div className="mt-4">
          <input
            type="text"
            placeholder="Buscar por nombre de usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border rounded"
          />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <h4 className="text-md font-medium">Empresa</h4>
          <SearchableSelectFilter
            onSelect={(value) => setSelectedCompanyId(value)}
            label="empresa"
          />
        </div>
        <div>
          <h4 className="text-md font-medium">Tipo de Usuario</h4>
          <Select
            isMulti
            options={userTypes.map(type => ({ value: type, label: type, }))}
            value={selectedUserTypes}
            onChange={(newValue: MultiValue<Option>) => setSelectedUserTypes([...newValue])}
            getOptionLabel={(e: Option) => e.label}
            getOptionValue={(e: Option) => e.value}
            placeholder="Selecciona tipos de usuario"
          />          
        </div>
        <div>
          <h4 className="text-md font-medium">Estado Activo</h4>
          <UISelect value={selectedActive} onValueChange={setSelectedActive}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activo</SelectItem>
              <SelectItem value="false">No Activo</SelectItem>
            </SelectContent>
          </UISelect>
        </div>
        <div>
          <h4 className="text-md font-medium">Reuniones SAE</h4>
          <Select
            isMulti
            options={saeMeetingsOptions.map(option => ({ value: option, label: option }))}
            value={selectedSaeMeeting}
            onChange={(newValue: MultiValue<Option>) => setSelectedSaeMeeting([...newValue])}
            getOptionLabel={(e: Option) => e.label}
            getOptionValue={(e: Option) => e.value}
            placeholder="Selecciona reuniones SAE"
          />
        </div>
        <div>
          <h4 className="text-md font-medium">Estado de Empresa</h4>
          <Select
            isMulti
            options={statusOptions.map(state => ({ value: state, label: state }))}
            value={selectedCompanyStatus}
            onChange={(newValue: MultiValue<Option>) => setSelectedCompanyStatus([...newValue])}
            getOptionLabel={(e: Option) => e.label}
            getOptionValue={(e: Option) => e.value}
            placeholder="Selecciona estados de empresa"
          />
        </div>
        <div>
          <h4 className="text-md font-medium">Tipo de Membresía</h4>
          <Select
            isMulti
            options={membershipTypes.map(type => ({ value: type, label: type }))}
            value={selectedMembershipType}
            onChange={(newValue: MultiValue<Option>) => setSelectedMembershipType([...newValue])}
            getOptionLabel={(e: Option) => e.label}
            getOptionValue={(e: Option) => e.value}
            placeholder="Selecciona tipos de membresía"
          />
        </div>
        <div>
          <h4 className="text-md font-medium">Foros Semestrales</h4>
          <Select 
            isMulti
            options={forumTypes.map(type => ({ value: type, label: type }))}
            value={selectedForumType}
            onChange={(newValue: MultiValue<Option>) => setSelectedForumType([...newValue])}
            getOptionLabel={(e: Option) => e.label}
            getOptionValue={(e: Option) => e.value}
            placeholder="Selecciona un foro"
          />
        </div>
      </div>
  
      {/* Tabla */}
      <Button onClick={handleImportSelected} className="mt-4">
        Importar {selectedExecutives.length} Seleccionados
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox checked={filteredExecutives.every(executive => selectedExecutives.includes(executive.id))} onCheckedChange={handleSelectAll} />
            </TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo de Usuario</TableHead>
            <TableHead>Estado de usuario</TableHead>
            <TableHead>Fecha de Fin</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Estado de Empresa</TableHead>
            <TableHead>Reuniones SAE</TableHead>
            <TableHead>Tipo de Membresía</TableHead>
            <TableHead>Foros Semestrales</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExecutives.map(executive => (
            <TableRow key={executive.id}>
              <TableCell>
                <Checkbox
                  checked={selectedExecutives.includes(executive.id)}
                  onCheckedChange={() => handleExecutiveSelect(executive.id)}
                />
              </TableCell>
              <TableCell>{executive.name} {executive.last_name}</TableCell>
              <TableCell>{executive.user_type}</TableCell>
              <TableCell>{executive.active ? 'Activo' : 'No Activo'}</TableCell>
              <TableCell>
                {executive.end_date && executive.end_date.length >= 5 ? convertDateFormat(executive.end_date) : "Por Definir"}
              </TableCell>
              <TableCell>
                {companies.find(company => company.id === executive.company_id)?.razon_social || 'N/A'}
              </TableCell>
              <TableCell>
                {companies.find(company => company.id === executive.company_id)?.status || 'N/A'}
              </TableCell>
              <TableCell>
                {executive.sae_meetings?.join(', ') || 'N/A'}
              </TableCell>
              <TableCell>
                {executive.membership?.membership_type || 'N/A'}
              </TableCell>
              <TableCell>
                {getForumSemestrales(executive)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  
      {/* Botón de acción */}
      <Button onClick={handleImportSelected} className="mt-4">
      Importar {selectedExecutives.length} Seleccionados
      </Button>
    </div>
  )
  
}
