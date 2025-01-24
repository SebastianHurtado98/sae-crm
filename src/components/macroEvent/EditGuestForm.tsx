'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox"
import Link from 'next/link';

interface EditGuestFormProps {
  guestId: number;
  eventId?: number | null;
  onComplete: () => void;
}

export function EditGuestForm({ guestId, eventId, onComplete }: EditGuestFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    tipo_usuario: '',
    tipo_membresia: '',
    is_user: false,
    executive_id: null,
  });
  const [eventData, setEventData] = useState({
    registrado: false,
    asistio: false,
  });

  useEffect(() => {
    fetchGuest();
    if (eventId) {
      fetchEventGuest();
    }
  }, [guestId, eventId]);

  async function fetchGuest() {
    const { data, error } = await supabase
      .from('guest')
      .select(
        'name, email, position, tipo_usuario, tipo_membresia, is_user, executive_id'
      )
      .eq('id', guestId)
      .single();

    if (error) {
      console.error('Error fetching guest:', error);
    } else if (data) {
      setFormData(data);
    }
  }

  async function fetchEventGuest() {
    const { data, error } = await supabase
      .from('event_guest')
      .select('registered, assisted')
      .eq('guest_id', guestId)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching event guest:', error);
    }
    
      if (data?.length === 0) {
      setEventData({ registrado: false, asistio: false });
      } else if (data) {
        handleEventChange('registrado', data[0].registered);
        handleEventChange('asistio', data[0].assisted);
      }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const guestUpdate = supabase
      .from('guest')
      .update({
        name: formData.name,
        email: formData.email,
        position: formData.position,
        tipo_usuario: formData.tipo_usuario,
        tipo_membresia: formData.tipo_membresia,
      })
      .eq('id', guestId);

    let eventGuestUpdate;
    if (eventId) {
      const { data, error } = await supabase
        .from('event_guest')
        .select('*')
        .eq('guest_id', guestId)
        .eq('event_id', eventId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Crear nueva entrada si no existe
        eventGuestUpdate = supabase.from('event_guest').insert({
          guest_id: guestId,
          event_id: eventId,
          registered: eventData.registrado,
          assisted: eventData.asistio,
        });
      } else if (!error && data) {
        // Actualizar si ya existe
        eventGuestUpdate = supabase.from('event_guest').update({
          registered: eventData.registrado,
          assisted: eventData.asistio,
        }).eq('guest_id', guestId).eq('event_id', eventId);
      }
    }

    const [guestError, eventError] = await Promise.all([guestUpdate, eventGuestUpdate]);

    if (guestError?.error || eventError?.error) {
      console.error('Error updating data:', guestError?.error || eventError?.error);
    } else {
      onComplete();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleEventChange(name: string, checked: boolean) {
    setEventData((prev) => ({ ...prev, [name]: checked }));
  }

  return (
    <div>
      {formData.is_user && formData.executive_id && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-sm text-yellow-700">
            Este usuario fue importado desde el sistema. Edita el resto de su información desde su perfil. {' '}
            <Link 
              href={`https://sae-crm.vercel.app/usuarios/${formData.executive_id}`}
              target="_blank"
              className="underline text-blue-600 hover:text-blue-800"
            >
               Ver perfil
            </Link>
          </p>
        </div>
      )}
    {eventId && (
        <div className="mb-4 space-y-4">
          <div>
            <Label htmlFor="registrado">Registrado {' '}</Label>
            <Checkbox 
              checked={eventData.registrado} 
              onCheckedChange={(checked) => handleEventChange('registrado', checked as boolean)} 
            />
          </div>
          <div>
            <Label htmlFor="asistio">Asistió {' '}</Label>
            <Checkbox 
              checked={eventData.asistio} 
              onCheckedChange={(checked) => handleEventChange('asistio', checked as boolean)} 
            />
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {formData.is_user && formData.executive_id ? (
          null
        ) : (
          <div>
          <div>
          <Label htmlFor="name">Nombre y apellido</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={!!(formData.is_user && formData.executive_id)}
          />
        </div>
        <div>
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={!!(formData.is_user && formData.executive_id)}
          />
        </div>
        <div>
          <Label htmlFor="position">Posición</Label>
          <Input
            id="position"
            name="position"
            type="text"
            value={formData.position}
            onChange={handleChange}
            disabled={!!(formData.is_user && formData.executive_id)}
          />
        </div>
        <div>
          <Label htmlFor="tipo_usuario">Tipo de Usuario</Label>
          <Input
            id="tipo_usuario"
            name="tipo_usuario"
            type="text"
            value={formData.tipo_usuario}
            onChange={handleChange}
            disabled={!!(formData.is_user && formData.executive_id)}
          />
        </div>
        <div>
          <Label htmlFor="tipo_membresia">Tipo de Membresía</Label>
          <Input
            id="tipo_membresia"
            name="tipo_membresia"
            type="text"
            value={formData.tipo_membresia}
            onChange={handleChange}
            disabled={!!(formData.is_user && formData.executive_id)}
          />
        </div>
          </div>
        )
          }
        <Button type="submit">Actualizar</Button>
      </form>
    </div>
  );
}
