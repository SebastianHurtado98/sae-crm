'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MacroEventFormProps = {
  macroEventId?: number;
};

export function MacroEventForm({ macroEventId }: MacroEventFormProps) {
    const [name, setName] = useState('');
    const router = useRouter();

    const fetchEvent = useCallback(async () => {
        if (!macroEventId) return
        const { data, error } = await supabase
        .from('macro_event')
        .select('*')
        .eq('id', macroEventId)
        .single()

        if (error) {
        console.error('Error fetching event:', error)
        } else if (data) {
        setName(data.name)
        }
    }, [macroEventId])

    useEffect(() => {
        if (macroEventId) {
        fetchEvent()
        }
    }, [macroEventId, fetchEvent])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const macroEvent = { name };

        if (macroEventId) {
        const { error } = await supabase
            .from('macro_event')
            .update(macroEvent)
            .eq('id', macroEventId);

        if (error) {
            console.error('Error updating macro event:', error);
        } else {
            router.push('/eventos-nuevo');
        }
        } else {
        const { error } = await supabase
            .from('macro_event')
            .insert([macroEvent]);

        if (error) {
            console.error('Error creating macro event:', error);
        } else {
            router.push('/eventos-nuevo');
        }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <Label htmlFor="name">Nombre del Macro Evento</Label>
            <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            />
        </div>
        <Button type="submit">
            {macroEventId ? 'Actualizar' : 'Agregar Nuevo Macro Evento'}
        </Button>
        </form>
    );
}
