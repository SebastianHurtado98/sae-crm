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
      .eq('list_id', 28)

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
          .eq('event_id', 81);

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
          "apodo": "Rafael",
          "email": "rafael.berckholtz@agrovisioncorp.com",
          "name": "Rafael Berckholtz",
          "estimado": "Estimado"
      },
      {
          "apodo": "Manuel",
          "email": "mmontori@gmail.com",
          "name": "Manuel Montori Alfaro",
          "estimado": "Estimado"
      },
      {
          "apodo": "Luis",
          "email": "luis.leey@amrop.pe",
          "name": "Luis Leey Casella",
          "estimado": "Estimado"
      },
      {
          "apodo": "Yien Yi",
          "email": "yyi@apoyoconsultoria.com",
          "name": "Yien Yi",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Donita",
          "email": "drodriguez@apoyoconsultoria.com",
          "name": "Donita Rodríguez",
          "estimado": "Estimada"
      },
      {
          "apodo": "Miguel",
          "email": "mfigallo@apoyoconsultoria.com",
          "name": "Miguel Figallo",
          "estimado": "Estimado"
      },
      {
          "apodo": "Francesca",
          "email": "fforga@apoyoconsultoria.com",
          "name": "Francesca Forga",
          "estimado": "Estimada"
      },
      {
          "apodo": "José Carlos",
          "email": "jsaavedra@apoyoconsultoria.com",
          "name": "José Carlos Saavedra",
          "estimado": "Estimado"
      },
      {
          "apodo": "Mariana",
          "email": "membresiassae@apoyoconsultoria.com",
          "name": "Mariana Morante",
          "estimado": "Estimada"
      },
      {
          "apodo": "Lorena",
          "email": "lmendez@apoyoconsultoria.com",
          "name": "Lorena Méndez",
          "estimado": "Estimada"
      },
      {
          "apodo": "Ángel",
          "email": "aguillen@apoyoconsultoria.com",
          "name": "Ángel Guillén",
          "estimado": "Estimado"
      },
      {
          "apodo": "Fernando",
          "email": "fernando.garciarosell@ashmoregroup.com.co",
          "name": "Fernando García-Rosell Chávez",
          "estimado": "Estimado"
      },
      {
          "apodo": "Martín",
          "email": "mnaranjo@asbanc.com.pe",
          "name": "Martín Antonio Naranjo Landerer",
          "estimado": "Estimado"
      },
      {
          "apodo": "Eduardo",
          "email": "emoron@apeseg.org.pe",
          "name": "Eduardo Moron",
          "estimado": "Estimado"
      },
      {
          "apodo": "Claudio",
          "email": "cortizt@gildemeister.pe",
          "name": "Claudio Ortiz Tabusso",
          "estimado": "Estimado"
      },
      {
          "apodo": "Ivan",
          "email": "icontreras@gildemeister.pe",
          "name": "Ivan Contreras",
          "estimado": "Estimado"
      },
      {
          "apodo": "Alvaro",
          "email": "adelgado@azerta.pe",
          "name": "Alvaro Jesus Delgado Ayca",
          "estimado": "Estimado"
      },
      {
          "apodo": "Hugo",
          "email": "hperea@bbva.com",
          "name": "Hugo Perea Flores",
          "estimado": "Estimado"
      },
      {
          "apodo": "Daniel",
          "email": "daniel.menendez@itau.com.pe",
          "name": "Daniel Menendez Zeppilli",
          "estimado": "Estimado"
      },
      {
          "apodo": "Renzo",
          "email": "renzo.ricci@pichincha.pe",
          "name": "Renzo Ricci",
          "estimado": "Estimado"
      },
      {
          "apodo": "Aron",
          "email": "akizner@bancom.pe",
          "name": "Aron Kizner Zamudio",
          "estimado": "Estimado"
      },
      {
          "apodo": "Diego",
          "email": "diego.barrios@bnpparibas.com",
          "name": "Diego Barrios Arbulu",
          "estimado": "Estimado"
      },
      {
          "apodo": "Carlos",
          "email": "cgarciaj@camaralima.org.pe",
          "name": "Carlos García Jeri",
          "estimado": "Estimado"
      },
      {
          "apodo": "Guillermo",
          "email": "gcabrejos@cartaviorumco.pe",
          "name": "Guillermo Isaac Cabrejos",
          "estimado": "Estimado"
      },
      {
          "apodo": "Julio",
          "email": "jgaige@celsa.com.pe",
          "name": "Julio Gaige",
          "estimado": "Estimado"
      },
      {
          "apodo": "Claudia",
          "email": "claudia.ponce@citi.com",
          "name": "Claudia Ponce",
          "estimado": "Estimada"
      },
      {
          "apodo": "Adriana",
          "email": "adriana.valenzuela@citi.com",
          "name": "Adriana Valenzuela",
          "estimado": "Estimada"
      },
      {
          "apodo": "Miguel",
          "email": "miguel.uccelli@citi.com",
          "name": "Miguel Uccelli",
          "estimado": "Estimado"
      },
      {
          "apodo": "Karen",
          "email": "karen.musso@citi.com",
          "name": "Karen Musso",
          "estimado": "Estimada"
      },
      {
          "apodo": "Joaquín Ormeño  ",
          "email": "joaquin.ormeno@citi.com",
          "name": "Joaquín Ormeño  ",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Sergio",
          "email": "sergio.angeles@cnpc.com.pe",
          "name": "Sergio Angeles",
          "estimado": "Estimado"
      },
      {
          "apodo": "Virginia",
          "email": "gdeamat@niubiz.com.pe",
          "name": "Virginia De Amat",
          "estimado": "Estimada"
      },
      {
          "apodo": "Wuilian Deza",
          "email": "wuilian.deza@conelsur.com",
          "name": "Wuilian Deza",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Tulio",
          "email": "tsilgado@acerosarequipa.com",
          "name": "Tulio Silgado Consiglieri",
          "estimado": "Estimado"
      },
      {
          "apodo": "Mariella",
          "email": "mariella.paredes@accorporativo.pe",
          "name": "Mariella Karina Paredes Demarini",
          "estimado": "Estimada"
      },
      {
          "apodo": "Eleonora Silva Pardo",
          "email": "nonisilva21@gmail.com",
          "name": "Eleonora Silva Pardo",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Aldo",
          "email": "aldo.reggiardo@cuatrecasas.com",
          "name": "Aldo Reggiardo Denegri",
          "estimado": "Estimado"
      },
      {
          "apodo": "Blanca",
          "email": "blanca.arrieta@diageo.com",
          "name": "Blanca Arrieta",
          "estimado": "Estimada"
      },
      {
          "apodo": "Esteban",
          "email": "esteban.vargas@dinet.com.pe",
          "name": "Esteban Vargas",
          "estimado": "Estimado"
      },
      {
          "apodo": "Sergio",
          "email": "sbarboza@dlapiper.pe",
          "name": "Sergio Barboza",
          "estimado": "Estimado"
      },
      {
          "apodo": "Eduardo",
          "email": "epolo1967@gmail.com",
          "name": "Eduardo Polo Parada",
          "estimado": "Estimado"
      },
      {
          "apodo": "Anddy",
          "email": "arodriguez@electroperu.com.pe",
          "name": "Anddy Rodríguez Luna",
          "estimado": "Estimado"
      },
      {
          "apodo": "Victor Pereda",
          "email": "victor.pereda@esparq.com",
          "name": "Victor Pereda",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Fernando",
          "email": "fernando.nunez@pe.ey.com",
          "name": "Fernando Nuñez",
          "estimado": "Estimado"
      },
      {
          "apodo": "Alfredo",
          "email": "asillau@farosafi.com",
          "name": "Alfredo Sillau Véldez",
          "estimado": "Estimado"
      },
      {
          "apodo": "Rolando",
          "email": "rlunavictoria@farosafi.com",
          "name": "Rolando Luna Victoria Contreras",
          "estimado": "Estimado"
      },
      {
          "apodo": "Ronald",
          "email": "ronald.orrego@ferreycorp.com.pe",
          "name": "Ronald Orrego",
          "estimado": "Estimado"
      },
      {
          "apodo": "Angelica",
          "email": "angelica.paiva@ferreyros.com.pe",
          "name": "Angelica Paiva Zegarra",
          "estimado": "Estimada"
      },
      {
          "apodo": "Mariela",
          "email": "mariela.garcia@ferreycorp.com.pe",
          "name": "Mariela García de Fabbri",
          "estimado": "Estimada"
      },
      {
          "apodo": "Mirella",
          "email": "mirella.denegri@iff.com",
          "name": "Mirella Denegri Aguirre",
          "estimado": "Estimada"
      },
      {
          "apodo": "Maricarmen Fedalto Bernal",
          "email": "mfedalto@hotmail.com",
          "name": "Maricarmen Fedalto Bernal",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Martin",
          "email": "mhurtado@grupopatio.com",
          "name": "Martin Hurtado",
          "estimado": "Estimado"
      },
      {
          "apodo": "Rodrigo",
          "email": "rmontes@insur.com.pe",
          "name": "Rodrigo Montes",
          "estimado": "Estimado"
      },
      {
          "apodo": "Ricardo Ballon",
          "email": "ricardo.ballon@integraretail.pe",
          "name": "Ricardo Ballon",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Augusto",
          "email": "arodriguez@inteligogroup.com",
          "name": "Augusto Rodríguez Alcocer",
          "estimado": "Estimado"
      },
      {
          "apodo": "David Almora Bringas",
          "email": "dalmora@intercorp.com.pe",
          "name": "David Almora Bringas",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Eduardo",
          "email": "eherrerav@centenario.com.pe",
          "name": "Eduardo Herrera",
          "estimado": "Estimado"
      },
      {
          "apodo": "Katherina",
          "email": "katherina.gamarra@konecta-group.com",
          "name": "Katherina Gamarra",
          "estimado": "Estimada"
      },
      {
          "apodo": "Violeta",
          "email": "vorozco@konecta-group.com",
          "name": "Violeta Orozco",
          "estimado": "Estimada"
      },
      {
          "apodo": "Pilar",
          "email": "pvizcarra@lima-airport.com",
          "name": "Pilar Vizcarra  Albarracin",
          "estimado": "Estimada"
      },
      {
          "apodo": "Germán",
          "email": "german.ortiz@lindcorp.pe",
          "name": "Germán Ortiz Espinosa",
          "estimado": "Estimado"
      },
      {
          "apodo": "Ernesto",
          "email": "efernandini@losportales.com.pe",
          "name": "Ernesto Fernandini Raffo",
          "estimado": "Estimado"
      },
      {
          "apodo": "Teppei",
          "email": "teppei.fujimoto@mitsubishicorp.com",
          "name": "Teppei Fujimoto",
          "estimado": "Estimado"
      },
      {
          "apodo": "Jorge Luis Solari",
          "email": "jorge.solari@marsh.com",
          "name": "Jorge Luis Solari",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Mario Rodriguez",
          "email": "mario.rodriguez@microsoft.com",
          "name": "Mario Rodriguez",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Ines Fernandini",
          "email": "ifernandini@notariafernandini.com",
          "name": "Ines Fernandini",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Shirley",
          "email": "spando@onp.gob.pe",
          "name": "Shirley Margaret Pando Beltran",
          "estimado": "Estimada"
      },
      {
          "apodo": "Antonio",
          "email": "amiranda@omnicommediagroup.com.pe",
          "name": "Antonio Miranda Payet",
          "estimado": "Estimado"
      },
      {
          "apodo": "Rolando",
          "email": "rolando@toledo.pe",
          "name": "Rolando Toledo Vega",
          "estimado": "Estimado"
      },
      {
          "apodo": "Dante",
          "email": "dante.blotte@repsol.com",
          "name": "Dante Blotte Volpe",
          "estimado": "Estimado"
      },
      {
          "apodo": "Abel",
          "email": "uno@repsa.com.pe",
          "name": "Abel Carriquiry  Blondet",
          "estimado": "Estimado"
      },
      {
          "apodo": "Jorge Luis Morales Salmón",
          "email": "jmorales@repsa.com.pe",
          "name": "Jorge Luis Morales Salmón",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Alejandro Nuñez Oporto",
          "email": "alejandro.nunez@rimac.com.pe",
          "name": "Alejandro Nuñez Oporto",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Carlos",
          "email": "cpalomino@sentrix.com.pe",
          "name": "Carlos Palomino",
          "estimado": "Estimado"
      },
      {
          "apodo": "Tulio",
          "email": "tuliovillavicenciob@gmail.com",
          "name": "Tulio Villavicencio",
          "estimado": "Estimado"
      },
      {
          "apodo": "Jaime",
          "email": "jaime@shift.pe",
          "name": "Jaime Sotomayor",
          "estimado": "Estimado"
      },
      {
          "apodo": "Ernesto",
          "email": "ernesto.balarezo@sierrametals.com",
          "name": "Ernesto Balarezo",
          "estimado": "Estimado"
      },
      {
          "apodo": "Jean Pierre",
          "email": "jeanpierre.fort@sierrametals.com",
          "name": "Jean Pierre Fort",
          "estimado": "Estimado"
      },
      {
          "apodo": "Miluska",
          "email": "mcervant@fmi.com",
          "name": "Miluska Cervantes Cornejo",
          "estimado": "Estimada"
      },
      {
          "apodo": "Angela",
          "email": "agrossheim@snmpe.org.pe",
          "name": "Angela Grossheim Barrientos",
          "estimado": "Estimada"
      },
      {
          "apodo": "Oscar",
          "email": "oscar.soto@esab.com.pe",
          "name": "Oscar Soto",
          "estimado": "Estimado"
      },
      {
          "apodo": "Mario",
          "email": "mario.matuk@solgas.com.pe",
          "name": "Mario Matuk",
          "estimado": "Estimado"
      },
      {
          "apodo": "Nicolás",
          "email": "nicolas.pesaque@saint-gobain.com",
          "name": "Nicolás Pesaque Roose",
          "estimado": "Estimado"
      },
      {
          "apodo": "Adolfo",
          "email": "adolfo.vera@spm.pe",
          "name": "Adolfo Vera Fernández",
          "estimado": "Estimado"
      },
      {
          "apodo": "Nuria",
          "email": "nesparchf@southernperu.com.pe",
          "name": "Nuria Esparch",
          "estimado": "Estimada"
      },
      {
          "apodo": "Freddy Mantilla",
          "email": "Freddy.Mantilla@statkraft.com",
          "name": "Freddy Mantilla",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Jorge",
          "email": "jmogrovejo@sbs.gob.pe",
          "name": "Jorge Dâmaso Mogrovejo Gonzalez",
          "estimado": "Estimado"
      },
      {
          "apodo": "Juan Manuel Gesto ",
          "email": "juanmanuel.gesto@telefonica.com",
          "name": "Juan Manuel Gesto ",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Renzo",
          "email": "rzamudio@tupemesa.com.pe",
          "name": "Renzo Zamudio",
          "estimado": "Estimado"
      },
      {
          "apodo": "Julia",
          "email": "julia.sobrevilla@unacem.com",
          "name": "Julia Sobrevilla",
          "estimado": "Estimada"
      },
      {
          "apodo": "Pedro",
          "email": "pgrados@ulima.edu.pe",
          "name": "Luis Grados Smith",
          "estimado": "Estimado"
      },
      {
          "apodo": "Diego Alonso Noreña Chávez",
          "email": "dnorena@ulima.edu.pe",
          "name": "Diego Alonso Noreña Chávez",
          "estimado": "Estimado(a)"
      },
      {
          "apodo": "Mayu",
          "email": "mayuhume@gmail.com",
          "name": "Mayu Hume",
          "estimado": "Estimada"
      },
      {
          "apodo": "Álvaro",
          "email": "aquijandria@gmail.com",
          "name": "Alvaro Quijandría",
          "estimado": "Estimado"
      },
      {
          "apodo": "Augusto",
          "email": "alvarezrodrich@gmail.com",
          "name": "Augusto Álvarez Rodrich",
          "estimado": "Estimado"
      }
  ]
      
    
    const batchSize = 1000
    const batches = Math.ceil(selectedGuestsData.length / batchSize)

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize
      const end = Math.min((i + 1) * batchSize, selectedGuestsData.length)
      const batchGuests = selectedGuestsData.slice(start, end)


      const emailData = {
        template_id: "d-ce61501e4de64cc2911c89fb999d2e22",
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
