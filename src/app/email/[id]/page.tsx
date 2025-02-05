'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { EmailTable } from '@/components/EmailTable'

type List = {
  id: number
  name: string
  macro_event_id: number
}

export default function EventDetailPage({ params }: { params: Promise<{ id: number }> }) {
  const resolvedParams = use(params);
  const [list, setList] = useState<List>()

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {    
    const { data, error } = await supabase
      .from('list')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (error) {
      console.error('Error fetching list:', error);
    } else {
      console.log("List", data)
      setList(data)
    }

  }


  return (
    <div className="container mx-auto py-10">
      <h1 className="text-xl font-bold mb-6">{list?.name}</h1>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
            </div>
            <EmailTable listId={resolvedParams.id} />
          </div>
    </div>
  );
}
