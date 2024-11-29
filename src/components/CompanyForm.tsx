import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

type CompanyFormProps = {
  companyId?: number
}

type LocationOptions = {
  [country: string]: {
    [department: string]: string[]
  }
}

const locationOptions: LocationOptions = {
  'Peru': {
    'Lima': ['San Isidro', 'Miraflores']
  },
  'Chile': {
    'Santiago de Chile': ['Santiago de Chile']
  },
  'Colombia': {
    'Bogotá': ['Bogotá']
  }
}

const industryOptions = ['Banca', 'Seguros', 'Retail', 'Pesca', 'Minería']

const membershipTypes = [
  'SAE Ejecutivo',
  'SAE Reuniones',
  'SAE Virtual',
  'SAE Básico',
  'SAE Completo',
  'SAE Especial',
]

const statusOptions = ['Cliente SAE', 'Ex-cliente SAE', 'No cliente SAE']

const paymentFrequencies = ['Mensual', 'Semestral', 'Anual']

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
  const [country, setCountry] = useState('')
  const [department, setDepartment] = useState('')
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [ccphoneNumber, setccPhoneNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [industry, setIndustry] = useState('')
  const [membershipType, setMembershipType] = useState('')
  const [status, setStatus] = useState('')
  const [membershipExpireDate, setMembershipExpireDate] = useState('')
  const [enrollmentDate, setEnrollmentDate] = useState('')
  const [seats, setSeats] = useState('0')
  const [extraSeats, setExtraSeats] = useState('0')
  const [panoramaEconomicoPolitico, setPanoramaEconomicoPolitico] = useState(false)
  const [informeSAE, setInformeSAE] = useState(false)
  const [saeMercados, setSaeMercados] = useState(false)
  const [meetingsAmount, setMeetingsAmount] = useState('0')
  const [queryAccess, setQueryAccess] = useState(false)
  const [ocNeeded, setOcNeeded] = useState(false)
  const [billCurrency, setBillCurrency] = useState('PEN')
  const [billAmount, setBillAmount] = useState('')
  const [paymentFrequency, setPaymentFrequency] = useState('')
  const [notes, setNotes] = useState('')
  const [virtualMember, setVirtualMember] = useState('0')

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
      setCountry(data.country)
      setDepartment(data.department)
      setDistrict(data.district)
      setAddress(data.address)
      setPhoneNumber(data.phone_number)
      setIndustry(data.industry)
      setMembershipType(data.membership_type)
      setStatus(data.status)
      setMembershipExpireDate(data.membership_expire_date)
      setEnrollmentDate(data.enrollment_date)
      setSeats(data.seats.toString())
      setExtraSeats(data.extra_seats.toString())
      setPanoramaEconomicoPolitico(data.panorama_economico_politico)
      setInformeSAE(data.informe_sae)
      setSaeMercados(data.sae_mercados)
      setMeetingsAmount(data.meetings_amount.toString())
      setQueryAccess(data.query_access)
      setOcNeeded(data.oc_needed)
      setBillCurrency(data.bill_currency)
      setBillAmount(data.bill_amount.toString())
      setPaymentFrequency(data.payment_frecuency)
      setNotes(data.notes)
      setVirtualMember(data.virtual_member)
    }
  }, [companyId])

  useEffect(() => {
    if (companyId) {
      fetchCompany()
    }
  }, [companyId, fetchCompany])

  const handleCountryChange = (selectedCountry: string) => {
    setCountry(selectedCountry)
    setDepartment('')
    setDistrict('')
  }

  const handleDepartmentChange = (selectedDepartment: string) => {
    setDepartment(selectedDepartment)
    setDistrict('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const company = {
      ruc,
      razon_social: razonSocial,
      nombre_comercial: nombreComercial,
      country,
      department,
      district,
      address,
      phone_number: phoneNumber,
      industry,
      membership_type: membershipType,
      status,
      membership_expire_date: membershipExpireDate,
      enrollment_date: enrollmentDate,
      seats: parseInt(seats),
      extra_seats: parseInt(extraSeats),
      panorama_economico_politico: panoramaEconomicoPolitico,
      informe_sae: informeSAE,
      sae_mercados: saeMercados,
      meetings_amount: parseInt(meetingsAmount),
      query_access: queryAccess,
      oc_needed: ocNeeded,
      bill_currency: billCurrency,
      bill_amount: parseFloat(billAmount),
      payment_frecuency: paymentFrequency,
      notes,
      virtual_member: virtualMember
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
          maxLength={11}
          onChange={(e) => setRuc(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="razonSocial">Razón Social</Label>
        <Input
          id="razonSocial"
          type="text"
          value={razonSocial}
          onChange={(e) => setRazonSocial(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="nombreComercial">Nombre Comercial</Label>
        <Input
          id="nombreComercial"
          type="text"
          value={nombreComercial}
          onChange={(e) => setNombreComercial(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="country">País</Label>
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el país" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(locationOptions).map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {country && (
        <div>
          <Label htmlFor="department">Departamento</Label>
          <Select value={department} onValueChange={handleDepartmentChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el departamento" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(locationOptions[country]).map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {department && (
        <div>
          <Label htmlFor="district">Distrito</Label>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el distrito" />
            </SelectTrigger>
            <SelectContent>
              {locationOptions[country][department].map((dist) => (
                <SelectItem key={dist} value={dist}>
                  {dist}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="phoneNumber">Teléfono</Label>
        <div className="flex space-x-2">
        <Select value={ccphoneNumber} onValueChange={setccPhoneNumber}>
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
          required
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
        <Label htmlFor="membershipType">Tipo de Membresía</Label>
        <Select value={membershipType} onValueChange={setMembershipType}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el tipo de membresía" />
          </SelectTrigger>
          <SelectContent>
            {membershipTypes.map((type, index) => (
              <SelectItem key={index} value={type}>
                {type}
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
        <Label htmlFor="membershipExpireDate">Fecha de Término de la Membresía</Label>
        <Input
          id="membershipExpireDate"
          type="date"
          value={membershipExpireDate}
          onChange={(e) => setMembershipExpireDate(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="enrollmentDate">Fecha de Ingreso de la Empresa</Label>
        <Input
          id="enrollmentDate"
          type="date"
          value={enrollmentDate}
          onChange={(e) => setEnrollmentDate(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="seats">Cantidad de Titulares</Label>
        <Select value={seats} onValueChange={setSeats}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona la cantidad de titulares" />
          </SelectTrigger>
          <SelectContent>
            {[...Array(21)].map((_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="extraSeats">Cupos Adicionales</Label>
        <Select value={extraSeats} onValueChange={setExtraSeats}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona los cupos adicionales" />
          </SelectTrigger>
          <SelectContent>
            {[...Array(21)].map((_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
      <Label htmlFor="virtualMember">Titular Virtual</Label>
        <Select value={virtualMember} onValueChange={setVirtualMember}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona los cupos adicionales" />
          </SelectTrigger>
          <SelectContent>
            {[...Array(21)].map((_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="panoramaEconomicoPolitico"
          checked={panoramaEconomicoPolitico}
          onCheckedChange={(checked) => setPanoramaEconomicoPolitico(checked as boolean)}
        />
        <Label htmlFor="panoramaEconomicoPolitico">Panorama Económico y Político</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="informeSAE"
          checked={informeSAE}
          onCheckedChange={(checked) => setInformeSAE(checked as boolean)}
        />
        <Label htmlFor="informeSAE">Informe SAE</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="saeMercados"
          checked={saeMercados}
          onCheckedChange={(checked) => setSaeMercados(checked as boolean)}
        />
        <Label htmlFor="saeMercados">SAE Mercados</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="queryAccess"
          checked={queryAccess}
          onCheckedChange={(checked) => setQueryAccess(checked as boolean)}
        />
        <Label htmlFor="queryAccess">Acceso a Consultas</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="ocNeeded"
          checked={ocNeeded}
          onCheckedChange={(checked) => setOcNeeded(checked as boolean)}
        />
        <Label htmlFor="ocNeeded">Necesita O/C</Label>
      </div>
      <div>
        <Label htmlFor="meetingsAmount">Cantidad de Reuniones</Label>
        <Input
          id="meetingsAmount"
          type="number"
          min="0"
          value={meetingsAmount}
          onChange={(e) => setMeetingsAmount(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="billCurrency">Moneda de Facturación</Label>
        <Select value={billCurrency} onValueChange={setBillCurrency}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona la moneda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PEN">PEN</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="billAmount">Monto de Facturación</Label>
        <Input
          id="billAmount"
          type="number"
          step="0.01"
          min="0"
          value={billAmount}
          onChange={(e) => setBillAmount(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="paymentFrequency">Forma de Pago</Label>
        <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona la forma de pago" />
          </SelectTrigger>
          <SelectContent>
            {paymentFrequencies.map((frequency, index) => (
              <SelectItem key={index} value={frequency}>
                {frequency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button type="submit">{companyId ? 'Actualizar' : 'Crear'} Empresa</Button>
    </form>
  )
}