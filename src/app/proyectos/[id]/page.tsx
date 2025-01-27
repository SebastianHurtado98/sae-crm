'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'

type Project = {
  id: number
  project_code: string
  company_id: number
  executive_id: number
  other_executive: boolean
  other_fullname: string | null
  other_email: string | null
  assignee: string[]
  start_date: string
  end_date: string
  status: string
  comments: string
  company: {
    razon_social: string
  }
  executive: {
    name: string
    last_name: string
    position: string
  }
}

export default function ProjectDetailsPage() {
  const [project, setProject] = useState<Project | null>(null)
  const params = useParams()

  const fetchProject = useCallback(async () => {
    if (typeof params?.id !== 'string') return
    const { data, error } = await supabase
      .from('project')
      .select(`
        *,
        company:company_id (razon_social),
        executive:executive_id (name, last_name, position)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
    } else {
      setProject(data)
    }
  }, [params?.id])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  if (!project) return <div>Loading...</div>

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Detalles del proyecto</h1>
        <div className="space-x-2">
          <Button variant="outline" asChild>
            <Link href="/proyectos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/proyectos/${project.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 ">
                <h3 className="text-xl font-semibold">Información General</h3>
                <p className="flex items-center">
                  Empresa: {project.company.razon_social}
                </p>
                <p className="flex items-center">
                  Código: {project.project_code}
                </p>
                {project.other_executive ?
                  (<p> Solicitante: {project.other_fullname}</p>) :
                  (<p> Solicitante: {`${project.executive.name} ${project.executive.last_name}`}</p>)}
                {project.other_executive ?
                  (<p>Cargo del solicitante: No disponible</p>) :
                  (<p>Cargo del solicitante: {project.executive.position}</p>)}
                <p className="flex items-center">
                Status: {project.status}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Fechas</h3>
                <p className="flex items-center">
                Fecha de ingreso: {project.start_date}
                </p>
                <p className="flex items-center">
                Fecha de cierre: {project.end_date || 'No especificada'}
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 ">
                <h3 className="text-xl font-semibold">Responsables</h3>
                <p className="flex items-center">
                {project.assignee.join(', ')}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Comentarios</h3>
                <p className="flex items-center">
                {project.comments}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}