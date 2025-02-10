
//usado para [id] de secretarias y Page principal de secretarias.
export type Assistant = {
    id: number
    dni: string
    name: string
    last_name: string
    email: string
    company_id: number
    cc_office_phone: string
    office_phone: string
    office_phone_extension: string
    cc_mobile_phone: string
    mobile_phone: string
    company: {
        razon_social: string
    }
}

