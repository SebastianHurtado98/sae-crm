export type QueryDetail = {
    id: number
    company_id: number
    executive_id: number | null
    other_executive: boolean
    other_fullname: string | null
    other_email: string | null
    assignee: string[]
    description: string
    solved_date: string | null
    company: {
        razon_social: string
    }
    executive: {
        name: string
        last_name: string
        position: string
    }
}

export type Query = {
    id: number
    company_id: number
    executive_id: number | null
    other_executive: boolean
    other_fullname: string | null
    other_email: string | null
    assignee: string[]
    description: string
    solved_date: string | null
    company: {
        razon_social: string
    }
}