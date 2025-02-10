// eventos

export type Event = {
    id: number
    name: string
    event_type: string
    date_hour: string
    place: string
    register_open: boolean
}

//tiene macro_event_id
export type EventDetail = {
    id: number
    name: string
    event_type: string
    date_hour: string
    place: string
    register_open: boolean
    macro_event_id: number
}
// Para Listas
export type List = {
    id: number
    name: string
    macro_event_id: number
}

//reportes
export type EventGuest = {
    id: string
    event_id: number
    name: string
    email: string
    virtual_session_time: number | null
    registered: boolean
    assisted: boolean
    company_razon_social: string
    guest?: {
        name: string
        email: string
        is_user: boolean
        company_razon_social: string
        company? :{
            razon_social: string
        }
        executive? : {
            name: string
            last_name: string
        }
    }
}

export type MacroEvent = {
    id: number
    name: string
}