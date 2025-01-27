'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ListFormProps = {
  listId?: number;
  macroEventId?: string;
};

type MacroEvent = {
    id: number
    name: string
}

export function ListForm({ listId, macroEventId: initialMacroEventId }: ListFormProps) {
    const [name, setName] = useState('');
    const [macroEventId, setMacroEventId] = useState(initialMacroEventId || '')
    const [macroEvents, setMacroEvents] = useState<MacroEvent[]>([])
    const router = useRouter();

    const fetchMacroEvent = useCallback(async () => {
        const { data, error } = await supabase
          .from('macro_event')
          .select('id, name')
    
        if (error) {
          console.error('Error fetching macro_event:', error)
        } else {
          setMacroEvents(data || [])
        }
    }, [])

    const fetchList = useCallback(async () => {
        if (!listId) return
        const { data, error } = await supabase
        .from('list')
        .select('*')
        .eq('id', listId)
        .single()

        if (error) {
        console.error('Error fetching list:', error)
        } else if (data) {
        setName(data.name)
        setMacroEventId(data.macro_event_id?.toString() || '')
        }
    }, [listId])

    useEffect(() => {
        fetchMacroEvent()
        if (listId) {
        fetchList()
        }
    }, [listId, fetchList])


    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const list = { name, macro_event_id: macroEventId};

        if (listId) {
        const { error } = await supabase
            .from('list')
            .update(list)
            .eq('id', listId);

        if (error) {
            console.error('Error updating list:', error);
        } else {
            router.push('/macro-eventos');
        }
        } else {
        const { error } = await supabase
            .from('list')
            .insert([list]);

        if (error) {
            console.error('Error creating list:', error);
        } else {
            router.push('/macro-eventos');
        }
        }
    }

    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <Label htmlFor="macroEventId">Macro Evento</Label>
            <Select value={macroEventId} onValueChange={setMacroEventId}>
            <SelectTrigger>
                <SelectValue placeholder="Selecciona un macro evento" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="0">Otro</SelectItem>
                {macroEvents.map((macroEvent) => (
                <SelectItem key={macroEvent.id} value={macroEvent.id.toString()}>
                    {`${macroEvent.name}`}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
        <div>
            <Label htmlFor="name">Nombre de la Lista</Label>
            <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            />
        </div>
        <Button type="submit">
            {listId ? 'Actualizar' : 'Agregar Nueva Lista'}
        </Button>
        </form>
    );
}
