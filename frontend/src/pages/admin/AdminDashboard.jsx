import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Mail, TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { adminAxios } from './adminApi';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAxios.get('/admin/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center gap-2 text-gray-600"><Loader2 className="animate-spin" size={18}/> Cargando datos...</div>;
  }

  const cards = [
    {
      title: 'Leads Totales',
      value: stats?.contacts_total ?? 0,
      subtitle: `${stats?.contacts_new ?? 0} nuevos por gestionar`,
      icon: Users,
      color: 'from-[#003057] to-[#1E5A75]',
      link: '/admin/leads',
      testid: 'stat-leads'
    },
    {
      title: 'Últimos 7 días',
      value: stats?.contacts_last_7_days ?? 0,
      subtitle: 'Nuevos contactos recibidos',
      icon: TrendingUp,
      color: 'from-[#CBA55A] to-[#b8944d]',
      link: '/admin/leads',
      testid: 'stat-recent'
    },
    {
      title: 'Suscriptores',
      value: stats?.newsletter_total ?? 0,
      subtitle: 'Newsletter activos',
      icon: Mail,
      color: 'from-[#1E5A75] to-[#003057]',
      link: '/admin/newsletter',
      testid: 'stat-newsletter'
    },
    {
      title: 'Artículos',
      value: stats?.articles_total ?? 0,
      subtitle: `${stats?.articles_published ?? 0} publicados`,
      icon: FileText,
      color: 'from-[#003057] to-[#CBA55A]',
      link: '/admin/articles',
      testid: 'stat-articles'
    }
  ];

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      <div>
        <h1 className="text-3xl font-bold text-[#003057]">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen general del sitio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link key={idx} to={card.link} data-testid={card.testid}>
              <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                    <Icon className="text-white" size={22} />
                  </div>
                  <div className="text-4xl font-bold text-[#003057] mb-2">{card.value}</div>
                  <div className="text-sm font-semibold text-gray-800">{card.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{card.subtitle}</div>
                  <div className="flex items-center gap-1 text-[#CBA55A] text-xs font-semibold mt-4">
                    Ver detalle <ArrowRight size={12} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg text-[#003057]">Accesos rápidos</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <Link to="/admin/articles/new" className="p-4 rounded-lg border border-gray-200 hover:border-[#CBA55A] transition-colors" data-testid="quick-new-article">
            <div className="font-semibold text-[#003057]">📝 Publicar nuevo artículo</div>
            <div className="text-sm text-gray-500 mt-1">Añadir contenido a la sección Insights</div>
          </Link>
          <Link to="/admin/leads?status=new" className="p-4 rounded-lg border border-gray-200 hover:border-[#CBA55A] transition-colors" data-testid="quick-new-leads">
            <div className="font-semibold text-[#003057]">📞 Revisar leads nuevos</div>
            <div className="text-sm text-gray-500 mt-1">{stats?.contacts_new ?? 0} contactos pendientes de gestión</div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};
