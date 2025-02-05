'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
//import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"

import { EmailConfirmationModal } from './EmailModal'


type ConsolidatedGuest = {
  id: string
  name: string
  company: string
  position: string
  email: string
  tipo_usuario: string
  tipo_membresia: string
  end_date: string
  assisted: boolean
  registered: boolean
  lastEmailSent: string
  lastEmailSentShow: string
  apodo: string
  estimado: string
  tareco: string
  is_user: string
}

const emailTypeLabels: { [key: string]: string } = {
  "ninguno": "Invitación no enviada",
  "registro-p": "Invitación SAE enviada",
  "registro-v": "Invitación SAE virtual enviada",
  "recordatorio-p": "Recordatorio SAE enviada",
  "recordatorio-v": "Recordatorio SAE virtual enviada",
};


export function EmailTable({ listId, eventId = null }: { listId: number; eventId?: number | null }) {
  const [guests, setGuests] = useState<ConsolidatedGuest[]>([])
  const [visibleGuests, setVisibleGuests] = useState<ConsolidatedGuest[]>([])
  const [userTypes, setUserTypes] = useState<string[]>(['Todos'])
  const [filterLastEmailSent, setFilterLastEmailSent] = useState<'todos' | 'ninguno' | 'registro-p' | 'registro-v' | 'recordatorio-p' | 'recordatorio-v'>('todos');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)


  useEffect(() => {
    console.log("Fetching guests")
    fetchGuests()
    console.log("Guests fetched", guests)
  }, [])

  useEffect(() => {
    let filteredGuests = guests;

      // Filtro por registrado
        //const isRegistered = false;
        //filteredGuests = filteredGuests.filter((guest) => guest.registered === isRegistered);

      filteredGuests = filteredGuests.filter((guest) => guest.tipo_usuario.toLowerCase() !== "free trial");


      // Filtro por correo enviado
      if (filterLastEmailSent !== 'todos') {
        filteredGuests = filteredGuests.filter((guest) => guest.lastEmailSent === filterLastEmailSent);
      }

      
      const paginatedGuests = filteredGuests
      
    const sortedData = paginatedGuests.sort((a, b) => {
      return (a.company || "").localeCompare(b.company || "");
    });
    const logData = sortedData.map(({ apodo, email, name, estimado }) => ({
      apodo,
      email,
      name,
      estimado
    }));
    console.log("logData", logData)
    setVisibleGuests(sortedData);
  }, [filterLastEmailSent, guests])

  async function fetchGuests() {
    console.log("Fetching guests");

    const { data, error, count } = await supabase
      .from('guest')
      .select(
        `
        *,
        company:company_id (razon_social),
        executive:executive_id (
        name,
        estimado,
        apodo,
        last_name,
        email,
        position,
        end_date,
        user_type,
        tareco,
        membership_id,
        membership:membership_id (membership_type)
      )
      `,
        { count: 'exact' }
      )
      .eq('list_id', listId)

    if (error) {
      console.error('Error fetching guests:', error);
      return;
    }

    if (data && count !== null) {
      let eventGuestMap: Record<string, { id: number; assisted: boolean; registered: boolean }> = {};

      // Si se pasa un eventId, obtener datos de event_guest
      if (eventId) {
        const { data: eventGuestData, error: eventGuestError } = await supabase
          .from('event_guest')
          .select('id, guest_id, assisted, registered')
          .eq('event_id', eventId);

        if (eventGuestError) {
          console.error('Error fetching event_guest:', eventGuestError);
        } else {
          // Crear un diccionario con los datos de event_guest
          eventGuestMap = eventGuestData?.reduce((map, item) => {
            map[item.guest_id] = {
              id: item.id,
              assisted: item.assisted || false,
              registered: item.registered || false,
            };
            return map;
          }, {} as Record<string, { id: number; assisted: boolean; registered: boolean }>);
        }
      } else {
        const { data: eventIds, error: eventsInListError } = await supabase
          .from('event_list')
          .select('event_id')
          .eq('list_id', listId);
        
        const eventIdsList = eventIds?.map((event) => event.event_id) || [];

        if (eventsInListError) {
          console.error('Error fetching events in list:', eventsInListError);
        } else {
          console.log("eventIds", eventIdsList);
          if (eventIdsList.length > 0) {
            const { data: eventGuestData, error: eventGuestError } = await supabase
              .from('event_guest')
              .select('id, guest_id, assisted, registered')
              .in('event_id', eventIdsList);

            console.log("events", eventGuestData);
            if (eventGuestError) {
              console.error('Error fetching event_guest:', eventGuestError);
            } else {
              // Crear un diccionario con los datos de event_guest
              eventGuestMap = eventGuestData?.reduce((map, item) => {
                // Si el guest_id ya existe en el mapa, hacemos un "OR" con los valores actuales
                if (map[item.guest_id]) {
                  map[item.guest_id].assisted = map[item.guest_id].assisted || item.assisted || false;
                  map[item.guest_id].registered = map[item.guest_id].registered || item.registered || false;
                } else {
                  // Si no existe en el mapa, lo inicializamos con los valores actuales
                  map[item.guest_id] = {
                    id: item.id,
                    assisted: item.assisted || false,
                    registered: item.registered || false,
                  };
                }
                return map;
              }, {} as Record<string, { id: number; assisted: boolean; registered: boolean }>); // Diccionario inicial vacío
            }
          }          
        }
      }

      const macroEventId = 5;

      const { data: emailLogs, error } = await supabase
        .from("sendgridLogs")
        .select("email, email_type, created_at")
        .eq("macro_event_id", macroEventId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching sendgridLogs:", error);
      }

      const lastEmailSentMap = new Map<string, string>();

      if (emailLogs) {
        emailLogs.forEach((log) => {
          if (!lastEmailSentMap.has(log.email)) {
            lastEmailSentMap.set(log.email, log.email_type);
          }
        });
      }


      const consolidatedGuests: ConsolidatedGuest[] = data.map((guest) => {
        const email = guest.email ?? '';
        const lastEmailSent = lastEmailSentMap.get(email) || 'ninguno';
        const lastEmailSentShow = emailTypeLabels[lastEmailSent] || "Invitación no enviada";
        const name = guest.is_user
        ? `${guest.executive?.name?.trim()} ${guest.executive?.last_name?.trim() || ''}`.trim()
        : guest.name ?? '';
    
        // Generar `apodo`, asegurando que nunca sea vacío
        const apodo = guest.is_user
          ? (guest.executive?.apodo?.trim() ? guest.executive.apodo.trim() : name) // Si está vacío o null, usar name
          : name; // Si no es usuario, `apodo` es igual a `name`

        // Generar `estimado`, asegurando que nunca sea vacío
        const estimado = guest.is_user
          ? (guest.executive?.estimado?.trim() ? guest.executive.estimado.trim() : "Estimado(a)") // Si está vacío o null, usar "Estimado(a)"
          : "Estimado(a)"; // Si es externo, siempre "Estimado(a)"

        const tareco = guest.is_user
          ? (guest.executive?.tareco?.trim() ? guest.executive.tareco.trim() : "-") : "-";

        return {
          id: guest.id,
          name: name,
          company: guest.is_client_company
            ? guest.company?.razon_social ?? ''
            : guest.company_razon_social ?? '',
          position: guest.is_user
            ? guest.executive?.position ?? ''
            : guest.position ?? '',
          email: email,
          tipo_usuario: guest.is_user
            ? guest.executive?.user_type ?? ''
            : guest.tipo_usuario ?? '',
          tipo_membresia: guest.is_user ? guest.executive?.membership?.membership_type ?? '' : guest.tipo_membresia ?? '',
          end_date: guest.executive?.end_date ?? '',
          assisted: eventGuestMap[guest.id]?.assisted ?? false,
          registered: eventGuestMap[guest.id]?.registered ?? false,
          lastEmailSent: lastEmailSent,
          lastEmailSentShow: lastEmailSentShow,
          apodo: apodo,
          estimado: estimado,
          tareco: tareco,
          is_user: guest.is_user
      }
    });


      // Agregar datos de event_guest si están disponibles
      const enrichedGuests = consolidatedGuests.map((guest) => ({
        ...guest,
        event_guest: eventGuestMap[guest.id] || null,
      }));

      setGuests(enrichedGuests);
      setUserTypes([
        ...userTypes,
        ...[...new Set(enrichedGuests.map((guest) => guest.tipo_usuario))].filter(
          (tipo) => tipo && tipo !== "" && !userTypes.includes(tipo)
        )
      ]);      
      
    }
  }

  const handleGuestSelect = (guestId: string) => {
      setSelectedGuests(prev => 
        prev.includes(guestId)
          ? prev.filter(id => id !== guestId)
          : [...prev, guestId]
      )
  }
  
  const handleSelectAll = () => {
      const visibleIds = visibleGuests.map(guest => guest.id);
    
      if (selectAll) {

        setSelectedGuests(prev => prev.filter(id => !visibleIds.includes(id)));
      } else {

        setSelectedGuests(prev => [...new Set([...prev, ...visibleIds])]);
      }
      
      setSelectAll(!selectAll);
  };

  const handleEmailConfirmation = async (emailType: string) => {

    // TODO: Cambiar macro evento
    const macroEventId = 5;

    if (selectedGuests.length === 0) {
      console.log("No guests selected. Aborting email send.")
      setIsEmailModalOpen(false)
      return
    }

    console.log(`Sending ${emailType} emails to ${selectedGuests.length} guests`)

    const templateIds: { [key: string]: string } = {
      "registro-p": "d-e9c0123bda8f46eabd8cda5feb941e09",
      "registro-v": "d-19d5cfaf534948c48a9f8c9b16bc041f",
      "recordatorio-v": "d-961094c8e22f416b80e9339fbaa274c1",
      "recordatorio-p": "d-2c004db5809e48a49024d4b179c18281",
    }
    
    const template_id = templateIds[emailType]
    if (!template_id) {
      console.error(`Invalid emailType: ${emailType}. Aborting email send.`)
      return
    }
    
    //const selectedGuestsData = guests.filter((guest) => selectedGuests.includes(guest.id))
    
    const selectedGuestsData = [
      {
          "apodo": "Sebastian Hurtado",
          "email": "shurtado@gmail.com",
          "name": "Sebastian Hurtado",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Juan Carlos",
          "email": "joppe@aesa.com.pe",
          "name": "Juan Carlos Oppe",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Diego Aguirre",
          "email": "diego.aguirre@cumbra.com.pe",
          "name": "Diego Aguirre",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Raymond",
          "email": "raymond.guillen@apmterminals.com",
          "name": "Raymond Guillén Saija",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Andrea",
          "email": "afarro@apoyoconsultoria.com",
          "name": "Andrea Farro",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "María Sofía",
          "email": "mpatino@apoyoconsultoria.com",
          "name": "María Sofía Patiño",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "Andrea",
          "email": "asotelo@apoyoconsultoria.com",
          "name": "Andrea Sotelo",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "Milagros",
          "email": "msantamaria@apoyoconsultoria.com",
          "name": "Milagros Santa María",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "Daniela",
          "email": "dsalinas@apoyoconsultoria.com",
          "name": "Daniela Salinas Sabogal",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "Ana",
          "email": "acangulo@apoyoconsultoria.com",
          "name": "Ana Cristina Angulo",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "Daniela",
          "email": "dramos@apoyoconsultoria.com",
          "name": "Daniela Ramos Augusto",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Samantha",
          "email": "sfigueroa@apoyoconsultoria.com",
          "name": "Samantha Figueroa",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "Alejandro",
          "email": "aaldana@apoyoconsultoria.com",
          "name": "Alejandro Aldana",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Valeria",
          "email": "vvargas@apoyoconsultoria.com",
          "name": "Valeria Vargas",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "Alejandro",
          "email": "aortiz@apoyoconsultoria.com",
          "name": "Alejandro Ortiz Sánchez",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Gustavo Campos Rivero",
          "email": "gustavocampos@aai.com.pe",
          "name": "Gustavo Campos Rivero",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Americo",
          "email": "avergara@parauco.com",
          "name": "Américo José Vergara Sarmiento",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Jaime",
          "email": "jgrana@aap.org.pe",
          "name": "Jaime Graña",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Adrian Armas",
          "email": "adrian.armas@bcrp.gob.pe",
          "name": "Adrian Armas",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Ana Cecilia",
          "email": "aaugusto@betterware.com.pe",
          "name": "Ana Cecilia Augusto",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Genaro",
          "email": "gsarmiento@bisa.com.pe",
          "name": "Genaro Sarmiento García-Irigoyen",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Rodrigo",
          "email": "rodrigo.franco@brookfield.com",
          "name": "Rodrigo Franco Martínez Del Solar",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Rosa María",
          "email": "rmhy@cmacica.com.pe",
          "name": "Rosa María Higa Yshii Higa Yshii",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "Jessica",
          "email": "jessica.luna@cencosud.com.pe",
          "name": "Jessica Maria Luna Cárdenas",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "Percy",
          "email": "percy.marquina@pucp.edu.pe",
          "name": "Percy Marquina",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "José Antonio",
          "email": "jcarreno@breca.com",
          "name": "José Antonio Carreño Carreño",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Fernando Goldstein Fernando Goldstein",
          "email": "fgoldstein@santander.com.pe",
          "name": "Fernando Goldstein Fernando Goldstein",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Mariella Castagnola",
          "email": "mariella.castagnola@gmail.com",
          "name": "Mariella Castagnola",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Mariano Campos Rivero",
          "email": "mcamposr@primax.com.pe",
          "name": "Mariano Campos Rivero",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Alejandra Santa María Alcazar",
          "email": "a.santamariaalcazar@gmail.com",
          "name": "Alejandra Santa María Alcazar",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Luis",
          "email": "llavadob@alicorp.com.pe",
          "name": "Luis Lavado",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Maria Isabel Mendoza",
          "email": "mariaisabelmendozam@gmail.com",
          "name": "Maria Isabel Mendoza",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Diego Santa María Alcazar",
          "email": "dsantamariaalcazar@gmail.com",
          "name": "Diego Santa María Alcazar",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Pierina Pollarolo",
          "email": "pollarolopierina@gmail.com",
          "name": "Pierina Pollarolo",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Felipe Santa María",
          "email": "f.santamaria@pucp.edu.pe",
          "name": "Felipe Santa María",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Mayte Morales Arce",
          "email": "mmorales@institutoapoyo.org.pe",
          "name": "Mayte Morales Arce",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Juan Carlos Tafur",
          "email": "tafur_rivera@hotmail.com",
          "name": "Juan Carlos Tafur",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Francisco Sardón",
          "email": "fsardon67@gmail.com",
          "name": "Francisco Sardón",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Tabatha",
          "email": "tatala@costeno.com.pe",
          "name": "Tabatha Atala",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Víctor",
          "email": "vzunigaflores@hotmail.com",
          "name": "Víctor Zúñiga Flores",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Ricardo Escobar",
          "email": "rescobar@dlapiper.pe",
          "name": "Ricardo Escobar",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Daniela",
          "email": "dcamacho@dlapiper.pe",
          "name": "Daniela Camacho",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Edgar",
          "email": "econtreras@fenix.com.pe",
          "name": "Edgar Contreras  Julcapoma",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Antonio",
          "email": "antonio.hume@peru21.pe",
          "name": "Antonio Hume",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Andrés",
          "email": "andres.isaza@gs.com",
          "name": "Andrés Isaza",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Alonso",
          "email": "alonso.saponara@gs.com",
          "name": "Alonso Saponarara",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Daniela",
          "email": "daniela.delgado@gs.com",
          "name": "Daniela Delgado",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "Valentina",
          "email": "valentina.moran@gs.com",
          "name": "Valentina Moran",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "José Alberto",
          "email": "jose.gutierrez@nexans.com",
          "name": "José Gutiérrez Ávalos",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Roberto",
          "email": "roberto.huby@yahoo.com",
          "name": "Roberto Huby",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Javier",
          "email": "javier.rehder@gmail.com",
          "name": "Javier Rehder Castro",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Milagros",
          "email": "mparedes@lima-airport.com",
          "name": "Milagros Paredes",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "Javier",
          "email": "javier.linares@mcinversionesperu.com",
          "name": "Javier Linares",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Yolanda",
          "email": "yolanda.lopez@msc.com",
          "name": "Yolanda López Naupari",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "José Antonio",
          "email": "jap@prc.com.pe",
          "name": "José Antonio Payet Puccio",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Oscar",
          "email": "olauz@ransa.net",
          "name": "Oscar Lauz",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Andrea",
          "email": "andrea.sanchez@redinter.company",
          "name": "Andrea Sanchez",
          "estimado": "Estimada",
          "tipo": "virtual"
      },
      {
          "apodo": "Hector",
          "email": "hector.martinez@southlightcapital.com",
          "name": "Hector Martinez",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Juan Carlos",
          "email": "jalvarez@tailoy.com.pe",
          "name": "Juan Carlos Alvarez Noriega",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Javier Bustamante",
          "email": "jbustamante@tecsup.edu.pe",
          "name": "Javier Bustamante",
          "estimado": "Estimado(a)",
          "tipo": "virtual"
      },
      {
          "apodo": "Juan Manuel",
          "email": "jostoja@usil.edu.pe",
          "name": "Juan Manuel Ostoja Carmelino",
          "estimado": "Estimado",
          "tipo": "virtual"
      },
      {
          "apodo": "Juan Diego",
          "email": "jdrivera@vinateatoyama.com",
          "name": "Juan Diego Rivera de la Flor",
          "estimado": "Estimado",
          "tipo": "virtual"
      }
  ]
      
    
    const batchSize = 1000
    const batches = Math.ceil(selectedGuestsData.length / batchSize)

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize
      const end = Math.min((i + 1) * batchSize, selectedGuestsData.length)
      const batchGuests = selectedGuestsData.slice(start, end)


      const emailData = {
        template_id: template_id,
        personalizations: batchGuests.map((guest) => ({
          to: guest.email,
          bcc: "contactasae@apoyoconsultoria.com",
          dynamicTemplateData: {
            first_name: guest.name,
            estimado: guest.estimado,
            apodo: guest.apodo,
            register_link: `https://sae-register.vercel.app/${encodeURIComponent(guest.email)}`,
          },
        })),
      }

      try {
        const response = await fetch("/api/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailData),
        })

        if (!response.ok) {
          throw new Error(`Failed to send email batch ${i + 1} of ${batches}`)
        }

        const { data, error } = await supabase.from("sendgridLogs").insert(
          batchGuests.map((guest) => ({
            email: guest.email,
            email_type: emailType,
            macro_event_id: macroEventId,
          }))
        )

        if (error) {
          console.error(`Error inserting logs into Supabase for batch ${i + 1}:`, error)
        } else {
          console.log(`Successfully inserted logs for batch ${i + 1}`)
          console.log(data)
        }

        console.log(`Successfully sent batch ${i + 1} of ${batches}`)
      } catch (error) {
        console.error(`Error sending email batch ${i + 1} of ${batches}:`, error)
      }
    }

    setIsEmailModalOpen(false)
    //window.location.reload();
  }

 

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Lista de invitados</h1>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6">

      <div className="flex flex-wrap items-end gap-4">
      {/* Filtro Correo Enviado */}
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-gray-700">Correo Enviado</label>
        <Select
          onValueChange={(value) => setFilterLastEmailSent(value as 'todos' | 'ninguno' | 'registro-p' | 'registro-v')}
          value={filterLastEmailSent}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Selecciona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ninguno">Ninguno</SelectItem>
            <SelectItem value="registro-p">Invitación SAE</SelectItem>
            <SelectItem value="registro-v">Invitación SAE Virtual</SelectItem>
            <SelectItem value="recordatorio-p">Recordatorio presencial</SelectItem>
            <SelectItem value="recordatorio-v">Recordatorio virtual</SelectItem>            
          </SelectContent>
        </Select>
      </div>
      {/* Filtro Registrado */}

        </div>
      </div>
      {/*
     <Button className="mt-4" onClick={() => setIsEmailModalOpen(true)}>
        Enviar {selectedGuests.length} Correos
      </Button>
      */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox checked={visibleGuests.every(guest => selectedGuests.includes(guest.id))} onCheckedChange={handleSelectAll} />
            </TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tipo de usuario</TableHead>
            <TableHead>Estado Correo</TableHead>
            <TableHead>Asistió</TableHead>
            <TableHead>Registrado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleGuests.map((guest) => (
            <>
              <TableRow key={guest.id}>
              <TableCell>
                <Checkbox
                  checked={selectedGuests.includes(guest.id)}
                  onCheckedChange={() => handleGuestSelect(guest.id)}
                />
              </TableCell>
                <TableCell>
                  {guest.name}
                </TableCell>
                <TableCell>
                  {guest.company}
                </TableCell>
                <TableCell>
                  {guest.position}
                </TableCell>
                <TableCell>{guest.email}</TableCell>
                <TableCell>{guest.tipo_usuario}
                </TableCell>
                <TableCell>{guest.lastEmailSentShow}</TableCell>
                <TableCell>{guest.assisted ? 'Sí' : 'No'}</TableCell>
                <TableCell>{guest.registered ? 'Sí' : 'No'}</TableCell>
              </TableRow>
            </>
          ))}
        </TableBody>
      </Table>
      <EmailConfirmationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onConfirm={handleEmailConfirmation}
        guestCount={selectedGuests.length}
        guests={guests}
        selectedGuests={selectedGuests}
      />
    </div>
  )
}
