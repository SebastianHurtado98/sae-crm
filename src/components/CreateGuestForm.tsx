'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

type Company = {
  id: number
  razon_social: string
}

type Executive = {
  id: number
  name: string
  last_name: string
  email: string
  company_id: number
}

type CreateGuestFormProps = {
  eventId: number
  onComplete: () => void
}

export function CreateEventGuestForm({ eventId, onComplete }: CreateGuestFormProps) {
  const [isClientCompany, setIsClientCompany] = useState(false)
  const [isUser, setIsUser] = useState(false)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [companyRazonSocial, setCompanyRazonSocial] = useState('')
  const [executiveId, setExecutiveId] = useState<number | null>(null)
  const [listId, setListId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [dni, setDni] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const [tipoUsuario, setTipoUsuario] = useState('')
  const [tipoMembresia, setTipoMembresia] = useState('')
  const [reemplazaANombre, setReemplazaANombre] = useState('')
  const [reemplazaACorreo, setReemplazaACorreo] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [executives, setExecutives] = useState<Executive[]>([])

  useEffect(() => {
    fetchCompanies()
    fetchExecutives()
    fetchListId()
  }, [])

  async function fetchCompanies() {
    const { data, error } = await supabase
      .from('company')
      .select('id, razon_social')
    if (error) {
      console.error('Error fetching companies:', error)
    } else {
      setCompanies(data || [])
    }
  }

  async function fetchExecutives() {
    const { data, error } = await supabase
      .from('executive')
      .select('id, name, last_name, email, company_id')
    if (error) {
      console.error('Error fetching executives:', error)
    } else {
      setExecutives(data || [])
    }
  }

  async function fetchListId() {
    const { data, error } = await supabase
      .from('event_list')
      .select('list_id')
      .eq('event_id', eventId)
      .single()
    if (error) {
      console.error('Error fetching listId:', error)
    } else {
      setListId(data.list_id || null)
    }
  }

  const filteredExecutives = executives.filter(executive => executive.company_id === companyId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const guest = {
      is_client_company: isClientCompany,
      is_user: isUser,
      company_id: isClientCompany ? companyId : null,
      company_razon_social: isClientCompany ? null : companyRazonSocial,
      executive_id: isUser ? executiveId : null,
      name,
      dni,
      email,
      position,
      tipo_usuario: tipoUsuario,
      tipo_membresia: tipoMembresia,
      list_id: listId
    }

    const { data: dataGuest, error: errorGuest } = await supabase
      .from('guest')
      .insert([guest])
      .select()
      .single()

    if (errorGuest) console.error('Error creating guest:', errorGuest)
    else {
      console.log(dataGuest)
      const eventGuest = {
        event_id: eventId,
        guest_id: dataGuest.id,
        name: "",
        reemplaza_a_nombre: reemplazaANombre,
        reemplaza_a_correo: reemplazaACorreo,
      }
      const {error: errorEventGuest } = await supabase
        .from('event_guest')
        .insert([eventGuest])
        .select()
      if (errorEventGuest) console.error('Error creating guest:', errorEventGuest)
      else{
        onComplete()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>
          <Checkbox 
            checked={isClientCompany} 
            onCheckedChange={(checked) => {
              setIsClientCompany(checked as boolean)
              if (!checked) setIsUser(false)
            }} 
          />
          {' '}Empresa Interna
        </Label>
      </div>
      {isClientCompany ? (
        <div>
          <Label htmlFor="companyId">Empresa</Label>
          <Select 
            value={companyId?.toString()} 
            onValueChange={(value) => {
              setCompanyId(parseInt(value))
              setExecutiveId(null) // Reset executive when company changes
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona la empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  {company.razon_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div>
          <Label htmlFor="companyRazonSocial">Razón Social de la Empresa</Label>
          <Input
            id="companyRazonSocial"
            value={companyRazonSocial}
            onChange={(e) => setCompanyRazonSocial(e.target.value)}
            required
          />
        </div>
      )}
      <div>
        <Label>
          <Checkbox 
            checked={isUser} 
            onCheckedChange={(checked) => setIsUser(checked as boolean)}
            disabled={!isClientCompany}
          />
          {' '}Usuario Interno
        </Label>
      </div>
      {isUser && companyId && (
        <>
          <div>
            <Label htmlFor="executiveId">Ejecutivo</Label>
            <Select
              value={executiveId?.toString()}
              onValueChange={(value) => {
                setExecutiveId(parseInt(value))
                const selectedExecutive = filteredExecutives.find((executive) => executive.id === parseInt(value))
                if (selectedExecutive) {
                  setEmail(selectedExecutive.email)
                  setName(`${selectedExecutive.name} ${selectedExecutive.last_name}`)
                }
              }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el ejecutivo" />
              </SelectTrigger>
              <SelectContent>
                {filteredExecutives.map((executive) => (
                  <SelectItem key={executive.id} value={executive.id.toString()}>
                    {`${executive.name} ${executive.last_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="email">Email del evento</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </>
      )}
      {!isUser && (
        <>
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="dni">DNI</Label>
            <Input
              id="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="tipoUsuario">Tipo de usuario</Label>
            <Input
              id="tipoUsuario"
              value={tipoUsuario}
              onChange={(e) => setTipoUsuario(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="tipoMembresia">Tipo de membresia</Label>
            <Input
              id="tipoMembresia"
              value={tipoMembresia}
              onChange={(e) => setTipoMembresia(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="reemplazaANombre">Reemplaza a (nombre y apellido)</Label>
            <Input
              id="reemplazaANombre"
              value={reemplazaANombre}
              onChange={(e) => setReemplazaANombre(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="reemplazaACorreo">Reemplaza a (correo)</Label>
            <Input
              id="reemplazaACorreo"
              value={reemplazaACorreo}
              onChange={(e) => setReemplazaACorreo(e.target.value)}
            />
          </div>
        </>
      )}
      <Button type="submit">Añadir Invitado</Button>
    </form>
  )
}

