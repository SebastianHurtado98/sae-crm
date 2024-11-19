import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

type PresentationFormProps = {
  presentationId?: number
}

type Company = {
  id: number
  razon_social: string
}

type Executive = {
  id: number
  name: string
  last_name: string
  company_id: number
}

const orderSources = ["Comercial", "Secretaria de un usuario", "Usuario", "Trabajador SAE"]
const presentationTypes = ["Presentación cortesía", "Presentación adicional con costo", "Presentación de la membresía"]
const modalities = ["Presencial", "Virtual", "Sólo envio"]

// Simulated list of SAE names
const saeNames = [
  "Juan Pérez", "María García", "Carlos Rodríguez", "Ana Martínez", "Luis López",
  "Laura Sánchez", "Diego Fernández", "Sofía Torres", "Andrés Ramírez", "Valentina Herrera"
]

export function PresentationForm({ presentationId }: PresentationFormProps) {
  const [companyId, setCompanyId] = useState('')
  const [executiveId, setExecutiveId] = useState('')
  const [elaborationAssignee, setElaborationAssignee] = useState<string[]>([])
  const [presentationAssignee, setPresentationAssignee] = useState<string[]>([])
  const [orderSource, setOrderSource] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [presentationDateHour, setPresentationDateHour] = useState('')
  const [presentationType, setPresentationType] = useState('')
  const [modalidad, setModalidad] = useState('')
  const [comments, setComments] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [executives, setExecutives] = useState<Executive[]>([])
  const router = useRouter()

  const fetchCompanies = useCallback(async () => {
    const { data, error } = await supabase
      .from('company')
      .select('id, razon_social')

    if (error) {
      console.error('Error fetching companies:', error)
    } else {
      setCompanies(data || [])
    }
  }, [])

  const fetchExecutives = useCallback(async (companyId: number) => {
    const { data, error } = await supabase
      .from('executive')
      .select('id, name, last_name, company_id')
      .eq('company_id', companyId)

    if (error) {
      console.error('Error fetching executives:', error)
    } else {
      setExecutives(data || [])
    }
  }, [])

  const fetchPresentation = useCallback(async () => {
    if (!presentationId) return
    const { data, error } = await supabase
      .from('presentation')
      .select('*')
      .eq('id', presentationId)
      .single()

    if (error) {
      console.error('Error fetching presentation:', error)
    } else if (data) {
      setCompanyId(data.company_id.toString())
      await fetchExecutives(data.company_id)
      setExecutiveId(data.executive_id.toString())
      setElaborationAssignee(data.elaboration_assignee)
      setPresentationAssignee(data.presentation_assignee)
      setOrderSource(data.order_source)
      setOrderDate(data.order_date)
      setPresentationDateHour(data.presentation_date_hour)
      setPresentationType(data.presentation_type)
      setModalidad(data.modalidad)
      setComments(data.comments)
    }
  }, [presentationId, fetchExecutives])

  useEffect(() => {
    fetchCompanies()
    if (presentationId) {
      fetchPresentation()
    }
  }, [presentationId, fetchCompanies, fetchPresentation])

  useEffect(() => {
    if (companyId && !presentationId) {
      fetchExecutives(parseInt(companyId))
    }
  }, [companyId, fetchExecutives, presentationId])

  const handleElaborationAssigneeChange = (name: string) => {
    setElaborationAssignee(prev =>
      prev.includes(name)
        ? prev.filter(a => a !== name)
        : [...prev, name]
    )
  }

  const handlePresentationAssigneeChange = (name: string) => {
    setPresentationAssignee(prev =>
      prev.includes(name)
        ? prev.filter(a => a !== name)
        : [...prev, name]
    )
  }

  const handleCompanyChange = (value: string) => {
    setCompanyId(value)
    setExecutiveId('')
    fetchExecutives(parseInt(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const presentation = {
      company_id: parseInt(companyId),
      executive_id: parseInt(executiveId),
      elaboration_assignee: elaborationAssignee,
      presentation_assignee: presentationAssignee,
      order_source: orderSource,
      order_date: orderDate,
      presentation_date_hour: presentationDateHour,
      presentation_type: presentationType,
      modalidad: modalidad,
      comments: comments
    }

    if (presentationId) {
      const { error } = await supabase
        .from('presentation')
        .update(presentation)
        .eq('id', presentationId)

      if (error) console.error('Error updating presentation:', error)
      else router.push('/presentaciones')
    } else {
      const { error } = await supabase
        .from('presentation')
        .insert([presentation])

      if (error) console.error('Error creating presentation:', error)
      else router.push('/presentaciones')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="companyId">Empresa</Label>
        <Select value={companyId} onValueChange={handleCompanyChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una empresa" />
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
      <div>
        <Label htmlFor="executiveId">Solicitante</Label>
        <Select value={executiveId} onValueChange={setExecutiveId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un solicitante" />
          </SelectTrigger>
          <SelectContent>
            {executives.map((executive) => (
              <SelectItem key={executive.id} value={executive.id.toString()}>
                {`${executive.name} ${executive.last_name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Responsable(s) de la elaboración</Label>
        <div className="grid grid-cols-2 gap-2">
          {saeNames.map((name) => (
            <div key={name} className="flex items-center space-x-2">
              <Checkbox
                id={`elaboration-${name}`}
                checked={elaborationAssignee.includes(name)}
                onCheckedChange={() => handleElaborationAssigneeChange(name)}
              />
              <Label htmlFor={`elaboration-${name}`}>{name}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>Expositor(es)</Label>
        <div className="grid grid-cols-2 gap-2">
          {saeNames.map((name) => (
            <div key={name} className="flex items-center space-x-2">
              <Checkbox
                id={`presentation-${name}`}
                checked={presentationAssignee.includes(name)}
                onCheckedChange={() => handlePresentationAssigneeChange(name)}
              />
              <Label htmlFor={`presentation-${name}`}>{name}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="orderSource">Origen de solicitud</Label>
        <Select value={orderSource} onValueChange={setOrderSource}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el origen de solicitud" />
          </SelectTrigger>
          <SelectContent>
            {orderSources.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="orderDate">Fecha de ingreso</Label>
        <Input
          id="orderDate"
          type="date"
          value={orderDate}
          onChange={(e) => setOrderDate(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="presentationDateHour">Fecha y hora de presentación</Label>
        <Input
          id="presentationDateHour"
          type="datetime-local"
          value={presentationDateHour}
          onChange={(e) => setPresentationDateHour(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="presentationType">Tipo de presentación</Label>
        <Select value={presentationType} onValueChange={setPresentationType}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el tipo de presentación" />
          </SelectTrigger>
          <SelectContent>
            {presentationTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="modalidad">Modalidad</Label>
        <Select value={modalidad} onValueChange={setModalidad}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona la modalidad" />
          </SelectTrigger>
          <SelectContent>
            {modalities.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {mode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="comments">Comentarios</Label>
        <Textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
        />
      </div>
      <Button type="submit">{presentationId ? 'Actualizar' : 'Crear'} Presentación</Button>
    </form>
  )
}