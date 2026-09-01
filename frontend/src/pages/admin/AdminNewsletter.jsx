import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, Mail } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { adminAxios } from './adminApi';

export const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAxios.get('/admin/newsletter');
      setSubscribers(res.data.subscribers || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deleteSub = async (id) => {
    if (!window.confirm('¿Eliminar este suscriptor?')) return;
    try {
      await adminAxios.delete(`/admin/newsletter/${id}`);
      setSubscribers(subscribers.filter(s => s.id !== id));
    } catch (e) { console.error(e); }
  };

  const exportCSV = () => {
    const csv = ['email,subscribed_at,active', ...subscribers.map(s => `${s.email},${s.subscribed_at},${s.active}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geifem-newsletter-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6" data-testid="admin-newsletter">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#003057]">Newsletter</h1>
          <p className="text-gray-600 mt-1">{subscribers.length} suscriptores</p>
        </div>
        {subscribers.length > 0 && (
          <Button onClick={exportCSV} variant="outline" data-testid="export-csv-btn">
            Exportar CSV
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600"><Loader2 className="animate-spin" size={18}/> Cargando...</div>
      ) : subscribers.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-gray-500">No hay suscriptores aún</CardContent></Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Suscripción</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="border-b hover:bg-gray-50" data-testid={`sub-${sub.id}`}>
                    <td className="px-6 py-4 text-sm text-[#003057] font-medium flex items-center gap-2">
                      <Mail size={14} className="text-[#CBA55A]" />
                      {sub.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sub.subscribed_at).toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => deleteSub(sub.id)} className="text-red-500" data-testid={`delete-sub-${sub.id}`}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
