'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type CompanyFormProps = {
  companyId?: number
}

const industryOptions = ['Banca', 'Seguros', 'Retail', 'Pesca', 'Minería']

const statusOptions = ['Cliente SAE', 'Ex-cliente SAE', 'No cliente SAE']

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

export function CompanyForm({ companyId }: CompanyFormProps) {
  const [ruc, setRuc] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [nombreComercial, setNombreComercial] = useState('')
  const [seats, setSeats] = useState('0')
  const [country, setCountry] = useState('')
  const [department, setDepartment] = useState('')
  const [address, setAddress] = useState('')
  const [ccPhoneNumber, setCcPhoneNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [industry, setIndustry] = useState('')
  const [status, setStatus] = useState('')
  const [enrollmentDate, setEnrollmentDate] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [headcount, setHeadcount] = useState('0')
  const [sales, setSales] = useState('0')

  const router = useRouter()

  const fetchCompany = useCallback(async () => {
    if (!companyId) return
    const { data, error } = await supabase
      .from('company')
      .select('*')
      .eq('id', companyId)
      .single()

    if (error) {
      console.error('Error fetching company:', error)
    } else if (data) {
      setRuc(data.ruc)
      setRazonSocial(data.razon_social)
      setNombreComercial(data.nombre_comercial)
      setSeats(data.seats.toString())
      setCountry(data.country)
      setDepartment(data.department)
      setAddress(data.address)
      setPhoneNumber(data.phone_number)
      setIndustry(data.industry)
      setStatus(data.status)
      setEnrollmentDate(data.enrollment_date)
      setNotes(data.notes)
      setHeadcount(data.headcount.toString())
      setSales(data.sales.toString())
    }
  }, [companyId])

  useEffect(() => {
    if (companyId) {
      fetchCompany()
    }
  }, [companyId, fetchCompany])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const company = {
      ruc,
      razon_social: razonSocial,
      nombre_comercial: nombreComercial,
      seats: parseInt(seats),
      country,
      department,
      address,
      phone_number: `${ccPhoneNumber} ${phoneNumber}`,
      industry,
      status,
      enrollment_date: enrollmentDate || null,
      notes,
      headcount: parseInt(headcount),
      sales: parseFloat(sales)
    }

    if (companyId) {
      const { error } = await supabase
        .from('company')
        .update(company)
        .eq('id', companyId)

      if (error) console.error('Error updating company:', error)
      else router.push('/empresas')
    } else {
      const { error } = await supabase
        .from('company')
        .insert([company])

      if (error) console.error('Error creating company:', error)
      else router.push('/empresas')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="ruc">RUC</Label>
        <Input
          id="ruc"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={ruc}
          onChange={(e) => setRuc(e.target.value)}
          //required
        />
      </div>
      <div>
        <Label htmlFor="razonSocial">Razón social</Label>
        <Input
          id="razonSocial"
          type="text"
          value={razonSocial}
          onChange={(e) => setRazonSocial(e.target.value)}
          //required
        />
      </div>
      <div>
        <Label htmlFor="nombreComercial">Nombre comercial</Label>
        <Input
          id="nombreComercial"
          type="text"
          value={nombreComercial}
          onChange={(e) => setNombreComercial(e.target.value)}
          //required
        />
      </div>
      <div>
        <Label htmlFor="seats">Cantidad de titulares</Label>
        <Input
          id="seats"
          type="number"
          min="0"
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
          //required
        />
      </div>
      <div>
        <Label htmlFor="country">País</Label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el país" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.value} value={country.value}>
                {country.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="department">Departamento</Label>
        <Input
          id="department"
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          //required
        />
      </div>
      <div>
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          //required
        />
      </div>
      <div>
        <Label htmlFor="phoneNumber">Teléfono</Label>
        <div className="flex space-x-2">
          <Select value={ccPhoneNumber} onValueChange={setCcPhoneNumber}>
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
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            //required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="industry">Sector</Label>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el sector" />
          </SelectTrigger>
          <SelectContent>
            {industryOptions.map((option, index) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option, index) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="enrollmentDate">Fecha de ingreso de la empresa</Label>
        <Input
          id="enrollmentDate"
          type="date"
          value={enrollmentDate || ''}
          onChange={(e) => setEnrollmentDate(e.target.value || null)} 
          //required
        />
      </div>
      <div>
        <Label htmlFor="headcount">Número de trabajadores</Label>
        <Input
          id="headcount"
          type="number"
          min="0"
          value={headcount}
          onChange={(e) => setHeadcount(e.target.value)}
          //required
        />
      </div>
      <div>
        <Label htmlFor="sales">Ventas</Label>
        <Input
          id="sales"
          type="number"
          step="0.01"
          min="0"
          value={sales}
          onChange={(e) => setSales(e.target.value)}
          //required
        />
      </div>
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button type="submit">{companyId ? 'Actualizar' : 'Agregar Nueva Empresa'}</Button>
    </form>
  )
}