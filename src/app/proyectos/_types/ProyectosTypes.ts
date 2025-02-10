export type Project = {
    id: number
    project_code: string
    company_id: number
    executive_id: number
    other_executive: boolean
    other_fullname: string | null
    other_email: string | null
    assignee: string[]
    start_date: string
    end_date: string
    status: 'Inicial' | 'Intermedio' | 'Avanzado' | 'Finalizado' | 'Propuesta enviada'
    comments: string
    company: {
        razon_social: string
    }
    executive: {
        name: string
        last_name: string
    }
}

//De la parde [id] de proyectos, este contiene positions en executive. y cambia en status.
export type ProjectDetails = {
    id: number
    project_code: string
    company_id: number
    executive_id: number
    other_executive: boolean
    other_fullname: string | null
    other_email: string | null
    assignee: string[]
    start_date: string
    end_date: string
    status: string
    comments: string
    company: {
        razon_social: string
    }
    executive: {
        name: string
        last_name: string
        position: string
    }
}
