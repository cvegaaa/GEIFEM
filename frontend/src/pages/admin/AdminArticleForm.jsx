import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { adminAxios } from './adminApi';

export const AdminArticleForm = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    category: '',
    excerpt: '',
    content: '',
    image: '',
    author: 'Equipo GEIFEM',
    read_time: '5 min',
    published: true,
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isNew) {
      adminAxios.get(`/admin/articles/${id}`)
        .then(res => setForm({
          title: res.data.title || '',
          category: res.data.category || '',
          excerpt: res.data.excerpt || '',
          content: res.data.content || '',
          image: res.data.image || '',
          author: res.data.author || 'Equipo GEIFEM',
          read_time: res.data.read_time || '5 min',
          published: !!res.data.published,
        }))
        .catch(err => setError(err.response?.data?.detail || 'Error al cargar el artículo'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      if (isNew) {
        const res = await adminAxios.post('/admin/articles', form);
        setSuccess('Artículo creado exitosamente');
        setTimeout(() => navigate(`/admin/articles/${res.data.id}`), 800);
      } else {
        await adminAxios.patch(`/admin/articles/${id}`, form);
        setSuccess('Artículo actualizado');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Error al guardar el artículo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center gap-2 text-gray-600"><Loader2 className="animate-spin" size={18}/> Cargando...</div>;

  return (
    <div className="space-y-6 max-w-4xl" data-testid="admin-article-form">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/articles')} data-testid="back-btn">
          <ArrowLeft size={18} className="mr-2" /> Volver
        </Button>
        <h1 className="text-3xl font-bold text-[#003057]">
          {isNew ? 'Nuevo artículo' : 'Editar artículo'}
        </h1>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-800 text-sm rounded">{error}</div>}
            {success && <div className="p-3 bg-green-50 border-l-4 border-green-500 text-green-800 text-sm rounded" data-testid="save-success">{success}</div>}

            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Label htmlFor="title" className="text-[#003057] font-semibold">Título *</Label>
                <Input id="title" value={form.title} onChange={(e) => handleChange('title', e.target.value)} required data-testid="input-title" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="category" className="text-[#003057] font-semibold">Categoría *</Label>
                <Input id="category" value={form.category} onChange={(e) => handleChange('category', e.target.value)} placeholder="Ej. Estrategia Digital" required data-testid="input-category" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="read_time" className="text-[#003057] font-semibold">Tiempo de lectura</Label>
                <Input id="read_time" value={form.read_time} onChange={(e) => handleChange('read_time', e.target.value)} placeholder="5 min" data-testid="input-readtime" className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="image" className="text-[#003057] font-semibold">URL de imagen *</Label>
                <Input id="image" value={form.image} onChange={(e) => handleChange('image', e.target.value)} placeholder="https://..." required data-testid="input-image" className="mt-1" />
                {form.image && (
                  <img src={form.image} alt="Preview" className="mt-3 h-32 rounded object-cover" onError={(e) => { e.target.style.display='none'; }} />
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="excerpt" className="text-[#003057] font-semibold">Resumen (excerpt) *</Label>
                <Textarea id="excerpt" value={form.excerpt} onChange={(e) => handleChange('excerpt', e.target.value)} rows={2} required data-testid="input-excerpt" className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="content" className="text-[#003057] font-semibold">Contenido completo *</Label>
                <Textarea id="content" value={form.content} onChange={(e) => handleChange('content', e.target.value)} rows={12} required data-testid="input-content" className="mt-1 font-mono text-sm" placeholder="Contenido del artículo. Soporta texto plano o HTML." />
              </div>
              <div>
                <Label htmlFor="author" className="text-[#003057] font-semibold">Autor</Label>
                <Input id="author" value={form.author} onChange={(e) => handleChange('author', e.target.value)} data-testid="input-author" className="mt-1" />
              </div>
              <div className="flex items-center gap-3 pt-8">
                <Switch id="published" checked={form.published} onCheckedChange={(v) => handleChange('published', v)} data-testid="switch-published" />
                <Label htmlFor="published" className="text-[#003057] font-semibold cursor-pointer">
                  {form.published ? 'Publicado (visible al público)' : 'Borrador (oculto)'}
                </Label>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/articles')}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#CBA55A] hover:bg-[#b8944d] text-white" data-testid="save-btn">
                {saving ? <><Loader2 className="mr-2 animate-spin" size={16}/> Guardando...</> : <><Save size={16} className="mr-2"/> {isNew ? 'Crear artículo' : 'Guardar cambios'}</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
