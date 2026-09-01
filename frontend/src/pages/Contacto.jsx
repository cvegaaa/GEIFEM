import React, { useState } from 'react';
import axios from 'axios';
import { MapPin, Phone, Mail, Clock, Send, Loader2, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { companyInfo } from '../mock';
import { getWhatsappUrl } from '../lib/whatsapp';
import { useSEO } from '../hooks/useSEO';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Contacto = () => {
  useSEO({
    title: 'Contacto',
    description: 'Agende una sesión estratégica gratuita con GEIFEM. Escríbanos o llámenos para iniciar la transformación de su organización.',
    path: '/contacto'
  });

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    servicio: '',
    mensaje: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await axios.post(`${API}/contact`, formData, { timeout: 30000 });
      if (response.data?.success) {
        setSubmitted(true);
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          empresa: '',
          servicio: '',
          mensaje: ''
        });
        setTimeout(() => setSubmitted(false), 8000);
      } else {
        setError('No pudimos procesar su solicitud. Por favor intente nuevamente.');
      }
    } catch (err) {
      console.error('Contact submit error:', err);
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Ocurrió un error al enviar el formulario. Por favor intente nuevamente o escríbanos directamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-[#003057] to-[#1E5A75] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">Contacto</h1>
            <p className="text-xl text-gray-200 leading-relaxed">
              Estamos listos para escucharle y ayudarle a transformar su organización. Agende una consulta gratuita y descubra cómo podemos impulsar su crecimiento.
            </p>
          </div>
        </div>
      </section>

      {/* WhatsApp Quick Contact */}
      <section className="py-12 bg-white border-b border-gray-100" data-testid="whatsapp-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#003057] to-[#1E5A75] rounded-xl overflow-hidden shadow-xl">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-8 md:p-10 text-white flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px w-8 bg-[#CBA55A]"></div>
                  <span className="text-[#CBA55A] text-xs font-semibold uppercase tracking-widest">Atención Inmediata</span>
                </div>
                <h2 className="text-3xl font-bold mb-3">Escríbanos por WhatsApp</h2>
                <p className="text-gray-200 mb-6 text-sm">
                  Converse en tiempo real con nuestro equipo y resuelva sus dudas al instante. Sin llenar formularios, sin espera.
                </p>
                <a
                  href={getWhatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#CBA55A] hover:bg-[#b8944d] text-white px-6 py-3 rounded font-semibold transition-colors w-fit"
                  data-testid="whatsapp-open-btn"
                >
                  <MessageCircle size={18} />
                  Chatear ahora
                </a>
              </div>
              <div className="hidden md:flex items-center justify-center bg-white/5 p-8">
                <MessageCircle size={140} className="text-[#CBA55A] opacity-60" strokeWidth={1} />
              </div>
            </div>
          </div>

          <div className="text-center mt-6 text-sm text-gray-500">
            ¿Prefiere escribirnos primero? Complete el formulario abajo.
          </div>
        </div>
      </section>

      {/* Contact Form and Info Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-2 border-[#CBA55A] shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#003057]">Información de Contacto</CardTitle>
                  <CardDescription>Conéctese con nuestro equipo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#003057] to-[#1E5A75] rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="text-[#CBA55A]" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#003057] mb-1">Oficina Principal</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{companyInfo.contact.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#003057] to-[#1E5A75] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="text-[#CBA55A]" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#003057] mb-1">Teléfono</h3>
                      <a href={`tel:${companyInfo.contact.phone}`} className="text-gray-600 text-sm hover:text-[#1E5A75] transition-colors">
                        {companyInfo.contact.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#003057] to-[#1E5A75] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="text-[#CBA55A]" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#003057] mb-1">Email</h3>
                      <a href={`mailto:${companyInfo.contact.email}`} className="text-gray-600 text-sm hover:text-[#1E5A75] transition-colors break-all">
                        {companyInfo.contact.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#003057] to-[#1E5A75] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="text-[#CBA55A]" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#003057] mb-1">Horario de Atención</h3>
                      <p className="text-gray-600 text-sm">
                        Lunes - Viernes<br />
                        8:00 AM - 6:00 PM
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Map Placeholder */}
              <Card className="overflow-hidden shadow-lg">
                <div className="aspect-square relative bg-gray-200">
                  <iframe
                    src={`https://www.google.com/maps?q=${companyInfo.contact.coordinates.lat},${companyInfo.contact.coordinates.lng}&z=15&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    title="Ubicación GEIFEM"
                  ></iframe>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-3xl text-[#003057]">Agende su Consultoría Gratuita</CardTitle>
                  <CardDescription className="text-base">
                    Complete el formulario y nos pondremos en contacto con usted en las próximas 24 horas.
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {submitted && (
                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded" data-testid="contact-success">
                      <p className="text-green-800 font-medium">
                        ¡Gracias por contactarnos! Hemos recibido su mensaje y le enviamos una confirmación a su correo. Uno de nuestros consultores se pondrá en contacto en las próximas 24 horas hábiles.
                      </p>
                    </div>
                  )}
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded" data-testid="contact-error">
                      <p className="text-red-800 font-medium">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="nombre" className="text-[#003057] font-semibold">Nombre Completo *</Label>
                        <Input
                          id="nombre"
                          type="text"
                          required
                          value={formData.nombre}
                          onChange={(e) => handleChange('nombre', e.target.value)}
                          placeholder="Juan Pérez"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[#003057] font-semibold">Correo Electrónico *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="juan@empresa.com"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="telefono" className="text-[#003057] font-semibold">Teléfono</Label>
                        <Input
                          id="telefono"
                          type="tel"
                          value={formData.telefono}
                          onChange={(e) => handleChange('telefono', e.target.value)}
                          placeholder="+57 300 123 4567"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="empresa" className="text-[#003057] font-semibold">Empresa / Organización</Label>
                        <Input
                          id="empresa"
                          type="text"
                          value={formData.empresa}
                          onChange={(e) => handleChange('empresa', e.target.value)}
                          placeholder="Nombre de su empresa"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="servicio" className="text-[#003057] font-semibold">Servicio de Interés *</Label>
                      <Select
                        value={formData.servicio}
                        onValueChange={(value) => handleChange('servicio', value)}
                        required
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Seleccione un servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultoria">Consultoría Empresarial</SelectItem>
                          <SelectItem value="capacitacion">Capacitación Empresarial</SelectItem>
                          <SelectItem value="emprende">Plan Emprende</SelectItem>
                          <SelectItem value="crece">Plan Crece</SelectItem>
                          <SelectItem value="escala">Plan Escala</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mensaje" className="text-[#003057] font-semibold">Mensaje *</Label>
                      <Textarea
                        id="mensaje"
                        required
                        value={formData.mensaje}
                        onChange={(e) => handleChange('mensaje', e.target.value)}
                        placeholder="Cuéntenos sobre sus necesidades y objetivos..."
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitting}
                      className="w-full bg-[#CBA55A] hover:bg-[#b8944d] text-white h-14 text-lg disabled:opacity-70"
                      data-testid="contact-submit-btn"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" size={20} />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2" size={20} />
                          Enviar Mensaje
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#003057] mb-4">Preguntas Frecuentes</h2>
            <p className="text-xl text-gray-600">Respuestas rápidas a preguntas comunes</p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: '¿Cuánto tiempo toma una consultoría típica?',
                a: 'La duración varía según el proyecto. Las consultorías pueden durar desde 2 semanas hasta varios meses, dependiendo de la complejidad y alcance de los objetivos.'
              },
              {
                q: '¿Trabajan con empresas de todos los tamaños?',
                a: 'Sí, atendemos desde emprendedores y profesionales independientes hasta grandes corporaciones. Nuestras soluciones se adaptan a cada etapa de madurez organizacional.'
              },
              {
                q: '¿Cómo se estructura el proceso de consultoría?',
                a: 'Iniciamos con una sesión de diagnóstico gratuita, luego diseñamos una propuesta personalizada, y finalmente ejecutamos el proyecto con acompañamiento continuo y medición de resultados.'
              },
              {
                q: '¿Qué diferencia a GEIFEM de otras consultoras?',
                a: 'Democratizamos el acceso a servicios de clase mundial, ofreciendo metodologías probadas con enfoque personalizado y resultados medibles a organizaciones de todos los tamaños.'
              }
            ].map((faq, index) => (
              <Card key={index} className="border-l-4 border-[#CBA55A]">
                <CardHeader>
                  <CardTitle className="text-xl text-[#003057]">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};