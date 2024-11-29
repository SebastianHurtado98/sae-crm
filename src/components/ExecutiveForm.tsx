'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { SearchableSelect } from './SearchableSelect'

type ExecutiveFormProps = {
  executiveId?: number
}

type Company = {
  id: number
  razon_social: string
}

type Assistant = {
  id: number
  name: string
  last_name: string
  company_id: number
}

const countries = ["Perú", "Chile", "Colombia", "México", "Argentina"]
const userTypes = ["Titular Principal", "Titular", "Cupo de cortesía", "Titular adicional", "Titular Axpen"]

interface CountryOption {
  value: string
  label: string
  code: string
}

const countryCodes: CountryOption[] = [
  { value: "1", label: "United States", code: "+1" },
  { value: "51", label: "Peru", code: "+51" },
  { value: "54", label: "Argentina", code: "+54" },
  { value: "55", label: "Brazil", code: "+55" },
  { value: "56", label: "Chile", code: "+56" },
  { value: "57", label: "Colombia", code: "+57" },
  { value: "52", label: "Mexico", code: "+52" },
  { value: "34", label: "Spain", code: "+34" },
  // Add more countries as needed
]


export function ExecutiveForm({ executiveId }: ExecutiveFormProps) {
  const [dni, setDni] = useState('')
  const [name, setName] = useState('')
  const [lastName, setLastName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [initialCompany, setInitialCompany] = useState<Company | undefined>(undefined)
  const [assistantId, setAssistantId] = useState('')
  const [tareco, setTareco] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [country, setCountry] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const [area, setArea] = useState('')
  const [userType, setUserType] = useState('')
  const [active, setActive] = useState(true)
  const [officePhoneCc, setOfficePhoneCc] = useState('')
  const [officePhone, setOfficePhone] = useState('')
  const [officePhoneExtension, setOfficePhoneExtension] = useState('')
  const [mobilePhoneCc, setMobilePhoneCc] = useState('')
  const [mobilePhone, setMobilePhone] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchAssistants = useCallback(async (companyId: number) => {
    const { data, error } = await supabase
      .from('assistant')
      .select('id, name, last_name, company_id')
      .eq('company_id', companyId)

    if (error) {
      console.error('Error fetching assistants:', error)
    } else {
      setAssistants(data || [])
    }
  }, [])

  const fetchExecutive = useCallback(async () => {
    if (!executiveId) return

    const { data: executive, error: executiveError } = await supabase
      .from('executive')
      .select('*, company:company_id(id, razon_social)')
      .eq('id', executiveId)
      .single()

    if (executiveError) {
      console.error('Error fetching executive:', executiveError)
    } else if (executive) {
      setDni(executive.dni)
      setName(executive.name)
      setLastName(executive.last_name)
      setCompanyId(executive.company_id.toString())
      setInitialCompany(executive.company)
      setAssistantId(executive.assistant_id?.toString() || '')
      setTareco(executive.tareco)
      setBirthDate(executive.birth_date)
      setCountry(executive.country)
      setEmail(executive.email)
      setPosition(executive.position)
      setArea(executive.area)
      setUserType(executive.user_type)
      setActive(executive.active)
      setOfficePhoneCc(executive.office_phone_cc)
      setOfficePhone(executive.office_phone)
      setOfficePhoneExtension(executive.office_phone_extension)
      setMobilePhoneCc(executive.mobile_phone_cc)
      setMobilePhone(executive.mobile_phone)
      setStartDate(executive.start_date)
      setEndDate(executive.end_date)
      await fetchAssistants(executive.company_id)
    }
  }, [executiveId, fetchAssistants])

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      await fetchExecutive()
      setLoading(false)
    }

    loadInitialData()
  }, [fetchExecutive])

  const handleCompanyChange = (value: string) => {
    setCompanyId(value)
    setAssistantId('')
    fetchAssistants(parseInt(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const executive = {
      dni,
      name,
      last_name: lastName,
      company_id: parseInt(companyId),
      assistant_id: parseInt(assistantId) || null,
      tareco,
      birth_date: birthDate,
      country,
      email,
      position,
      area,
      user_type: userType,
      active,
      office_phone_cc: officePhoneCc,
      office_phone: officePhone,
      office_phone_extension: officePhoneExtension,
      mobile_phone_cc: mobilePhoneCc,
      mobile_phone: mobilePhone,
      start_date: startDate,
      end_date: endDate
    }

    if (executiveId) {
      const { error } = await supabase
        .from('executive')
        .update(executive)
        .eq('id', executiveId)

      if (error) console.error('Error updating executive:', error)
      else router.push('/usuarios')
    } else {
      const { error } = await supabase
        .from('executive')
        .insert([executive])

      if (error) console.error('Error creating executive:', error)
      else router.push('/usuarios')
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="dni">DNI</Label>
        <Input
          id="dni"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={dni}
          maxLength={8}
          onChange={(e) => setDni(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="lastName">Apellido</Label>
        <Input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="companyId">Empresa</Label>
        <SearchableSelect
          onSelect={handleCompanyChange}
          placeholder="Selecciona una empresa"
          label="empresa"
          initialValue={initialCompany}
        />
      </div>
      <div>
        <Label htmlFor="assistantId">Secretaria</Label>
        <Select value={assistantId} onValueChange={setAssistantId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una secretaria" />
          </SelectTrigger>
          <SelectContent>
            {assistants.map((assistant) => (
              <SelectItem key={assistant.id} value={assistant.id.toString()}>
                {`${assistant.name} ${assistant.last_name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="tareco">Tareco</Label>
        <Input
          id="tareco"
          type="text"
          value={tareco}
          onChange={(e) => setTareco(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
        <Input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="country">País</Label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un país" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="area">Área</Label>
        <Input
          id="area"
          type="text"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="userType">Tipo de usuario</Label>
        <Select value={userType} onValueChange={setUserType}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo de usuario" />
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
      <div className="flex items-center space-x-2">
        <Checkbox
          id="active"
          checked={active}
          onCheckedChange={(checked) => setActive(checked as boolean)}
        />
        <Label htmlFor="active">Activo</Label>
      </div>
      <div>
        <Label htmlFor="officePhone">Teléfono de oficina</Label>
        <div className="flex space-x-2">
        <Select value={officePhoneCc} onValueChange={setOfficePhoneCc}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Código" />
            </SelectTrigger>
            <SelectContent>
              {countryCodes.map((country) => (
                <SelectItem key={country.value} value={country.code}>
                  {country.code} ({country.label})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id="officePhone"
            type="tel"
            value={officePhone}
            onChange={(e) => setOfficePhone(e.target.value)}
            placeholder="Número"
          />
          <Input
            id="officePhoneExtension"
            type="text"
            value={officePhoneExtension}
            onChange={(e) => setOfficePhoneExtension(e.target.value)}
            placeholder="Anexo"
            className="w-20"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="mobilePhone">Celular</Label>
        <div className="flex space-x-2">
        <Select value={mobilePhoneCc} onValueChange={setMobilePhoneCc}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Código" />
            </SelectTrigger>
            <SelectContent>
              {countryCodes.map((country) => (
                <SelectItem key={country.value} value={country.code}>
                  {country.code} ({country.label})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id="mobilePhone"
            type="tel"
            value={mobilePhone}
            onChange={(e) => setMobilePhone(e.target.value)}
            placeholder="Número"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="startDate">Fecha de ingreso</Label>
        <Input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="endDate">Fecha de baja</Label>
        <Input
          id="endDate"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <Button type="submit">{executiveId ? 'Actualizar' : 'Crear'} Usuario</Button>
    </form>
  )
}