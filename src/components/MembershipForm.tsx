'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { SearchableSelect } from './SearchableSelect'
import { Textarea } from "@/components/ui/textarea"
import { MembershipTypeSelector } from './MembershipTypeSelector'

type MembershipFormProps = {
  membershipId?: number
}

type Company = {
  id: number
  razon_social: string
}


const paymentMethods = [
  "Mensual",
  "Trimestral",
  "Semestral",
  "Anual",
  "Contrato abierto",
]

export function MembershipForm({ membershipId }: MembershipFormProps) {
  const [name, setName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [membershipType, setMembershipType] = useState('')
  const [areaScope, setAreaScope] = useState(false)
  const [area, setArea] = useState('')
  const [titulares, setTitulares] = useState('0')
  const [cuposAdicionales, setCuposAdicionales] = useState('0')
  const [titularAdicional, setTitularAdicional] = useState('0')
  const [cuposForos, setCuposForos] = useState('0')
  const [panoramaEconomico, setPanoramaEconomico] = useState(false)
  const [panoramaPolitico, setPanoramaPolitico] = useState(false)
  const [informeSae, setInformeSae] = useState(false)
  const [saeMercados, setSaeMercados] = useState(false)
  const [cantidadReuniones, setCantidadReuniones] = useState('0')
  const [dailyNote, setDailyNote] = useState(false)
  const [appSae, setAppSae] = useState(false)
  const [webSae, setWebSae] = useState(false)
  const [forumConsumerFirstSemester, setForumConsumerFirstSemester] = useState(false)
  const [forumConsumerSecondSemester, setForumConsumerSecondSemester] = useState(false)
  const [forumSectorialFirstSemester, setForumSectorialFirstSemester] = useState(false)
  const [forumSectorialSecondSemester, setForumSectorialSecondSemester] = useState(false)
  const [titularVirtual, setTitularVirtual] = useState('0')
  const [cantidadPresentaciones, setCantidadPresentaciones] = useState('0')
  const [consultasAcceso, setConsultasAcceso] = useState(false)
  const [fechaRenovacion, setFechaRenovacion] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentCurrency, setPaymentCurrency] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [ocNeeded, setOcNeeded] = useState(false)
  const [signedProposal, setSignedProposal] = useState(false)
  const [invoiceSent, setInvoiceSent] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signerPhone, setSignerPhone] = useState('')
  const [comments, setComments] = useState('')
  const [initialCompany, setInitialCompany] = useState<Company | undefined>(undefined)

  const router = useRouter()

  useEffect(() => {
    if (membershipId) {
      fetchMembership()
    }
  }, [membershipId])

  async function fetchMembership() {
    if (!membershipId) return
    const { data, error } = await supabase
      .from('membership')
      .select('*, company:company_id(id, razon_social)')
      .eq('id', membershipId)
      .single()

    if (error) {
      console.error('Error fetching membership:', error)
    } else if (data) {
      setInitialCompany(data.company)
      setName(data.name)
      setCompanyId(data.company_id.toString())
      setMembershipType(data.membership_type)
      setAreaScope(data.area_scope)
      setArea(data.area)
      setTitulares(data.titulares.toString())
      setCuposAdicionales(data.cupos_adicionales.toString())
      setTitularAdicional(data.titular_adicional.toString())
      setCuposForos(data.cupos_foros.toString())
      setPanoramaEconomico(data.panorama_economico)
      setPanoramaPolitico(data.panorama_politico)
      setInformeSae(data.informe_sae)
      setSaeMercados(data.sae_mercados)
      setCantidadReuniones(data.cantidad_reuniones.toString())
      setDailyNote(data.daily_note)
      setAppSae(data.app_sae)
      setWebSae(data.web_sae)
      setForumConsumerFirstSemester(data.forum_consumer_first_semester)
      setForumConsumerSecondSemester(data.forum_consumer_second_semester)
      setForumSectorialFirstSemester(data.forum_sectorial_first_semester)
      setForumSectorialSecondSemester(data.forum_sectorial_second_semester)
      setTitularVirtual(data.titular_virtual.toString())
      setCantidadPresentaciones(data.cantidad_presentaciones.toString())
      setConsultasAcceso(data.consultas_acceso)
      setFechaRenovacion(data.fecha_renovacion)
      setPaymentMethod(data.payment_method)
      setPaymentCurrency(data.payment_currency)
      setPaymentAmount(data.payment_amount.toString())
      setOcNeeded(data.oc_needed)
      setSignedProposal(data.signed_proposal)
      setInvoiceSent(data.invoice_sent)
      setSignerName(data.signer_name)
      setSignerEmail(data.signer_email)
      setSignerPhone(data.signer_phone)
      setComments(data.comments)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const membership = {
      name,
      company_id: parseInt(companyId),
      membership_type: membershipType,
      area_scope: areaScope,
      area: area,
      titulares: parseInt(titulares),
      cupos_adicionales: parseInt(cuposAdicionales),
      titular_adicional: parseInt(titularAdicional),
      cupos_foros: parseInt(cuposForos),
      panorama_economico: panoramaEconomico,
      panorama_politico: panoramaPolitico,
      informe_sae: informeSae,
      sae_mercados: saeMercados,
      cantidad_reuniones: parseInt(cantidadReuniones),
      daily_note: dailyNote,
      app_sae: appSae,
      web_sae: webSae,
      forum_consumer_first_semester: forumConsumerFirstSemester,
      forum_consumer_second_semester: forumConsumerSecondSemester,
      forum_sectorial_first_semester: forumSectorialFirstSemester,
      forum_sectorial_second_semester: forumSectorialSecondSemester,
      titular_virtual: parseInt(titularVirtual),
      cantidad_presentaciones: parseInt(cantidadPresentaciones),
      consultas_acceso: consultasAcceso,
      fecha_renovacion: fechaRenovacion,
      payment_method: paymentMethod,
      payment_currency: paymentCurrency,
      payment_amount: parseFloat(paymentAmount),
      oc_needed: ocNeeded,
      signed_proposal: signedProposal,
      invoice_sent: invoiceSent,
      signer_name: signerName,
      signer_email: signerEmail,
      signer_phone: signerPhone,
      comments
    }

    if (membershipId) {
      const { error } = await supabase
        .from('membership')
        .update(membership)
        .eq('id', membershipId)

      if (error) console.error('Error updating membership:', error)
      else router.push('/membresias')
    } else {
      const { error } = await supabase
        .from('membership')
        .insert([membership])

      if (error) console.error('Error creating membership:', error)
      else router.push('/membresias')
    }
  }

  const handleCompanyChange = (value: string) => {
    setCompanyId(value)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre de la membresía</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          //required
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
        <MembershipTypeSelector value={membershipType} onValueChange={setMembershipType} />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="areaScope"
          checked={areaScope}
          onCheckedChange={(checked) => setAreaScope(checked as boolean)}
        />
        <Label htmlFor="areaScope">Membresía por área</Label>
      </div>

      {areaScope && (
        <div>
          <Label htmlFor="area">Área</Label>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Finanzas">Finanzas</SelectItem>
              <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Operaciones">Operaciones</SelectItem>
              <SelectItem value="Tecnología">Tecnología</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="titulares">Cantidad de titulares</Label>
        <Select value={titulares} onValueChange={setTitulares}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona la cantidad" />
          </SelectTrigger>
          <SelectContent>
            {[...Array(21)].map((_, i) => (
              <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="cuposAdicionales">Cupos adicionales</Label>
        <Select value={cuposAdicionales} onValueChange={setCuposAdicionales}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona la cantidad" />
          </SelectTrigger>
          <SelectContent>
            {[...Array(21)].map((_, i) => (
              <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="titularAdicional">Titular adicional (contrato distinto)</Label>
        <Select value={titularAdicional} onValueChange={setTitularAdicional}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona la cantidad" />
          </SelectTrigger>
          <SelectContent>
            {[...Array(21)].map((_, i) => (
              <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="cuposForos">Cupos foros</Label>
        <Select value={cuposForos} onValueChange={setCuposForos}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona la cantidad" />
          </SelectTrigger>
          <SelectContent>
            {[...Array(21)].map((_, i) => (
              <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="panoramaEconomico"
          checked={panoramaEconomico}
          onCheckedChange={(checked) => setPanoramaEconomico(checked as boolean)}
        />
        <Label htmlFor="panoramaEconomico">Panorama económico</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="panoramaPolitico"
          checked={panoramaPolitico}
          onCheckedChange={(checked) => setPanoramaPolitico(checked as boolean)}
        />
        <Label htmlFor="panoramaPolitico">Panorama político</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="informeSae"
          checked={informeSae}
          onCheckedChange={(checked) => setInformeSae(checked as boolean)}
        />
        <Label htmlFor="informeSae">Informe SAE</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="saeMercados"
          checked={saeMercados}
          onCheckedChange={(checked) => setSaeMercados(checked as boolean)}
        />
        <Label htmlFor="saeMercados">SAE Mercados</Label>
      </div>

      <div>
        <Label htmlFor="cantidadReuniones">Cantidad de reuniones</Label>
        <Input
          id="cantidadReuniones"
          type="number"
          value={cantidadReuniones}
          onChange={(e) => setCantidadReuniones(e.target.value)}
          //required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="dailyNote"
          checked={dailyNote}
          onCheckedChange={(checked) => setDailyNote(checked as boolean)}
        />
        <Label htmlFor="dailyNote">Daily note</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="appSae"
          checked={appSae}
          onCheckedChange={(checked) => setAppSae(checked as boolean)}
        />
        <Label htmlFor="appSae">App SAE</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="webSae"
          checked={webSae}
          onCheckedChange={(checked) => setWebSae(checked as boolean)}
        />
        <Label htmlFor="webSae">Web SAE</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="forumConsumerFirstSemester"
          checked={forumConsumerFirstSemester}
          onCheckedChange={(checked) => setForumConsumerFirstSemester(checked as boolean)}
        />
        <Label htmlFor="forumConsumerFirstSemester">Foro Consumidor 1er semestre</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="forumConsumerSecondSemester"
          checked={forumConsumerSecondSemester}
          onCheckedChange={(checked) => setForumConsumerSecondSemester(checked as boolean)}
        />
        <Label htmlFor="forumConsumerSecondSemester">Foro Consumidor 2do semestre</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="forumSectorialFirstSemester"
          checked={forumSectorialFirstSemester}
          onCheckedChange={(checked) => setForumSectorialFirstSemester(checked as boolean)}
        />
        <Label htmlFor="forumSectorialFirstSemester">Foro Sectorial 1er semestre</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="forumSectorialSecondSemester"
          checked={forumSectorialSecondSemester}
          onCheckedChange={(checked) => setForumSectorialSecondSemester(checked as boolean)}
        />
        <Label htmlFor="forumSectorialSecondSemester">Foro Sectorial 2do semestre</Label>
      </div>

      <div>
        <Label htmlFor="titularVirtual">Titular virtual</Label>
        <Input
          id="titularVirtual"
          type="number"
          value={titularVirtual}
          onChange={(e) => setTitularVirtual(e.target.value)}
          //required
        />
      </div>

      <div>
        <Label htmlFor="cantidadPresentaciones">Cantidad de presentaciones</Label>
        <Input
          id="cantidadPresentaciones"
          type="number"
          value={cantidadPresentaciones}
          onChange={(e) => setCantidadPresentaciones(e.target.value)}
          //required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="consultasAcceso"
          checked={consultasAcceso}
          onCheckedChange={(checked) => setConsultasAcceso(checked as boolean)}
        />
        <Label htmlFor="consultasAcceso">Acceso a consultas</Label>
      </div>

      <div>
        <Label htmlFor="fechaRenovacion">Fecha de renovación</Label>
        <Input
          id="fechaRenovacion"
          type="date"
          value={fechaRenovacion}
          onChange={(e) => setFechaRenovacion(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="paymentMethod">Forma de pago</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona la forma de pago" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem key={method} value={method}>{method}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex space-x-4">
        <div className="w-1/2">
          <Label htmlFor="paymentCurrency">Moneda de pago</Label>
          <Select value={paymentCurrency} onValueChange={setPaymentCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona la moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="PEN">PEN</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-1/2">
          <Label htmlFor="paymentAmount">Tarifa</Label>
          <Input
            id="paymentAmount"
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            //required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="ocNeeded"
          checked={ocNeeded}
          onCheckedChange={(checked) => setOcNeeded(checked as boolean)}
        />
        <Label htmlFor="ocNeeded">Necesita O/C</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="signedProposal"
          checked={signedProposal}
          onCheckedChange={(checked) => setSignedProposal(checked as boolean)}
        />
        <Label htmlFor="signedProposal">Propuesta firmada</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="invoiceSent"
          checked={invoiceSent}
          onCheckedChange={(checked) => setInvoiceSent(checked as boolean)}
        />
        <Label htmlFor="invoiceSent">Factura enviada</Label>
      </div>

      <div>
        <Label htmlFor="signerName">Nombre completo de la persona que firma el contrato</Label>
        <Input
          id="signerName"
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          //required
        />
      </div>

      <div>
        <Label htmlFor="signerEmail">Correo electrónico de la persona que firma el contrato</Label>
        <Input
          id="signerEmail"
          type="email"
          value={signerEmail}
          onChange={(e) => setSignerEmail(e.target.value)}
          //required
        />
      </div>

      <div>
        <Label htmlFor="signerPhone">Celular de la persona que firma el contrato</Label>
        <Input
          id="signerPhone"
          value={signerPhone}
          onChange={(e) => setSignerPhone(e.target.value)}
          //required
        />
      </div>

      <div>
        <Label htmlFor="comments">Comentarios</Label>
        <Textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>

      <Button type="submit">{membershipId ? 'Actualizar' : 'Agregar Nueva Membresía'}</Button>
    </form>
  )
}