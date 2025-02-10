export type Executive = {
    id: number
    dni: string
    name: string
    last_name: string
    assistant_id: number
    company_id: number
    tareco: string
    birth_date: string
    country: string
    email: string
    position: string
    area: string
    user_type: string
    active: boolean
    office_phone_cc: string
    office_phone: string
    office_phone_extension: string
    mobile_phone_cc: string
    mobile_phone: string
    start_date: string
    end_date: string | null
    apodo: string
    estimado: string
    observation: boolean
    company: {
        razon_social: string
    }
    assistant: {
        name: string
        last_name: string
    }
    membership_id: number | null
    membership: {
        name: string
        membership_type: string
    } | null
    sae_meetings: string[] | null
}

//usado para [id] de usuarios.
export type ExecutiveDetail = {
    id: number
    dni: string
    name: string
    last_name: string
    company_id: number
    assistant_id: number
    tareco: string
    birth_date: string
    country: string
    email: string
    position: string
    area: string
    user_type: string
    active: boolean
    office_phone_cc: string
    office_phone: string
    office_phone_extension: string
    mobile_phone_cc: string
    mobile_phone: string
    start_date: string
    end_date: string | null
    apodo: string
    estimado: string
    observation: boolean
    company: {
        razon_social: string
    }
    assistant: {
        name: string
        last_name: string
        cc_office_phone: string
        office_phone: string
        office_phone_extension: string
        cc_mobile_phone: string
        mobile_phone: string
    }
    membership: {
        name: string
        membership_type: string
    } | null
    reemplaza_a: number | null
    reemplazado_executive?: {
        name: string
        last_name: string
    }
    sae_meetings: string[] | null
}
