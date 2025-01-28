'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';

export default function RegisterGuestsPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const logGuestsByEmail = async () => {
      const { data, error } = await supabase
        .from('event_guest')
        .select('*')
        .eq('email', 'sebastian.hurtado@utec.edu.pe');
      if (error) {
        console.error('Error fetching guests:', error);
      } else {
        console.log('Guests with email sebastian.hurtado@utec.edu.pe:', data);
      }
    };

    logGuestsByEmail();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setCsvFile(file);
  };

  const processCsv = async () => {
    if (!csvFile) {
      setStatus('Por favor, selecciona un archivo CSV.');
      return;
    }

    setProcessing(true);
    setStatus(null);

    Papa.parse(csvFile, {
      header: true,
      complete: async (result) => {
        const rows = result.data as { email: string }[];
        const emailList = rows.map((row) => row.email); // Extraemos la lista de emails
        
        try {
          // Verificamos cuántos emails de la lista existen en la base de datos
          const { data: matchingEmails, error: selectError } = await supabase
            .from('executive')
            .select('email') // Seleccionamos solo el campo email
            .in('email', emailList); // Comparamos con la lista de emails
        
          if (selectError) {
            console.error('Error verificando emails en la base de datos:', selectError);
            return;
          }
        
          // Contamos cuántos correos coinciden
          const count = matchingEmails?.length || 0;
        
          console.log(`Total de correos encontrados en la base de datos: ${count}`);
        } catch (error) {
          console.error('Error procesando la verificación de correos:', error);
        }
        
      },        
      error: (error) => {
        console.error('Error procesando CSV:', error);
        setStatus('Error procesando el archivo CSV.');
        setProcessing(false);
      },
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Registrar Invitados desde CSV</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      <Button onClick={processCsv} disabled={processing}>
        {processing ? 'Procesando...' : 'Registrar'}
      </Button>
      {status && <p className="mt-2 text-sm text-gray-700">{status}</p>}
    </div>
  );
}
