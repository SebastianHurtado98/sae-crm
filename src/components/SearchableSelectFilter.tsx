'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "@/lib/utils"

type Company = {
  id: number
  razon_social: string
}

type SearchableSelectFilterProps = {
  onSelect: (value: string) => void
  label: string
}

export function SearchableSelectFilter({ onSelect, label }: SearchableSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null) // Update 1
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

    query = query.limit(10)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching companies:', error)
    } else {
      setCompanies(data || [])
    }
  }

  const handleSelect = (company: Company | null) => { // Update 2
    setSelectedCompany(company || null)
    onSelect(company ? company.id.toString() : 'all')
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
        {selectedCompany ? selectedCompany.razon_social : "Todos"} {/* Update 3 */}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {isOpen && (
        <div className="absolute mt-1 w-full z-10 bg-white border border-gray-300 rounded-md shadow-lg">
          <Input
            type="text"
            placeholder={`Buscar ${label.toLowerCase()}...`}
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