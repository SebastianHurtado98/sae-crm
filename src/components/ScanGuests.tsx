'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner'
import { supabase } from '@/lib/supabase'
import { oldQRMap } from './OldQRMap'

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

    const oneHourBefore = new Date(eventDateTime);
    oneHourBefore.setHours(eventDateTime.getHours() - 1);
  
    const oneHourAfter = new Date(eventDateTime);
    oneHourAfter.setHours(eventDateTime.getHours() + 1);
  
    setEventPassed(now < oneHourBefore || now > oneHourAfter);  
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

      const [prefix, qrData] = barcodeText.split('-');
      if(prefix ==='I'){

        const { data: guestData, error: guestError } = await supabase
          .from('guest')
          .select('id')
          .eq('executive_id', qrData);

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

        const guestEmail = oldQRMap.find(item => item["qr-id"] === qrData)?.correo;

      if (!guestEmail) {
        console.error("No email found for external guest with ID:", qrData);
        return;
      }

      const { data: guestData, error: guestError } = await supabase
        .from('guest_email_summary')
        .select('*')
        .or(`guest_email.eq.${guestEmail},executive_email.eq.${guestEmail}`);

      if (guestError) {
        console.error('Error obteniendo guest:', guestError);
        return;
      }

      if (!guestData || guestData.length === 0) {
        console.warn('No se encontró ningún invitado con el QR proporcionado.');
        return;
      }

      const existingGuest = guestData.find(guest => guest.event_id === eventId);
      if (!existingGuest) {        
        const { data: newGuest, error: createError } = await supabase
          .from('event_guest')
          .insert([
            { 
              event_id: eventId,
              assisted: true, 
              guest_id: guestData[0].guest_id
            }  
          ])
          .select();
    
        if (createError) {
          console.error('Error creando event_guest:', createError);
          return;
        }
    
        console.log('Nuevo event_guest creado:', newGuest);
      } else {          
        const { data: updatedGuest, error: updateError } = await supabase
          .from('event_guest')
          .update({ assisted: true }) 
          .eq('id', existingGuest.event_guest_id)
          .select();
    
        if (updateError) {
          console.error('Error actualizando event_guest:', updateError);
          return;
        }
    
        console.log('event_guest actualizado:', updatedGuest);
      }

      
    } else if (prefix ==='C'){

      const { data: guestData, error: guestError } = await supabase
        .from('guest_email_summary')
        .select('*')
        .or(`guest_email.eq.${qrData},executive_email.eq.${qrData}`);

      if (guestError) {
        console.error('Error obteniendo guest:', guestError);
        return;
      }

      if (!guestData || guestData.length === 0) {
        console.warn('No se encontró ningún invitado con el QR proporcionado.');
        return;
      }

      const existingGuest = guestData.find(guest => guest.event_id === eventId);
      if (!existingGuest) {        
        const { data: newGuest, error: createError } = await supabase
          .from('event_guest')
          .insert([
            { 
              event_id: eventId,
              assisted: true, 
              guest_id: guestData[0].guest_id
            }  
          ])
          .select();
    
        if (createError) {
          console.error('Error creando event_guest:', createError);
          return;
        }
    
        console.log('Nuevo event_guest creado:', newGuest);
      } else {          
        const { data: updatedGuest, error: updateError } = await supabase
          .from('event_guest')
          .update({ assisted: true }) 
          .eq('id', existingGuest.event_guest_id)
          .select();
    
        if (updateError) {
          console.error('Error actualizando event_guest:', updateError);
          return;
        }
    
        console.log('event_guest actualizado:', updatedGuest);
      }

    }
    else {
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
  

  if (hasPermission === false) {
    return <div className="text-red-500">Camera permission is required to scan QR codes.</div>
  }

  return (
    <div className="space-y-4">
      { eventPassed && (
      <div className="text-red-500 font-bold p-4 bg-red-100 border border-red-300 rounded">
        Advertencia: No es la fecha y hora del evento.
      </div>
      )}
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
