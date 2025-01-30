'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';

export default function ReadEmailsFromCSV() {
  const [csvData, setCsvData] = useState<{ email: string }[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Cargar datos desde el archivo CSV
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (result) => {
        const parsedData = result.data
          .map((row) => ({
            // @ts-expect-error No se puede garantizar que los campos existan
            email: row.email?.trim(),
          }))
          .filter((row) => row.email); // Solo incluir filas con email válido

        setCsvData(parsedData);
        console.log("Datos cargados desde CSV:", parsedData);
        setStatus(`Se cargaron ${parsedData.length} registros.`);
      },
      error: (error) => {
        console.error("Error procesando CSV:", error);
        setStatus("Error procesando el archivo CSV.");
      },
    });
  };

  // Enviar emails en lotes
  const sendEmails = async () => {
    if (csvData.length === 0) {
      console.log("No hay datos cargados.");
      setStatus("No hay correos para enviar.");
      return;
    }

    setProcessing(true);
    const batchSize = 1000;
    const batches = Math.ceil(csvData.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min((i + 1) * batchSize, csvData.length);
      const batchEmails = csvData.slice(start, end);

      const emailData = {
        template_id: "d-06a8253663564735bdbbcdfb031e0ec3",
        personalizations: batchEmails.map((entry) => ({
          to: entry.email,
        })),
      };

      try {
        const response = await fetch("/api/axpen", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailData),
        });

        if (!response.ok) {
          throw new Error(`Failed to send email batch ${i + 1} of ${batches}`);
        }

        console.log(`Successfully sent batch ${i + 1} of ${batches}`);
      } catch (error) {
        console.error(`Error sending email batch ${i + 1} of ${batches}:`, error);
      }
    }

    setStatus(`Se enviaron ${csvData.length} correos.`);
    setProcessing(false);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Leer Correos desde CSV y Enviar Emails</h1>

      {/* Subir archivo CSV */}
      <input type="file" accept=".csv" onChange={handleFileUpload} />

      {/* Mostrar cantidad de registros cargados */}
      {csvData.length > 0 && (
        <p className="text-sm text-gray-700">
          {csvData.length} registros cargados en memoria.
        </p>
      )}

      {/* Botón para enviar correos */}
      <Button onClick={sendEmails} disabled={processing || csvData.length === 0}>
        {processing ? 'Enviando...' : 'Enviar Emails'}
      </Button>

      {/* Mostrar resultado */}
      {status && <p className="mt-2 text-sm text-gray-700">{status}</p>}
    </div>
  );
}
