'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner'
import { supabase } from '@/lib/supabase'

interface ScanQRTabProps {
  eventId: number
  eventDate: string
}

export function ScanQRTab({ eventId, eventDate }: ScanQRTabProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [eventPassed, setEventPassed] = useState(false)

  useEffect(() => {
    checkCameraPermission()
  }, [])

  useEffect(() => {
    const now = new Date()
    const eventDateTime = new Date(eventDate)
    //eventDateTime.setHours(eventDateTime.getHours() + 3);

    setEventPassed(now > eventDateTime)
  }, [eventDate])

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      setHasPermission(true)
    } catch (err) {
      console.error('Error checking camera permission:', err)
      setHasPermission(false)
    }
  }

  const startScanning = () => {
    setIsScanning(true)
    setScannedData(null)
  }

  const stopScanning = () => {
    setIsScanning(false)
  }

  const handleScan = async (result: IDetectedBarcode[]) => {
    if (result && result.length > 0) {
      const barcodeText = result[0].rawValue;  
      console.log('QR Code scanned:', barcodeText, eventId)
      setScannedData(barcodeText)  
      stopScanning()

      const [prefix, id] = barcodeText.split('-');
      if(prefix ==='I'){

        const { data: guestData, error: guestError } = await supabase
          .from('guest')
          .select('id')
          .eq('executive_id', id);

        if (guestError) {
          console.error('Error obteniendo guest_id:', guestError);
          return;
        }

        const guestIds = guestData.map(guest => guest.id);
        
        const { error } = await supabase
        .from('event_guest')
        .update({ assisted: true })
        .eq('event_id', eventId)
        .in('guest_id', guestIds);
      
        if (error) {
          console.error('Error fetching guests:', error)
          return
        }

      }
      else if (prefix ==='E'){
        const { data: guestData, error: fetchError } = await supabase
        .from("event_guest")
        .select("email")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Error fetching external guest email:", fetchError);
        return;
      }

      const guestEmail = guestData?.email;
      if (!guestEmail) {
        console.error("No email found for external guest with ID:", id);
        return;
      }

      // Actualizar asistencia por email
      const { error: updateError } = await supabase
        .from("event_guest")
        .update({ assisted: true })
        .eq("event_id", eventId)
        .eq("email", guestEmail);

      if (updateError) {
        console.error("Error updating external guest by email:", updateError);
        return;
      }
    } else {
      console.log("Invalid QR code prefix or guest not found.");
    }
    }
  }

  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      console.error('Error scanning QR code:', error);
    } else {
      console.error('Unknown error scanning QR code:', error);
    }
  }
  
  if (eventPassed) {
    return (
      <div className="text-red-500 font-bold p-4 bg-red-100 border border-red-300 rounded">
        Advertencia: Ya paso la fecha del evento, no se puede subir QR.
      </div>
    )
  }

  if (hasPermission === false) {
    return <div className="text-red-500">Camera permission is required to scan QR codes.</div>
  }

  return (
    <div className="space-y-4">
      {isScanning ? (
        <div className="space-y-4">
          <Scanner
            onScan={(result) => handleScan(result)}
            onError={handleError}            
          />
          <Button onClick={stopScanning} className="w-full">Detener Escaneo</Button>
        </div>
      ) : (
        <Button onClick={startScanning} className="w-full">Iniciar Escaneso de QR</Button>
      )}
      {scannedData && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
          <p className="font-bold">Código QR escaneado:</p>
          <p>{scannedData}</p>
        </div>
      )}
    </div>
  )
}
