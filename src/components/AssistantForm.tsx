"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from './SearchableSelect'

type AssistantFormProps = {
  assistantId?: number
}

type Company = {
  id: number
  razon_social: string
}

interface CountryOption {
  value: string
  label: string
  code: string
}

const countries: CountryOption[] = [
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

export function AssistantForm({ assistantId }: AssistantFormProps) {
  const [dni, setDni] = useState('')
  const [name, setName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [ccOfficePhone, setCcOfficePhone] = useState('')
  const [officePhone, setOfficePhone] = useState('')
  const [officePhoneExtension, setOfficePhoneExtension] = useState('')
  const [ccMobilePhone, setCcMobilePhone] = useState('')
  const [mobilePhone, setMobilePhone] = useState('')
  const [initialCompany, setInitialCompany] = useState<Company | undefined>(undefined)

  const router = useRouter()

  const fetchAssistant = useCallback(async () => {
    if (!assistantId) return
    const { data, error } = await supabase
      .from('assistant')
      .select('*, company:company_id(id, razon_social)')
      .eq('id', assistantId)
      .single()

    if (error) {
      console.error('Error fetching assistant:', error)
    } else if (data) {
      setDni(data.dni)
      setName(data.name)
      setLastName(data.last_name)
      setEmail(data.email)
      setCompanyId(data.company_id.toString())
      setInitialCompany(data.company)
      setCcOfficePhone(data.cc_office_phone)
      setOfficePhone(data.office_phone)
      setOfficePhoneExtension(data.office_phone_extension)
      setCcMobilePhone(data.cc_mobile_phone)
      setMobilePhone(data.mobile_phone)
    }
  }, [assistantId])

  useEffect(() => {
    if (assistantId) {
      fetchAssistant()
    }
  }, [assistantId, fetchAssistant])

  const handleCompanyChange = (value: string) => {
    setCompanyId(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const assistant = {
      dni,
      name,
      last_name: lastName,
      email,
      company_id: parseInt(companyId),
      cc_office_phone: ccOfficePhone,
      office_phone: officePhone,
      office_phone_extension: officePhoneExtension,
      cc_mobile_phone: ccMobilePhone,
      mobile_phone: mobilePhone
    }

    if (assistantId) {
      const { error } = await supabase
        .from('assistant')
        .update(assistant)
        .eq('id', assistantId)

      if (error) console.error('Error updating assistant:', error)
      else router.push('/secretarias')
    } else {
      const { error } = await supabase
        .from('assistant')
        .insert([assistant])

      if (error) console.error('Error creating assistant:', error)
      else router.push('/secretarias')
    }
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
        <Label htmlFor="companyId">Empresa</Label>
        <SearchableSelect
          onSelect={handleCompanyChange}
          placeholder="Selecciona una empresa"
          label="empresa"
          initialValue={initialCompany}
        />
      </div>
      <div>
        <Label htmlFor="officePhone">Teléfono de oficina</Label>
        <div className="flex space-x-2">
          <Select value={ccOfficePhone} onValueChange={setCcOfficePhone}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Código" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
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
          <Select value={ccMobilePhone} onValueChange={setCcMobilePhone}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Código" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
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
      <Button type="submit">{assistantId ? 'Actualizar' : 'Crear'} Secretaria</Button>
    </form>
  )
}