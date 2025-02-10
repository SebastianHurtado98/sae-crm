export type Company = {
    id: number
    ruc: string | null
    razon_social: string | null
    nombre_comercial: string | null
    seats: number | null
    country: string | null
    department: string | null
    address: string | null
    phone_number: string | null
    industry: string | null
    status: string | null
    enrollment_date: string | null
    notes: string | null
    headcount: number | null
    sales: number | null
}

export type Executive = {
    id: number
    dni: string | null
    name: string | null
    last_name: string | null
    membership_id: number | null
    assistant_id: number | null
    user_type: string | null
    email: string | null
}

export type Assistant = {
    id: number
    dni: string | null
    name: string | null
    last_name: string | null
    email: string | null
}

export type Membership = {
    id: number
    name: string | null
    membership_type: string | null
}