'use client'

import { useSearchParams } from 'next/navigation'

interface SearchParamsHandlerProps {
  children: (copyEventId: number | undefined, macroEventId: string | undefined) => React.ReactNode
}

export function SearchParamsHandler({ children }: SearchParamsHandlerProps) {
  const searchParams = useSearchParams()
  const copyEventId = searchParams.get('copyEventId')
  const macroEventId = searchParams.get('macroEventId');

  return <>{children(copyEventId ? Number(copyEventId) : undefined, macroEventId ? String(macroEventId) : undefined)}</>
}

