export type Presentation = {
    id: number
    company_id: number
    executive_id: number
    other_executive: boolean
    other_fullname: string | null
    other_email: string | null
    elaboration_assignee: string[]
    presentation_assignee: string[]
    order_source: string
    order_date: string
    presentation_date_hour: string
    presentation_type: string
    modalidad: string
    comments: string
    billable: boolean
    billable_currency: string | null
    billable_amount: number | null
    company: {
        razon_social: string
    }
    executive: {
        name: string
        last_name: string
    }
}

//De la parde [id] de presentaciones, este contiene positions en executive.
export type PresentationDetail = {
    id: number
    company_id: number
    executive_id: number
    other_executive: boolean
    other_fullname: string | null
    other_email: string | null
    elaboration_assignee: string[]
    presentation_assignee: string[]
    order_source: string
    order_date: string
    presentation_date_hour: string
    presentation_type: string
    modalidad: string
    comments: string
    billable: boolean
    billable_currency: string | null
    billable_amount: number | null
    company: {
        razon_social: string
    }
    executive: {
        name: string
        last_name: string
        position: string
    }
}
