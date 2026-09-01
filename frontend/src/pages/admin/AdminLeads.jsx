import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, Mail, Phone, Building2, Calendar, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { adminAxios } from './adminApi';

const STATUS_LABELS = {
  new: { label: 'Nuevo', className: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Contactado', className: 'bg-yellow-100 text-yellow-800' },
  converted: { label: 'Convertido', className: 'bg-green-100 text-green-800' },
  archived: { label: 'Archivado', className: 'bg-gray-100 text-gray-600' },
};

const SERVICIO_LABELS = {
  consultoria: 'Consultoría Empresarial',
  capacitacion: 'Capacitación Empresarial',
  emprende: 'Plan Emprende',
  crece: 'Plan Crece',
  escala: 'Plan Escala',
  otro: 'Otro',
};

export const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);

  const loadLeads = async (status = null) => {
    setLoading(true);
    try {
      const params = status && status !== 'all' ? { status } : {};
      const res = await adminAxios.get('/admin/contacts', { params });
      setLeads(res.data.contacts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeads(filter); }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await adminAxios.patch(`/admin/contacts/${id}`, { status });
      setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
      if (selectedLead?.id === id) setSelectedLead({ ...selectedLead, status });
    } catch (e) { console.error(e); }
  };

  const deleteLead = async (id) => {
    if (!window.confirm('¿Eliminar este contacto?')) return;
    try {
      await adminAxios.delete(`/admin/contacts/${id}`);
      setLeads(leads.filter(l => l.id !== id));
      if (selectedLead?.id === id) setSelectedLead(null);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6" data-testid="admin-leads">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#003057]">Leads / Contactos</h1>
          <p className="text-gray-600 mt-1">{leads.length} contactos {filter !== 'all' ? `(${STATUS_LABELS[filter]?.label})` : 'totales'}</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48" data-testid="filter-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="new">Nuevos</SelectItem>
            <SelectItem value="contacted">Contactados</SelectItem>
            <SelectItem value="converted">Convertidos</SelectItem>
            <SelectItem value="archived">Archivados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600"><Loader2 className="animate-spin" size={18}/> Cargando leads...</div>
      ) : leads.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-gray-500">No hay contactos aún</CardContent></Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* List */}
          <div className="space-y-3">
            {leads.map((lead) => (
              <Card
                key={lead.id}
                className={`cursor-pointer transition-all border-0 ${selectedLead?.id === lead.id ? 'ring-2 ring-[#CBA55A] shadow-lg' : 'shadow-md hover:shadow-lg'}`}
                onClick={() => setSelectedLead(lead)}
                data-testid={`lead-${lead.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#003057] truncate">{lead.nombre}</div>
                      <div className="text-sm text-gray-500 truncate">{lead.email}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(lead.created_at).toLocaleString('es-CO')}</div>
                    </div>
                    <Badge className={STATUS_LABELS[lead.status]?.className || ''}>
                      {STATUS_LABELS[lead.status]?.label || lead.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:sticky lg:top-24 h-fit">
            {selectedLead ? (
              <Card className="border-0 shadow-lg" data-testid="lead-detail">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-[#003057]">{selectedLead.nombre}</h2>
                      <Badge className={`mt-2 ${STATUS_LABELS[selectedLead.status]?.className}`}>
                        {STATUS_LABELS[selectedLead.status]?.label}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteLead(selectedLead.id)} data-testid="lead-delete">
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-[#CBA55A]" />
                      <a href={`mailto:${selectedLead.email}`} className="text-[#1E5A75] hover:underline">{selectedLead.email}</a>
                    </div>
                    {selectedLead.telefono && (
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-[#CBA55A]" />
                        <a href={`tel:${selectedLead.telefono}`} className="text-[#1E5A75] hover:underline">{selectedLead.telefono}</a>
                      </div>
                    )}
                    {selectedLead.empresa && (
                      <div className="flex items-center gap-3">
                        <Building2 size={16} className="text-[#CBA55A]" />
                        <span className="text-gray-700">{selectedLead.empresa}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-[#CBA55A]" />
                      <span className="text-gray-700">{SERVICIO_LABELS[selectedLead.servicio] || selectedLead.servicio}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 flex items-center gap-2">
                      <MessageCircle size={14} /> Mensaje
                    </div>
                    <div className="bg-gray-50 p-4 rounded border-l-4 border-[#CBA55A] text-gray-700 text-sm whitespace-pre-wrap">
                      {selectedLead.mensaje}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Cambiar estado</div>
                    <Select value={selectedLead.status} onValueChange={(v) => updateStatus(selectedLead.id, v)}>
                      <SelectTrigger data-testid="lead-status-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Nuevo</SelectItem>
                        <SelectItem value="contacted">Contactado</SelectItem>
                        <SelectItem value="converted">Convertido</SelectItem>
                        <SelectItem value="archived">Archivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-gray-200">
                <CardContent className="p-12 text-center text-gray-500">
                  Seleccione un lead para ver los detalles
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
