'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "@/lib/utils"

type Selectable = {
  id: number
  razon_social: string
}

type SearchableSelectFilterProps = {
  onSelect: (value: string) => void
  guestsName: string[]
}

export function SearchableSelectFilterGuestCompany({ onSelect, guestsName }: SearchableSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [companies, setCompanies] = useState<Selectable[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Selectable | null>(null) // Update 1
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCompanies()
  }, [search])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  async function fetchCompanies() {
    let query = supabase
      .from('company')
      .select('id, razon_social')
      .order('razon_social', { ascending: true })

    if (search) {
      query = query.ilike('razon_social', `%${search}%`)
    }

    query = query.limit(5)

    const { data: companyData, error } = await query

    if (error) {
      console.error('Error fetching companies:', error)
      return
    } 
    
    const filteredGuests = guestsName
      .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5)
      .map((name) => ({
        id: -Math.floor(Math.random() * 1000000), // Random negative ID
        razon_social: name,
    }))
    
    const combinedData = [...(companyData || []), ...filteredGuests]
    
    setCompanies(combinedData || [])
    
  }

  const handleSelect = (company: Selectable | null) => { // Update 2
    setSelectedCompany(company || null)
    onSelect(company ? company.razon_social.toString() : 'all')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between"
      >
        {selectedCompany ? selectedCompany.razon_social : "Buscar empresa o invitado"} {/* Update 3 */}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {isOpen && (
        <div className="absolute mt-1 w-full z-10 bg-white border border-gray-300 rounded-md shadow-lg">
          <Input
            type="text"
            placeholder={`Buscar empresa o invitado ...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2"
          />
          <ul className="max-h-60 overflow-auto">
            <li
              onClick={() => handleSelect(null)}
              className={cn(
                "px-2 py-1 cursor-pointer hover:bg-gray-100",
                !selectedCompany && "bg-blue-100"
              )}
            >
              <div className="flex items-center">
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !selectedCompany ? "opacity-100" : "opacity-0"
                  )}
                />
                Todos
              </div>
            </li>
            {companies.length === 0 ? (
              <li className="px-2 py-1 text-gray-500">No se encontraron resultados.</li>
            ) : (
              companies.map((company) => (
                <li
                  key={company.id}
                  onClick={() => handleSelect(company)}
                  className={cn(
                    "px-2 py-1 cursor-pointer hover:bg-gray-100",
                    selectedCompany?.id === company.id && "bg-blue-100"
                  )}
                >
                  <div className="flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCompany?.id === company.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {company.razon_social}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}