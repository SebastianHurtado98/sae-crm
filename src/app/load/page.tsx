'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';

export default function RegisterGuestsPage() {
  const [csvData, setCsvData] = useState<{ email: string }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [matchingCount, ] = useState<number | null>(null);

  // Cargar datos desde el CSV
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

  // Actualizar los datos en Supabase
  const updateDataInDatabase = async () => {
    if (csvData.length === 0) {
      console.log("No hay datos cargados en memoria.");
      return;
    }

    const dataToUpdate = csvData.slice(0, 800); // Tomar los primeros 500 para actualizar
    console.log("Actualizando los siguientes registros:", dataToUpdate);
    setProcessing(true);
    setStatus("Actualizando datos en la base de datos...");

    try {
      for (const entry of dataToUpdate) {

        const { error: updateError } = await supabase
          .from("executive")
          .update({
            active: true,
          })
          .eq("email", entry.email);

        if (updateError) {
          console.error("❌");
        } else {
          console.log("Actualización");
        }
      }

      setStatus(`Se actualizaron ${dataToUpdate.length} registros.`);
      console.log("🔥 Actualización completada.");
    } catch (error) {
      console.error("Error en la actualización de Supabase:", error);
      setStatus("Error en la actualización.");
    }

    setProcessing(false);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Registrar Invitados desde CSV</h1>

      {/* Subir archivo CSV */}
      <input type="file" accept=".csv" onChange={handleFileUpload} />

      {/* Mostrar cantidad de registros cargados */}
      {csvData.length > 0 && (
        <p className="text-sm text-gray-700">
          {csvData.length} registros cargados en memoria.
        </p>
      )}

      {/* Botón para actualizar en Supabase */}
      <Button onClick={updateDataInDatabase} disabled={processing || csvData.length === 0}>
        {processing ? 'Actualizando...' : 'Actualizar en Base de Datos'}
      </Button>

      {/* Mostrar resultado */}
      {status && <p className="mt-2 text-sm text-gray-700">{status}</p>}
      {matchingCount !== null && <p className="text-sm text-green-700">Correos encontrados: {matchingCount}</p>}
    </div>
  );
}
