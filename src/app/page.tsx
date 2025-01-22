import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building, Users, UserCircle, FileQuestion, PresentationIcon, FolderKanban, DollarSign, Lightbulb } from 'lucide-react'

const sections = [
  {
    title: 'Empresas',
    description: 'Gestiona las empresas registradas en el sistema.',
    icon: Building,
    viewAllLink: '/empresas',
    addLink: '/empresas/new'
  },
  {
    title: 'Usuarios',
    description: 'Administra los usuarios de las empresas.',
    icon: Users,
    viewAllLink: '/usuarios',
    addLink: '/usuarios/new'
  },
  {
    title: 'Secretarias',
    description: 'Gestiona las secretarias de los usuarios.',
    icon: UserCircle,
    viewAllLink: '/secretarias',
    addLink: '/secretarias/new'
  },
  {
    title: 'Membresías',
    description: 'Gestiona las membresías de las empresas.',
    icon: DollarSign,
    viewAllLink: '/membresias',
    addLink: '/membresias/new'
  },
  {
    title: 'Consultas',
    description: 'Administra las consultas realizadas.',
    icon: FileQuestion,
    viewAllLink: '/consultas',
    addLink: '/consultas/new'
  },
  {
    title: 'Presentaciones',
    description: 'Gestiona las presentaciones programadas.',
    icon: PresentationIcon,
    viewAllLink: '/presentaciones',
    addLink: '/presentaciones/new'
  },
  {
    title: 'Proyectos',
    description: 'Administra los proyectos en curso.',
    icon: FolderKanban,
    viewAllLink: '/proyectos',
    addLink: '/proyectos/new'
  },
  {
    title: 'Eventos',
    description: 'Administra los eventos virtuales y presenciales. Añade asistentes a tus eventos.',
    icon: Lightbulb,
    viewAllLink: '/eventos-nuevo',
    addLink: '/eventos-nuevo/new'
  }
]

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-12 text-center">Bienvenido a la aplicación del SAE de Apoyo Consultoría</h1>
      <div className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => (
            <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <section.icon className="h-6 w-6 text-600" />
                  <CardTitle className="text-xl font-semibold">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">{section.description}</CardDescription>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={section.viewAllLink}>Ver todos</Link>
                </Button>
                <Button asChild>
                  <Link href={section.addLink}>Agregar</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}