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


export function EmailTable({}: { listId: number; eventId?: number | null }) {
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
      const isRegistered = true;
      filteredGuests = filteredGuests.filter((guest) => guest.registered === isRegistered);

      //filteredGuests = filteredGuests.filter((guest) => guest.tipo_usuario.toLowerCase() !== "free trial");


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
      .eq('list_id', 29)

    if (error) {
      console.error('Error fetching guests:', error);
      return;
    }

    if (data && count !== null) {
      let eventGuestMap: Record<string, { id: number; assisted: boolean; registered: boolean }> = {};

      // Si se pasa un eventId, obtener datos de event_guest
      if (true) {
        const { data: eventGuestData, error: eventGuestError } = await supabase
          .from('event_guest')
          .select('id, guest_id, assisted, registered')
          .eq('event_id', 86);

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
      } /*else {
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
      }*/

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
          "apodo": "Dennis",
          "email": "dennis.fernandez@aenza.com.pe",
          "name": "Dennis Fernandez Armas",
          "estimado": "Estimado"
      },
      {
          "apodo": "Mariano",
          "email": "malvarez@afphabitat.com.pe",
          "name": "Mariano Álvarez De la Torre Jara",
          "estimado": "Estimado"
      },
      {
          "apodo": "José Luis",
          "email": "jose.cordano@surainvestments.com",
          "name": "José Luis Cordano Copello",
          "estimado": "Estimado"
      },
      {
          "apodo": "Mayte",
          "email": "msavaresse@algeciras.com.pe",
          "name": "Mayte Savaresse  Berrocal",
          "estimado": "Estimada"
      },
      {
          "apodo": "Rafael",
          "email": "rvillanueva@algeciras.com.pe",
          "name": "Rafael Villanueva Merino",
          "estimado": "Estimado"
      },
      {
          "apodo": "Malena",
          "email": "mmoralesval@alicorp.com.pe",
          "name": "Malena Morales Valentín",
          "estimado": "Estimada"
      },
      {
          "apodo": "Federico",
          "email": "federico.cuneo@amrop.pe",
          "name": "Federico Cáneo De la Piedra",
          "estimado": "Estimado"
      },
      {
          "apodo": "Ana",
          "email": "ana.chiappori@outlook.com.pe",
          "name": "Ana Chiappori  Samengo",
          "estimado": "Estimada"
      },
      {
          "apodo": "Javier",
          "email": "javier.rivarola@anixter.com",
          "name": "Javier Rivarola",
          "estimado": "Estimado"
      },
      {
          "apodo": "Gabriel",
          "email": "goz@apoyocomunicacion.com",
          "name": "Gabriel Ortiz de Zevallos",
          "estimado": "Estimado"
      },
      {
          "apodo": "Milagros",
          "email": "mavendano@apoyocomunicacion.com",
          "name": "Milagros Avendaño Rodriguez Larrain",
          "estimado": "Estimada"
      },
      {
          "apodo": "Claudia",
          "email": "carata@apoyoconsultoria.com",
          "name": "Claudia Arata",
          "estimado": "Estimada"
      },
      {
          "apodo": "Francesca",
          "email": "fforga@apoyoconsultoria.com",
          "name": "Francesca Forga",
          "estimado": "Estimada"
      },
      {
          "apodo": "Giuliana",
          "email": "gnavarro@apoyoconsultoria.com",
          "name": "Giuliana Navarro",
          "estimado": "Estimada"
      },
      {
          "apodo": "Susana",
          "email": "scama@apoyoconsultoria.com",
          "name": "Susana Cama",
          "estimado": "Estimada"
      },
      {
          "apodo": "Alejandra",
          "email": "averastegui@apoyoconsultoria.com",
          "name": "Alejandra Verástegui",
          "estimado": "Estimada"
      },
      {
          "apodo": "Ángel",
          "email": "aguillen@apoyoconsultoria.com",
          "name": "Ángel Guillén",
          "estimado": "Estimado"
      },
      {
          "apodo": "Jaime",
          "email": "jgrana@aap.org.pe",
          "name": "Jaime Graña",
          "estimado": "Estimado"
      },
      {
          "apodo": "Ider Cifuentes",
          "email": "ider.cifuentes.m@astara.com",
          "name": "Ider Cifuentes",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Didier",
          "email": "dsaplana@austral.com.pe",
          "name": "Didier Saplana Piquemal",
          "estimado": "Estimado"
      },
      {
          "apodo": "Adriana",
          "email": "agiudice@austral.com.pe",
          "name": "Adriana Giudice Alva",
          "estimado": "Estimada"
      },
      {
          "apodo": "Claudio",
          "email": "cortizt@gildemeister.pe",
          "name": "Claudio Ortiz Tabusso",
          "estimado": "Estimado"
      },
      {
          "apodo": "Alvaro",
          "email": "adelgado@azerta.pe",
          "name": "Alvaro Jesus Delgado Ayca",
          "estimado": "Estimado"
      },
      {
          "apodo": "Julio",
          "email": "julio.velarde@bcrp.gob.pe",
          "name": "Julio Velarde  Flores",
          "estimado": "Estimado"
      },
      {
          "apodo": "Paul",
          "email": "paul.castillo@bcrp.gob.pe",
          "name": "Paul Castillo",
          "estimado": "Estimado"
      },
      {
          "apodo": "Jose Luis",
          "email": "jchavez@bcp.com.pe",
          "name": "Jose Luis Chavez Corzo",
          "estimado": "Estimado"
      },
      {
          "apodo": "Alejandro",
          "email": "alejandroperezreyes@credicorpperu.com",
          "name": "Alejandro Perez Reyes",
          "estimado": "Estimado"
      },
      {
          "apodo": "Luis",
          "email": "lcarrera@bcp.com.pe",
          "name": "Luis Alfonso Carrera Sarmiento",
          "estimado": "Estimado"
      },
      {
          "apodo": "Diego",
          "email": "dcavero@bcp.com.pe",
          "name": "Diego Cavero Belaunde",
          "estimado": "Estimado"
      },
      {
          "apodo": "María del Carmen",
          "email": "mtorres@bcp.com.pe",
          "name": "María del Carmen Torres  Mariscal",
          "estimado": "Estimada"
      },
      {
          "apodo": "María Eugenia Diaz",
          "email": "mediaz@bancofalabella.com.pe",
          "name": "María Eugenia Diaz",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Tomas",
          "email": "tomaslt@iadb.org",
          "name": "Tomas Lopes-Teixeira Bermudez",
          "estimado": "Estimado"
      },
      {
          "apodo": "Juan Carlos",
          "email": "jorrego@banbif.com.pe",
          "name": "Juan Carlos Orrego Gonzales",
          "estimado": "Estimado"
      },
      {
          "apodo": "Tanja Goodwin",
          "email": "tgoodwin@worldbank.org",
          "name": "Tanja Goodwin",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Luis",
          "email": "luishoracio.rodriguez@pichincha.pe",
          "name": "Luis Horacio Rodriguez",
          "estimado": "Estimado"
      },
      {
          "apodo": "Javier",
          "email": "jsalazar@besco.com.pe",
          "name": "Javier Salazar Flores",
          "estimado": "Estimado"
      },
      {
          "apodo": "Francisco",
          "email": "fmolina2@ford.com",
          "name": "Francisco Molina Pico",
          "estimado": "Estimado"
      },
      {
          "apodo": "Luis",
          "email": "lseminario@bsf.pe",
          "name": "Luis Seminario",
          "estimado": "Estimado"
      },
      {
          "apodo": "José Antonio",
          "email": "jose.blancocaceres@btgpactual.com",
          "name": "José Antonio Blanco Cáceres",
          "estimado": "Estimado"
      },
      {
          "apodo": "Gustavo",
          "email": "gustavo.yabar@bcw-global.com",
          "name": "Gustavo Yábar Varas",
          "estimado": "Estimado"
      },
      {
          "apodo": "Wilber",
          "email": "wdongo@cajaarequipa.pe",
          "name": "Wilber Dongo Diaz",
          "estimado": "Estimado"
      },
      {
          "apodo": "David",
          "email": "dise@cmacica.com.pe",
          "name": "David Sanguineti",
          "estimado": "Estimado"
      },
      {
          "apodo": "Aldo",
          "email": "adefilippi@amcham.org.pe",
          "name": "Aldo Defilippi",
          "estimado": "Estimado"
      },
      {
          "apodo": "Marcelo",
          "email": "marcelo_castedo@cargill.com",
          "name": "Marcelo Castedo",
          "estimado": "Estimado"
      },
      {
          "apodo": "Luis",
          "email": "lbenavides@cartaviorumco.pe",
          "name": "Luis Benavides González del Riego",
          "estimado": "Estimado"
      },
      {
          "apodo": "Santiago",
          "email": "santiago.reyna@carvimsa.com",
          "name": "Santiago Reyna Ciccia",
          "estimado": "Estimado"
      },
      {
          "apodo": "Alfredo",
          "email": "alfredo.mastrokalos@cencosud.com.pe",
          "name": "Alfredo Mastrokalos Viñas",
          "estimado": "Estimado"
      },
      {
          "apodo": "Patricio",
          "email": "patricio.malone@citi.com",
          "name": "Patricio Malone",
          "estimado": "Estimado"
      },
      {
          "apodo": "Pilar Loaiza",
          "email": "pilar.loaiza@citi.com",
          "name": "Pilar Loaiza",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Sandra",
          "email": "sangarcia@coca-cola.com",
          "name": "Sandra García",
          "estimado": "Estimada"
      },
      {
          "apodo": "César",
          "email": "cliendo@antamina.com",
          "name": "César Liendo",
          "estimado": "Estimado"
      },
      {
          "apodo": "Patricia Teullet",
          "email": "patriciateullet@yahoo.com",
          "name": "Patricia Teullet",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Corina",
          "email": "csegundo@confiteca.com.pe",
          "name": "Corina Segundo",
          "estimado": "Estimada"
      },
      {
          "apodo": "Cecilia Zevallos",
          "email": "czevallos@breca.com",
          "name": "Cecilia Zevallos",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Jack",
          "email": "jfalkon@cipsa.com.pe",
          "name": "Jack Falcón",
          "estimado": "Estimado"
      },
      {
          "apodo": "Elia King de Jordán",
          "email": "elia.king.jordan@gmail.com",
          "name": "Elia King de Jordán",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Cecilia Blume",
          "email": "ceciliablume@gmail.com",
          "name": "Cecilia Blume",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Sandro Borda",
          "email": "sborda@carvajal.com",
          "name": "Sandro Borda",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Eleonora Silva Pardo",
          "email": "nonisilva21@gmail.com",
          "name": "Eleonora Silva Pardo",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "David Lemor",
          "email": "dlemor@pobox.com",
          "name": "David Lemor",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Jorge Estrella",
          "email": "jorge.estrella.viladegut@gmail.com",
          "name": "Jorge Estrella",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Daniel",
          "email": "dhernandezt@alicorp.com.pe",
          "name": "Daniel Hernández",
          "estimado": "Estimado"
      },
      {
          "apodo": "Jaime Araoz",
          "email": "jaimearaozm@gmail.com",
          "name": "Jaime Araoz",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Juan Carlos Tafur",
          "email": "tafur_rivera@hotmail.com",
          "name": "Juan Carlos Tafur",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Rodrigo",
          "email": "rmejia@qroma.com.pe",
          "name": "Rodrigo Mejía Miranda",
          "estimado": "Estimado"
      },
      {
          "apodo": "Javier",
          "email": "jvasquezmejia@qroma.com.pe",
          "name": "Javier Vasquez-Mejia Sander",
          "estimado": "Estimado"
      },
      {
          "apodo": "Margarita Zavala",
          "email": "margaritazavala@viccts.com",
          "name": "Margarita Zavala",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Víctor",
          "email": "vzunigaflores@hotmail.com",
          "name": "Víctor Zúñiga Flores",
          "estimado": "Estimado"
      },
      {
          "apodo": "Jorge",
          "email": "jorge.ramirez@ca-cib.com",
          "name": "Jorge Ramirez Alegre",
          "estimado": "Estimado"
      },
      {
          "apodo": "Manuel Larrain",
          "email": "manuel.larrain@ca-cib.com",
          "name": "Manuel Larrain",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Jorge",
          "email": "jghiglino@crosland.com.pe",
          "name": "Jorge Ghiglino Echegaray",
          "estimado": "Estimado"
      },
      {
          "apodo": "Willard",
          "email": "wmanrique@crosland.com.pe",
          "name": "Willard Martín Manrique Ramos",
          "estimado": "Estimado"
      },
      {
          "apodo": "Daniela",
          "email": "dcamacho@dlapiper.pe",
          "name": "Daniela Camacho",
          "estimado": "Estimado"
      },
      {
          "apodo": "Alvaro",
          "email": "alvaro.roncal@edelman.com",
          "name": "Alvaro Roncal",
          "estimado": "Estimado"
      },
      {
          "apodo": "Mariano Orihuela",
          "email": "mariano@gastonacurio.pe",
          "name": "Mariano Orihuela",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "César",
          "email": "cesar.vargas@bata.com",
          "name": "César Vargas",
          "estimado": "Estimado"
      },
      {
          "apodo": "Luis",
          "email": "luis.torrealba@entel.pe",
          "name": "Luis Teobaldo Torrealba Fuentes",
          "estimado": "Estimado"
      },
      {
          "apodo": "Enrique",
          "email": "enrique.oliveros@pe.ey.com",
          "name": "Enrique Oliveros Meza",
          "estimado": "Estimado"
      },
      {
          "apodo": "Jean Paul",
          "email": "jpchabaneix@estudiorodrigo.com",
          "name": "Jean Paul Chabaneix  Cunza",
          "estimado": "Estimado"
      },
      {
          "apodo": "Edgar",
          "email": "econtreras@fenix.com.pe",
          "name": "Edgar Contreras  Julcapoma",
          "estimado": "Estimado"
      },
      {
          "apodo": "Martin",
          "email": "martin.robles@pe.g4s.com",
          "name": "Martin Robles",
          "estimado": "Estimado"
      },
      {
          "apodo": "Jorge",
          "email": "jruiz@edifica.com.pe",
          "name": "Jorge Ruiz  Ortiz",
          "estimado": "Estimado"
      },
      {
          "apodo": "Rafael",
          "email": "rafael.carranza.cw@carlyle.com",
          "name": "Rafael Eduardo Carranza Fano",
          "estimado": "Estimado"
      },
      {
          "apodo": "Martín",
          "email": "mperezm@gromero.com.pe",
          "name": "Martín Pérez Monteverde",
          "estimado": "Estimado"
      },
      {
          "apodo": "Rafaela",
          "email": "rlabartheu@gromero.com.pe",
          "name": "Rafaela Rosario Labarthe Uranga",
          "estimado": "Estimada"
      },
      {
          "apodo": "Paola",
          "email": "pmoreano@contacto.com.pe",
          "name": "Paola Moreano",
          "estimado": "Estimada"
      },
      {
          "apodo": "Roberto",
          "email": "roberto.delgado@inchcape.cl",
          "name": "Roberto Delgado",
          "estimado": "Estimado"
      },
      {
          "apodo": "Omar",
          "email": "ootiniano@basa.com.pe",
          "name": "Omar Otiniano Andía",
          "estimado": "Estimado"
      },
      {
          "apodo": "Oswaldo",
          "email": "osandoval@sandoval.com.pe",
          "name": "Oswaldo Sandoval Aguirre",
          "estimado": "Estimado"
      },
      {
          "apodo": "Alejandro",
          "email": "asandoval@sandoval.com.pe",
          "name": "Alejandro Sandoval  Zavala",
          "estimado": "Estimado"
      },
      {
          "apodo": "Edgardo",
          "email": "ecarbonel@iksa.com.pe",
          "name": "Edgardo Carbonel Cavero",
          "estimado": "Estimado"
      },
      {
          "apodo": "Alberto",
          "email": "ahuasasquichem@intercorp.com.pe",
          "name": "Alberto Huasasquiche",
          "estimado": "Estimado"
      },
      {
          "apodo": "Otilia",
          "email": "olongaray@intercorp.com.pe",
          "name": "Otilia Longaray",
          "estimado": "Estimada"
      },
      {
          "apodo": "Jana",
          "email": "jana.drakic@glencore.com.pe",
          "name": "Jana Drakic Mendoza",
          "estimado": "Estimada"
      },
      {
          "apodo": "Juan Carlos",
          "email": "juan.arribas@jpmorgan.com",
          "name": "Juan Carlos Arribas",
          "estimado": "Estimado"
      },
      {
          "apodo": "Javier",
          "email": "javier.rehder@gmail.com",
          "name": "Javier Rehder Castro",
          "estimado": "Estimado"
      },
      {
          "apodo": "Angie",
          "email": "angie.f.manrique@kcc.com",
          "name": "Angie Manrique",
          "estimado": "Estimada"
      },
      {
          "apodo": "Julio",
          "email": "julio.molina@kmmp.com.pe",
          "name": "Julio Armando Molina Salgado",
          "estimado": "Estimado"
      },
      {
          "apodo": "Tetsujiro",
          "email": "tetsujiro.ishiguro@kmmp.com.pe",
          "name": "Tetsujiro Ishiguro",
          "estimado": "Estimado"
      },
      {
          "apodo": "Mario",
          "email": "mario.fiocco@laive.pe",
          "name": "Mario Fiocco Cornejo",
          "estimado": "Estimado"
      },
      {
          "apodo": "Milagros",
          "email": "mparedes@lima-airport.com",
          "name": "Milagros Paredes",
          "estimado": "Estimada"
      },
      {
          "apodo": "Teppei",
          "email": "teppei.fujimoto@mitsubishicorp.com",
          "name": "Teppei Fujimoto",
          "estimado": "Estimado"
      },
      {
          "apodo": "Lizette",
          "email": "lizette.chamochumbi@marsh.com",
          "name": "Lizette Chamochumbi Macchiavello",
          "estimado": "Estimada"
      },
      {
          "apodo": "Erika",
          "email": "erika.ramos@wavin.com",
          "name": "Erika Ramos",
          "estimado": "Estimada"
      },
      {
          "apodo": "Carlos",
          "email": "carlos.sotelo.r@mibanco.com.pe",
          "name": "Carlos Sotelo",
          "estimado": "Estimado"
      },
      {
          "apodo": "Mónica",
          "email": "mcalderon@marsa.com.pe",
          "name": "Mónica Calderón",
          "estimado": "Estimada"
      },
      {
          "apodo": "Maria Paula",
          "email": "mvargasro@mef.gob.pe",
          "name": "Maria Paula Vargas Romero",
          "estimado": "Estimada"
      },
      {
          "apodo": "Ricardo Najarro",
          "email": "rnajarro@mef.gob.pe",
          "name": "Ricardo Najarro",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Edgard",
          "email": "edgard.ortiz@minsur.com",
          "name": "Edgard Eduardo Ortiz Galvez",
          "estimado": "Estimado"
      },
      {
          "apodo": "Alfonso CAillaux Caillaux",
          "email": "acaillaux@myhomeoi.com",
          "name": "Alfonso CAillaux Caillaux",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Guillermo Ferreyros",
          "email": "guillermo.ferreyros@oigperu.com",
          "name": "Guillermo Ferreyros",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Milagros",
          "email": "mjimenezo@openplaza.com.pe",
          "name": "Milagros Jimenez Olivet",
          "estimado": "Estimada"
      },
      {
          "apodo": "Vanessa Chávarry Mesa",
          "email": "vcm@prcp.com.pe",
          "name": "Vanessa Chávarry Mesa",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Gustavo",
          "email": "gdelgadoa@diamante.com.pe",
          "name": "Gustavo Delgado Aparicio",
          "estimado": "Estimado"
      },
      {
          "apodo": "Walter",
          "email": "wmartinez@hayduk.com.pe",
          "name": "Walter Martínez Moreno",
          "estimado": "Estimado"
      },
      {
          "apodo": "Germán",
          "email": "geralvarez@pluspetrol.net",
          "name": "Germán Alvarez",
          "estimado": "Estimado"
      },
      {
          "apodo": "Juan Pablo",
          "email": "jpnoziglia@prima.com.pe",
          "name": "Juan Pablo Noziglia",
          "estimado": "Estimado"
      },
      {
          "apodo": "Rubén",
          "email": "rloaiza@prima.com.pe",
          "name": "Rubén Loaiza  Negreiros",
          "estimado": "Estimado"
      },
      {
          "apodo": "Francisco",
          "email": "francisco.alvarez@puratos.com",
          "name": "Francisco Alvarez Calderon Velarde",
          "estimado": "Estimado"
      },
      {
          "apodo": "Ramiro",
          "email": "rastete@omnicommediagroup.com.pe",
          "name": "Ramiro Astete",
          "estimado": "Estimado"
      },
      {
          "apodo": "Paolo",
          "email": "psacchi@ransa.net",
          "name": "Paolo Sacchi Giurato",
          "estimado": "Estimado"
      },
      {
          "apodo": "Hozkel",
          "email": "hvurnbr@pisopak.com",
          "name": "Hozkel Vurnbrand Sternberg",
          "estimado": "Estimado"
      },
      {
          "apodo": "Alberto",
          "email": "alberto.rebaza@rebaza-alcazar.com",
          "name": "Alberto Rebaza  Torres",
          "estimado": "Estimado"
      },
      {
          "apodo": "Carlos",
          "email": "carlos.kergariou@redinter.company",
          "name": "Carlos René De Kergariou Cordon",
          "estimado": "Estimado"
      },
      {
          "apodo": "Jorge Luis Morales Salmón",
          "email": "jmorales@repsa.com.pe",
          "name": "Jorge Luis Morales Salmón",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Javier Gamboa",
          "email": "javier.gamboa@rimac.com.pe",
          "name": "Javier Gamboa",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Sara",
          "email": "sleonprado@sanmartinperu.pe",
          "name": "Sara León Prado Aladzeme",
          "estimado": "Estimada"
      },
      {
          "apodo": "Edmund",
          "email": "edmund.egg@skrental.com",
          "name": "Edmund Egg Noche",
          "estimado": "Estimado"
      },
      {
          "apodo": "Jose Raul",
          "email": "joseraul.vargas@skyairline.com",
          "name": "Jose Raul Vargas Felmuth",
          "estimado": "Estimado"
      },
      {
          "apodo": "Pablo",
          "email": "palcazar@fmi.com",
          "name": "Pablo Alcázar",
          "estimado": "Estimado"
      },
      {
          "apodo": "Luis",
          "email": "ldelcarpio@softys.com",
          "name": "Luis Javier Del Carpio Polar",
          "estimado": "Estimado"
      },
      {
          "apodo": "Nicolás",
          "email": "nicolas.pesaque@saint-gobain.com",
          "name": "Nicolás Pesaque Roose",
          "estimado": "Estimado"
      },
      {
          "apodo": "Carolina",
          "email": "cgonzalez@morada.pe",
          "name": "Carolina Gonzalez Castellan",
          "estimado": "Estimada"
      },
      {
          "apodo": "Raúl",
          "email": "rjacob@southernperu.com.pe",
          "name": "Raúl Jacob  Ruisanchez",
          "estimado": "Estimado"
      },
      {
          "apodo": "Hector",
          "email": "hector.martinez@southlightcapital.com",
          "name": "Hector Martinez",
          "estimado": "Estimado"
      },
      {
          "apodo": "Manuel",
          "email": "mluy@sbs.gob.pe",
          "name": "Manuel Luy",
          "estimado": "Estimado"
      },
      {
          "apodo": "Oscar",
          "email": "obasso@sbs.gob.pe",
          "name": "Oscar Basso",
          "estimado": "Estimado"
      },
      {
          "apodo": "Juan",
          "email": "jgarcia@tecsup.edu.pe",
          "name": "Juan Manuel García Calderón Barreda",
          "estimado": "Estimado"
      },
      {
          "apodo": "Silvana",
          "email": "smartel@toyotaperu.com.pe",
          "name": "Silvana Martel Espino",
          "estimado": "Estimada"
      },
      {
          "apodo": "Andrés",
          "email": "amendizabal@tgp.com.pe",
          "name": "Andrés Mendizabal",
          "estimado": "Estimado"
      },
      {
          "apodo": "Tomás",
          "email": "tdelgado@tgp.com.pe",
          "name": "Tomás Delgado Farizo",
          "estimado": "Estimado"
      },
      {
          "apodo": "Álvaro",
          "email": "alvaro.morales@unacem.com",
          "name": "Álvaro Morales Puppo",
          "estimado": "Estimado"
      },
      {
          "apodo": "Iro",
          "email": "iro.petris@unispan.com.pe",
          "name": "Iro Carlo Petris Chiozza",
          "estimado": "Estimado"
      },
      {
          "apodo": "Raúl",
          "email": "raul.diaz@limaexpresa.pe",
          "name": "Raúl Diaz",
          "estimado": "Estimado"
      },
      {
          "apodo": "Gilberto",
          "email": "gilberto.chaparro@visa.com",
          "name": "Gilberto Chaparro",
          "estimado": "Estimado"
      },
      {
          "apodo": "Oscar",
          "email": "oespibe1980@gmail.com",
          "name": "Oscar Espinosa",
          "estimado": "Estimado"
      },
      {
          "apodo": "Julio",
          "email": "julio.malo@me.com",
          "name": "Julio Malo  Vasconez",
          "estimado": "Estimado"
      },
      {
          "apodo": "Javier",
          "email": "javier.tovar@bakermckenzie.com",
          "name": "Javier Tovar",
          "estimado": "Estimado"
      },
      {
          "apodo": "Carlos",
          "email": "cheeren@utec.edu.pe",
          "name": "Carlos Heeren",
          "estimado": "Estimado"
      },
      {
          "apodo": "Evelyn",
          "email": "evebarclay@gmail.com",
          "name": "Evelyn Barclay",
          "estimado": "Estimada"
      }
  ]
      
    
    const batchSize = 1000
    const batches = Math.ceil(selectedGuestsData.length / batchSize)

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize
      const end = Math.min((i + 1) * batchSize, selectedGuestsData.length)
      const batchGuests = selectedGuestsData.slice(start, end)


      const emailData = {
        template_id: "d-2b5d80de6cf847ea945b82051aed2523",
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
