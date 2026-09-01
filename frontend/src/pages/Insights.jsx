import { Search, Calendar, Clock, ArrowRight, TrendingUp, Award, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSEO } from '../hooks/useSEO';
import { getWhatsappUrl } from '../lib/whatsapp';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Categorías disponibles
const categories = [
  'all',
  'Estrategia Digital',
  'Caso de Éxito',
  'Cumplimiento',
  'Gestión de Talento'
];

export const Insights = () => {
  useSEO({
    title: 'Perspectivas e Insights',
    description: 'Análisis de mercado, tendencias empresariales y casos de éxito que inspiran transformación y crecimiento sostenible.',
    path: '/insights'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState({ loading: false, message: '', type: '' });
  const [insights, setInsights] = useState([]);

  // Cargar artículos desde el backend
  useEffect(() => {
    axios.get(`${API}/articles`)
      .then(res => setInsights(res.data.articles || []))
      .catch(err => {
        console.error('Error fetching articles:', err);
        setInsights([]);
      });
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterState({ loading: true, message: '', type: '' });
    try {
      const res = await axios.post(`${API}/newsletter`, { email: newsletterEmail.trim() });
      setNewsletterState({
        loading: false,
        message: res.data.message || 'Suscripción confirmada',
        type: 'success'
      });
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterState({
        loading: false,
        message: err.response?.data?.detail || 'No pudimos procesar la suscripción. Intente de nuevo.',
        type: 'error'
      });
    }
  };

  const filteredInsights = insights.filter(insight => {
    const matchesSearch = insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         insight.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || insight.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-[#003057] to-[#1E5A75] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">Perspectivas e Insights</h1>
            <p className="text-xl text-gray-200 leading-relaxed">
              Análisis de mercado, tendencias empresariales y casos de éxito que inspiran transformación y crecimiento sostenible.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Buscar artículos..."
                className="pl-10 h-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  className={`whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-[#003057] text-white'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'Todos' : category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="articulos" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
              <TabsTrigger value="articulos">Artículos</TabsTrigger>
              <TabsTrigger value="casos">Casos de Éxito</TabsTrigger>
            </TabsList>

            {/* Articles Tab */}
            <TabsContent value="articulos">
              {filteredInsights.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-xl text-gray-600">No se encontraron artículos que coincidan con su búsqueda.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredInsights.map((insight) => (
                    <Card key={insight.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                      <Link to={`/insights/${insight.id}`} className="block">
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={insight.image}
                            alt={insight.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="bg-[#CBA55A] text-white px-3 py-1 rounded-full text-xs font-semibold">
                              {insight.category}
                            </span>
                          </div>
                        </div>

                        <CardHeader>
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <Calendar size={16} className="mr-1" />
                              <span>{new Date(insight.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock size={16} className="mr-1" />
                              <span>{insight.read_time}</span>
                            </div>
                          </div>

                          <CardTitle className="text-xl text-[#003057] group-hover:text-[#1E5A75] transition-colors leading-tight">
                            {insight.title}
                          </CardTitle>

                          <CardDescription className="text-gray-600 leading-relaxed">
                            {insight.excerpt}
                          </CardDescription>
                        </CardHeader>
                      </Link>

                      <CardContent>
                        <Button
                          variant="ghost"
                          className="text-[#1E5A75] hover:text-[#003057] p-0 h-auto font-semibold group"
                          asChild
                        >
                          <Link to={`/insights/${insight.id}`}>
                            Leer más
                            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Success Cases Tab - VACÍA */}
            <TabsContent value="casos">
              <div className="text-center py-16">
                <p className="text-xl text-gray-600">Próximamente: Casos de éxito</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Award className="mx-auto text-[#CBA55A] mb-6" size={40} />
          <h2 className="text-3xl md:text-4xl font-bold text-[#003057] mb-4">
            Reciba nuestros insights directamente en su correo
          </h2>
          <p className="text-gray-600 mb-8">
            Análisis, tendencias y casos de éxito seleccionados. Sin spam, cancele cuando quiera.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <Input
              type="email"
              placeholder="Su correo electrónico"
              className="h-12"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              disabled={newsletterState.loading}
            />
            <Button
              type="submit"
              className="bg-[#003057] hover:bg-[#1E5A75] text-white h-12 px-8"
              disabled={newsletterState.loading}
            >
              {newsletterState.loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                'Suscribirme'
              )}
            </Button>
          </form>

          {newsletterState.message && (
            <p className={`mt-4 text-sm font-medium ${newsletterState.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {newsletterState.message}
            </p>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#003057] to-[#1E5A75] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <TrendingUp className="mx-auto text-[#CBA55A] mb-6" size={40} />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para transformar su organización?
          </h2>
          <p className="text-lg text-gray-200 mb-10 max-w-xl mx-auto">
            Agende una sesión estratégica gratuita y descubra cómo podemos ayudarlo a crecer.
          </p>
          <Button size="lg" className="bg-[#CBA55A] hover:bg-[#b8944d] text-white h-14 px-10 text-base" asChild>
            <a href={getWhatsappUrl()} target="_blank" rel="noopener noreferrer">
              Escríbenos por WhatsApp
              <ArrowRight className="ml-2" size={20} />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
};