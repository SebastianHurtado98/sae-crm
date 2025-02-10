export type Membership = {
    id: number
    name: string
    company: {
        razon_social: string
    }
    membership_type: string
    area: string
    titulares: number
    cupos_adicionales: number
    titular_adicional: number
    cupos_foros: number
    panorama_economico: boolean
    panorama_politico: boolean
    informe_sae: boolean
    sae_mercados: boolean
    cantidad_reuniones: number
    daily_note: boolean
    app_sae: boolean
    web_sae: boolean
    titular_virtual: number
    cantidad_presentaciones: number
    consultas_acceso: boolean
    fecha_renovacion: string
    payment_method: string
    payment_currency: string
    payment_amount: number
    oc_needed: boolean
    signed_proposal: boolean
    invoice_sent: boolean
    area_scope: boolean
}

export type MembershipDetail = {
    id: number
    name: string
    company: {
        razon_social: string
    }
    membership_type: string
    area: string
    titulares: number
    cupos_adicionales: number
    titular_adicional: number
    cupos_foros: number
    panorama_economico: boolean
    panorama_politico: boolean
    informe_sae: boolean
    sae_mercados: boolean
    cantidad_reuniones: number
    daily_note: boolean
    app_sae: boolean
    web_sae: boolean
    forum_consumer_first_semester: boolean
    forum_consumer_second_semester: boolean
    forum_sectorial_first_semester: boolean
    forum_sectorial_second_semester: boolean
    titular_virtual: number
    cantidad_presentaciones: number
    consultas_acceso: boolean
    fecha_renovacion: string
    payment_method: string
    payment_currency: string
    payment_amount: number
    oc_needed: boolean
    signed_proposal: boolean
    invoice_sent: boolean
    signer_name: string
    signer_email: string
    signer_phone: string
    comments: string
    area_scope: boolean
}