'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditGuestFormProps {
  guestId: number;
  onComplete: () => void;
}

export function EditGuestForm({ guestId, onComplete }: EditGuestFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    tipo_usuario: '',
    tipo_membresia: '',
  });

  useEffect(() => {
    fetchGuest();
  }, [guestId]);

  async function fetchGuest() {
    const { data, error } = await supabase
      .from('guest')
      .select(
        'name, email, position, tipo_usuario, tipo_membresia'
      )
      .eq('id', guestId)
      .single();

    if (error) {
      console.error('Error fetching guest:', error);
    } else if (data) {
      setFormData(data);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase
      .from('guest')
      .update(formData)
      .eq('id', guestId);

    if (error) {
      console.error('Error updating guest:', error);
    } else {
      onComplete();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre y apellido</Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          required
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
        />
      </div>
      <Button type="submit">Actualizar</Button>
    </form>
  );
}
