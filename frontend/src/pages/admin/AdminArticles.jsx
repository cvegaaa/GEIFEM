import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { adminAxios } from './adminApi';

export const AdminArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAxios.get('/admin/articles');
      setArticles(res.data.articles || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const togglePublished = async (article) => {
    try {
      await adminAxios.patch(`/admin/articles/${article.id}`, { published: !article.published });
      setArticles(articles.map(a => a.id === article.id ? { ...a, published: !article.published } : a));
    } catch (e) { console.error(e); }
  };

  const deleteArticle = async (id) => {
    if (!window.confirm('¿Eliminar este artículo permanentemente?')) return;
    try {
      await adminAxios.delete(`/admin/articles/${id}`);
      setArticles(articles.filter(a => a.id !== id));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6" data-testid="admin-articles">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#003057]">Artículos</h1>
          <p className="text-gray-600 mt-1">{articles.length} artículos totales</p>
        </div>
        <Button onClick={() => navigate('/admin/articles/new')} className="bg-[#CBA55A] hover:bg-[#b8944d] text-white" data-testid="new-article-btn">
          <Plus size={18} className="mr-2" /> Nuevo artículo
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600"><Loader2 className="animate-spin" size={18}/> Cargando artículos...</div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">No hay artículos aún</p>
            <Button onClick={() => navigate('/admin/articles/new')} className="bg-[#CBA55A] text-white">
              Crear primer artículo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Card key={article.id} className="border-0 shadow-md overflow-hidden group" data-testid={`article-${article.id}`}>
              <div className="aspect-video relative overflow-hidden bg-gray-100">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { e.target.style.display='none'; }} />
                <Badge className={`absolute top-3 right-3 ${article.published ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                  {article.published ? 'Publicado' : 'Borrador'}
                </Badge>
              </div>
              <CardContent className="p-5">
                <div className="text-xs font-semibold text-[#CBA55A] uppercase tracking-wide mb-2">{article.category}</div>
                <h3 className="font-bold text-[#003057] mb-2 line-clamp-2">{article.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{article.excerpt}</p>
                <div className="text-xs text-gray-400 mb-4">{new Date(article.date).toLocaleDateString('es-CO')} · {article.read_time}</div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/articles/${article.id}`)} data-testid={`edit-${article.id}`}>
                    <Edit size={14} className="mr-1" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => togglePublished(article)} data-testid={`toggle-${article.id}`}>
                    {article.published ? <><EyeOff size={14} className="mr-1"/>Ocultar</> : <><Eye size={14} className="mr-1"/>Publicar</>}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteArticle(article.id)} className="ml-auto text-red-500" data-testid={`delete-${article.id}`}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
