'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';
import { toast } from "@/hooks/use-toast";

export function UploadZoomAttendance({ eventId, zoombWebinar }: { eventId: number, zoombWebinar: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [orphanedEmails, setOrphanedEmails] = useState<{email: string, username: string}[]>([]);

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function processZoomAttendance(csvFile: File): Promise<any> {
    console.log("Procesando archivo CSV...");
  
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = () => {
        const rawContent = reader.result as ArrayBuffer; // Leer como ArrayBuffer para manejar los bytes
  
        try {
          // Convertir a bytes
          const rawBytes = new Uint8Array(rawContent);
  
          // Detectar codificación: UTF-8 o ISO-8859-1
          let fileContent = "";
          if (rawBytes[0] === 0xef && rawBytes[1] === 0xbb && rawBytes[2] === 0xbf) {
            console.log("Formato detectado: UTF-8 con BOM.");
            fileContent = new TextDecoder("utf-8").decode(rawBytes.subarray(3)); // Omitir BOM
          } else if (/[\x80-\xFF]/.test(String.fromCharCode(...rawBytes))) {
            console.log("Formato detectado: ISO-8859-1.");
            fileContent = new TextDecoder("iso-8859-1").decode(rawBytes);
          } else {
            console.log("Formato detectado: UTF-8 sin BOM.");
            fileContent = new TextDecoder("utf-8").decode(rawBytes);
          }
  
          // Dividir líneas y encontrar el inicio de "Detalles de asistente"
          const lines = fileContent.split("\n").map((line) => line.trim());
          const assistantIndex = lines.findIndex((line) => line.includes("Detalles de asistente"));
  
          if (assistantIndex === -1) {
            console.error('No se encontró la sección "Detalles de asistente".');
            return reject("El archivo no contiene datos relevantes.");
          }
  
          console.log(`"Detalles de asistente" encontrado en la línea ${assistantIndex + 1}`);
  
          // Procesar desde la línea siguiente
          const relevantLines = lines.slice(assistantIndex + 1).filter((line) => line !== "");
          if (relevantLines.length < 2) {
            console.error("No hay suficientes líneas después de 'Detalles de asistente'.");
            return reject("El archivo no contiene datos suficientes para procesar.");
          }
  
          // Parsear cabeceras
          const headers = Papa.parse(relevantLines[0], { delimiter: ",", quoteChar: '"' }).data[0] as string[];
          console.log("Cabeceras detectadas:", headers);
  
          // Validar cabeceras necesarias
          const attendedIndex = headers.indexOf("Asistió");
          const emailIndex = headers.indexOf("Correo electrónico");
          const usernameIndex = headers.indexOf("Nombre de usuario (nombre original)");
          const timeIndex = headers.indexOf("Tiempo en la sesión (minutos)");
  
          if (attendedIndex === -1 || emailIndex === -1 || timeIndex === -1) {
            console.error("Faltan columnas requeridas.");
            return reject("Faltan columnas requeridas: Asistió, Correo electrónico, o Tiempo en la sesión (minutos).");
          }
  
          // Parsear filas
          const rows = relevantLines.slice(1).map((line) => {
            // Intentar parsear con PapaParse
            const initialParse = Papa.parse(line, {
              delimiter: ",",
              quoteChar: '"',
            }).data[0] as string[];
          
            if (initialParse.length === 1) {
              // Si el resultado es un solo string largo, intentar un segundo parseo
              console.warn("Fila mal formateada detectada, aplicando doble parseo:", line);
          
              const secondaryParse = Papa.parse(initialParse[0], {
                delimiter: ",",
                quoteChar: '"',
              }).data[0] as string[];
          
              if (!secondaryParse) {
                console.warn("El segundo parseo falló para la línea:", line);
                return [];
              }
          
              return secondaryParse; // Devuelve la fila correctamente parseada tras el segundo intento
            }
          
            return initialParse; // Devuelve la fila parseada normalmente
          });
  
          // Consolidar datos
          const consolidated = rows.reduce((acc, row, rowIndex) => {
            if (row.length !== headers.length) {
              console.warn(`Fila ${rowIndex + 1} tiene un número incorrecto de columnas:`, row);
            }
  
            const attended = row[attendedIndex]?.toLowerCase().trim();
            const email = row[emailIndex]?.trim().toLowerCase();
            const time = parseInt(row[timeIndex], 10) || 0;
            const username = row[usernameIndex]?.trim() || "";
  
            if (attended === "sí" && email) {
              if (!acc[email]) {
                acc[email] = { email, totalTime: 0, username: username || "" };
              }
              acc[email].totalTime += time;
            }
  
            return acc;
          }, {} as Record<string, { email: string; totalTime: number; username: string }>);
  
          const result = Object.values(consolidated);
          console.log("Asistencia consolidada:", result);
          resolve(result);
        } catch (error) {
          console.error("Error al procesar el archivo:", error);
          reject("Error al procesar el archivo.");
        }
      };
  
      reader.onerror = () => {
        console.error("Error al leer el archivo CSV.");
        reject("No se pudo leer el archivo CSV.");
      };
  
      reader.readAsArrayBuffer(csvFile); // Leer como ArrayBuffer para manejar bytes
    });
  }
  
  
  
  
  

  async function updateEventGuests(attendanceData: { email: string; totalTime: number; username: string }[]) {
    console.log('Actualizando asistentes en Supabase...', attendanceData);
    const batchSize = 50;
    const orphanedEmails: {email: string, username: string}[] = [];
  
    for (let i = 0; i < attendanceData.length; i += batchSize) {
      const batch = attendanceData.slice(i, i + batchSize);
      console.log('Procesando lote:', batch);
  
      const emails = batch.map((item) => item.email.toLowerCase());
  
      const { data: guests, error } = await supabase
        .from('event_guest')
        .select('id, email, is_user')
        .eq('event_id', eventId)
        .in('email', emails);
  
      if (error) {
        console.error('Error al obtener invitados:', error);
        continue;
      }
  
      console.log('Invitados obtenidos:', guests);
  
      const updates = guests.map((guest) => {
        const guestEmail = guest.email;
        const attendanceInfo = batch.find((item) => item.email === guestEmail?.toLowerCase());
        if (attendanceInfo) {
          return {
            id: guest.id,
            virtual_session_time: attendanceInfo.totalTime,
            assisted: true,
          };
        }
        return null;
      }).filter(Boolean);
  
      console.log('Actualizaciones para invitados:', updates);
  
      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from('event_guest')
          .upsert(updates);
  
        if (updateError) {
          console.error('Error actualizando invitados:', updateError);
        }
      }
  
      // Check for orphaned emails
      const updatedEmails = new Set(guests.map(guest => guest.email).filter(Boolean));
      console.log('Correos actualizados:', updatedEmails);
      const batchOrphanedEmails = emails
      .filter(email => !updatedEmails.has(email))
      .map(email => {
        const attendanceInfo = batch.find(item => item.email === email);
        return {
          email,
          username: attendanceInfo?.username || 'Sin username', // Extrae el username o asigna un valor predeterminado
        };
      });
    
    orphanedEmails.push(...batchOrphanedEmails);
    }
  
    setOrphanedEmails(orphanedEmails);
    if (orphanedEmails.length > 0) {
      console.log('Correos huérfanos encontrados:', orphanedEmails);
      toast({
        title: "Correos huérfanos encontrados",
        description: `Se encontraron ${orphanedEmails.length} correos de asistencia Zoom que no están en la tabla event_guest.`,
        variant: "default",
      });
    }
  }

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      console.log('Subiendo archivo:', file.name);
      const attendanceData = await processZoomAttendance(file);
      await updateEventGuests(attendanceData as { email: string; totalTime: number; username: string }[]);
      toast({
        title: "Éxito",
        description: "La asistencia de Zoom se ha actualizado correctamente.",
      });
    } catch (error) {
      console.error('Error al procesar asistencia de Zoom:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar la asistencia de Zoom.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setFile(null);
    }
  };

  const handleZoomSync = async () => {
    try {
      const response = await fetch('/api/zoom-token', {
          method: 'POST',
      });

      if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
      }

      const data = await response.json();
      console.log('Token:', data);

      const webinarSuccess = await getWebinarParticipants(data.access_token);
      if (!webinarSuccess) {
        console.error("Error en el registro del webinar. Operación cancelada.");
        return false;
      }
      return true;

    } catch (error) {
      console.error('Error fetching token:', error);
    }
  }

  const getWebinarParticipants = async (token: string) => {
    const webinarId = zoombWebinar;
    let nextPageToken = '';
    let allParticipants: any[] = [];

    try {
        do {
            let url = `/api/zoom-webinar-participants?webinarId=${webinarId}&token=${token}`;
            if (nextPageToken) {
                url += `&next_page_token=${nextPageToken}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            const data = await response.json();

            allParticipants = allParticipants.concat(data.participants);

            nextPageToken = data.next_page_token || '';

        } while (nextPageToken);

        console.log('Todos los participantes:', allParticipants);
        
    } catch (error) {
        console.error('Error al obtener de zoom:', error);
        return false;
    }

    try {
      const attendanceData = allParticipants.map(participant => ({
        email: participant.user_email,
        totalTime: participant.duration,
        username: participant.name,
      }));

      await updateEventGuests(attendanceData as { email: string; totalTime: number; username: string }[]);
      toast({
        title: "Éxito",
        description: "La asistencia de Zoom se ha actualizado correctamente.",
      });
    } catch (error) {
      console.error('Error al procesar asistencia de Zoom:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar la asistencia de Zoom.",
        variant: "destructive",
      });
    }

};


  return (
    <div className="space-y-4">
      <label
        htmlFor="zoom-csv-upload"
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer block"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <p>Arrastra y suelta un archivo CSV de asistencia de Zoom aquí, o haz clic para seleccionar un archivo</p>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
          id="zoom-csv-upload"
        />
      </label>
      {file && <p>Archivo seleccionado: {file.name}</p>}
      <Button onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? 'Subiendo...' : 'Subir asistencia de Zoom'}
      </Button>
      <div></div>
      <Button onClick={handleZoomSync} disabled={true}>
        Sincronizar asistencia Zoom
      </Button>
      {orphanedEmails.length > 0 && (
        <div className="mt-4 p-4 border rounded-md bg-yellow-50">
          <h3 className="text-lg font-semibold mb-2 text-yellow-800">Correos huérfanos encontrados:</h3>
          <ul className="list-disc pl-5 max-h-60 overflow-y-auto">
            {orphanedEmails.map(({ email, username }, index) => (
              <li key={index} className="text-yellow-700">
                {email} {username && <span className="text-gray-500">({username})</span>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-yellow-600">Total: {orphanedEmails.length} correos huérfanos</p>
        </div>
      )}
    </div>
  );
}
