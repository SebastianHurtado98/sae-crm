'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { toast } from "@/hooks/use-toast"

export function ImportExternals({ listId }: { listId: number }) {
  const [file, setFile] = useState<File | null>(null)

  // Manejadores para drag and drop
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
      setFile(e.target.files[0])
    }
  }

  // Función para descargar la plantilla
  const downloadTemplate = () => {
    const headers = [
      ['Empresa', 'Nombre', 'Apellido', 'Correo', 'Cargo', 
        'Tipo de usuario', 'Tipo de membresia'],
    ]

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(headers)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla')

    XLSX.writeFile(workbook, 'plantilla_invitados_externos.xlsx')
  }

  // Función para cargar el archivo a Supabase
  const handleFileUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor, seleccione un archivo Excel para cargar.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'array' })

      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Array<{
        Empresa: string
        Nombre: string
        Apellido: string
        Correo: string
        Cargo: string
        'Tipo de usuario': string
        'Tipo de membresia': string
      }>

      const guests = jsonData.map((row) => ({
        list_id: listId,
        company_razon_social: row.Empresa,
        name: row.Nombre.trim() + ' ' + row.Apellido.trim(),
        email: row.Correo.toLowerCase().trim(),
        position: row.Cargo,
        tipo_usuario: row['Tipo de usuario'],
        tipo_membresia: row['Tipo de membresia'],        
        is_user: false,
        is_client_company: false
      }))
      

      const { error } = await supabase
        .from('guest')
        .upsert(guests)

      if (error) {
        console.error('Error uploading event guests:', error)
        toast({
          title: "Error",
          description: "Hubo un problema al cargar los invitados externos.",
          variant: "destructive",
        })
      } else {
        console.log('Event guests uploaded successfully!')
        toast({
          title: "Éxito",
          description: "Los invitados externos se han cargado correctamente.",
        })
        setFile(null)
      }
    }

    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="space-y-4">
      <Button onClick={downloadTemplate}>Descargar Plantilla Excel</Button>

      {/* Envolvemos el área de drag-and-drop en un label */}
      <label
        htmlFor="excel-upload"
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer block"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <p>Arrastra y suelta un archivo Excel aquí, o haz clic para seleccionar un archivo</p>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".xlsx, .xls"
          className="hidden"
          id="excel-upload"
        />
      </label>

      {file && <p>Archivo seleccionado: {file.name}</p>}

      <Button onClick={handleFileUpload} disabled={!file}>
        Importar Excel
      </Button>
    </div>
  )
}
