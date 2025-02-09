'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { toast } from "@/hooks/use-toast"
import { userTypes } from '../UserTypeSelector'
import { membershipTypes } from '../MembershipTypeSelector'
import ExcelJS from "exceljs"

export function ImportExternals({ listId }: { listId: number }) {
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<string[]>([])

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
  const downloadTemplate = async () => {
    const headers = ['Empresa', 'Nombre', 'Apellido', 'Correo', 'Cargo', 
        'Tipo de usuario', 'Tipo de membresia']

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Plantilla")
    worksheet.addRow(headers)

    worksheet.getCell('F2').dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${userTypes.join(',')}"`]
    };

    worksheet.getCell('G2').dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${membershipTypes.join(',')}"`]
    };

    worksheet.getCell("F2").dataValidation.error = "Please select a valid user type"
    worksheet.getCell("G2").dataValidation.error = "Please select a valid membership type"

    for (let i = 3; i <= 100; i++) {
      worksheet.getCell(`F${i}`).dataValidation = worksheet.getCell("F2").dataValidation
      worksheet.getCell(`G${i}`).dataValidation = worksheet.getCell("G2").dataValidation
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const link = document.createElement("a")
    link.href = window.URL.createObjectURL(blob)
    link.download = "plantilla_invitados_externos.xlsx"
    link.click()  
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

      const newErrors: string[] = []
      const guests = jsonData.map((row) => {
        const userType = userTypes.find((type) => type.toLowerCase() === row["Tipo de usuario"].toLowerCase().trim())
        const membershipType = membershipTypes.find((type) => type.toLowerCase() === row["Tipo de membresia"].toLowerCase().trim())

        if (!userType) {
          newErrors.push(`Error en el correo ${row.Correo}: Tipo de usuario "${row["Tipo de usuario"]}" no válido. `)
        }
        if (!membershipType && row["Tipo de membresia"].trim() !== '') {
          newErrors.push(`Error en el correo ${row.Correo}: Tipo de membresía "${row["Tipo de membresia"]}" no válido. `)
        }

        return {
        list_id: listId,
        company_razon_social: row.Empresa,
        name: row.Nombre.trim() + ' ' + row.Apellido.trim(),
        email: row.Correo.toLowerCase().trim(),
        position: row.Cargo,
        tipo_usuario: userType || row['Tipo de usuario'],
        tipo_membresia: membershipType || row['Tipo de membresia'],        
        is_user: false,
        is_client_company: false
        }
      })

      
      if (newErrors.length > 0) {
        setErrors(newErrors)
        return
      }

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
        setErrors([])
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
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error en el excel</h3>
          <ul className="list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index} className="text-red-700">
                {error}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-red-700">Tipos de usuario válidos: {userTypes.join(", ")}</p>
          <p className="text-red-700">Tipos de membresía válidos: {membershipTypes.join(", ")}</p>
        </div>
      )}
    </div>
  )
}
