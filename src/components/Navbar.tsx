"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/LOGOblanco.jpg"
                alt="SAE Logo"
                width={100}
                height={40}
                priority
              />
            </Link>
          </div>

          {/* Botón del menú hamburguesa (visible solo en dispositivos pequeños) */}
          <div className="sm:hidden ml-auto">
            <Button
              variant="ghost"
              onClick={() => setIsOpen((prev) => !prev)}
              className="text-white"
            >
              {isOpen ? <AiOutlineClose size={24} /> : <AiOutlineMenu size={24} />}
            </Button>
          </div>

          {/* Menú horizontal (visible solo en dispositivos grandes) */}
          <div className="hidden sm:flex overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Button variant="ghost" asChild>
              <Link href="/empresas">Empresas</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/usuarios">Usuarios</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/secretarias">Secretarias</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/membresias">Membresías</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/consultas">Consultas</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/presentaciones">Presentaciones</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/proyectos">Proyectos</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/eventos-nuevo">Eventos</Link>
            </Button>
          </div>
        </div>

        {/* Menú desplegable (visible solo en móviles) */}
        {isOpen && (
          <div className="sm:hidden flex flex-col space-y-2 mt-4">
            <Button variant="ghost" asChild>
              <Link href="/empresas">Empresas</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/usuarios">Usuarios</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/secretarias">Secretarias</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/membresias">Membresías</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/consultas">Consultas</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/presentaciones">Presentaciones</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/proyectos">Proyectos</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/eventos-nuevo">Eventos</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
