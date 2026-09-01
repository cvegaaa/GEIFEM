import React, { useEffect } from 'react';
import { Briefcase, GraduationCap, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { services } from '../mock';
import { useSEO } from '../hooks/useSEO';
import { getWhatsappUrl } from '../lib/whatsapp';

const iconMap = {
  Briefcase,
  GraduationCap,
  TrendingUp
};

export const Servicios = () => {
  useSEO({
    title: 'Servicios de Consultoría',
    description: 'Consultoría empresarial, capacitación y acompañamiento estratégico: contabilidad, auditoría, gestión administrativa, marketing y más.',
    path: '/servicios'
  });

  useEffect(() => {
    // Handle anchor navigation
    if (window.location.hash) {
      const element = document.querySelector(window.location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-[#003057] to-[#1E5A75] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">Nuestros Servicios</h1>
            <p className="text-xl text-gray-200 leading-relaxed">
              Soluciones integrales de consultoría, capacitación y acompañamiento estratégico diseñadas para impulsar el crecimiento sostenible de su organización.
            </p>
          </div>
        </div>
      </section>

      {/* Services Detail Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon];
              return (
                <div
                  key={service.id}
                  id={service.id}
                  className="scroll-mt-24"
                >
                  <div className={`grid lg:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}>
                    {/* Image */}
                    <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                      <div className="relative rounded-lg overflow-hidden shadow-2xl">
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-[400px] object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#003057]/50 to-transparent"></div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                      <div className="w-16 h-16 bg-gradient-to-br from-[#003057] to-[#1E5A75] rounded-lg flex items-center justify-center mb-6">
                        <Icon className="text-[#CBA55A]" size={32} />
                      </div>
                      
                      <h2 className="text-4xl font-bold text-[#003057] mb-4">{service.title}</h2>
                      <p className="text-xl text-gray-600 mb-8 leading-relaxed">{service.description}</p>

                      <div className="space-y-4 mb-8">
                        <h3 className="text-xl font-semibold text-[#003057] mb-4">Áreas de Especialización:</h3>
                        <div className="grid gap-4">
                          {service.areas.map((area, idx) => (
                            <div key={idx} className="flex items-start">
                              <CheckCircle2 className="text-[#CBA55A] mr-3 mt-1 flex-shrink-0" size={20} />
                              <div>
                                <div className="font-semibold text-[#003057]">{area.name}</div>
                                <div className="text-gray-600 text-sm">{area.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        size="lg"
                        className="bg-[#CBA55A] hover:bg-[#b8944d] text-white"
                        asChild
                      >
                        <Link to="/contacto">Solicitar Consulta</Link>
                      </Button>
                    </div>
                  </div>

                  {/* Divider */}
                  {index < services.length - 1 && (
                    <div className="border-b border-gray-200 mt-24"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Strategic Plans Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#003057] mb-4">Planes de Acompañamiento Estratégico</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Seleccione el plan que se ajuste a la etapa de madurez de su organización
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Plan Emprende',
                stage: 'Fundación',
                description: 'Para emprendedores y organizaciones en etapa de formalización',
                features: [
                  'Constitución legal',
                  'Modelo de negocio',
                  'Plan financiero inicial',
                  'Branding y posicionamiento',
                  'Estrategia de mercado'
                ],
                color: 'from-blue-500 to-blue-600'
              },
              {
                name: 'Plan Crece',
                stage: 'Escalamiento',
                description: 'Para PYMEs listas para optimizar y crecer de manera sostenible',
                features: [
                  'Optimización de procesos',
                  'Estructura organizacional',
                  'Gestión financiera avanzada',
                  'Expansión de mercado',
                  'Tecnología y automatización'
                ],
                color: 'from-[#1E5A75] to-[#003057]',
                featured: true
              },
              {
                name: 'Plan Escala',
                stage: 'Transformación',
                description: 'Para organizaciones consolidadas que buscan transformación digital y gobierno corporativo',
                features: [
                  'Gobierno corporativo',
                  'Transformación digital integral',
                  'Gestión de riesgos empresariales',
                  'Estrategia de innovación',
                  'Internacionalización'
                ],
                color: 'from-[#CBA55A] to-[#b8944d]'
              }
            ].map((plan, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden border-2 ${
                  plan.featured ? 'border-[#CBA55A] shadow-2xl scale-105' : 'border-gray-200 shadow-lg'
                }`}
              >
                {plan.featured && (
                  <div className="absolute top-0 right-0 bg-[#CBA55A] text-white px-4 py-1 text-sm font-semibold">
                    Más Popular
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className={`w-20 h-20 bg-gradient-to-br ${plan.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <TrendingUp className="text-white" size={40} />
                  </div>
                  <CardTitle className="text-2xl text-[#003057] mb-2">{plan.name}</CardTitle>
                  <div className="text-[#CBA55A] font-semibold mb-3">{plan.stage}</div>
                  <CardDescription className="text-gray-600">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle2 className="text-[#CBA55A] mr-2 mt-0.5 flex-shrink-0" size={18} />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full ${
                      plan.featured
                        ? 'bg-[#CBA55A] hover:bg-[#b8944d] text-white'
                        : 'bg-[#003057] hover:bg-[#1E5A75] text-white'
                    }`}
                    asChild
                  >
                    <Link to="/contacto">Solicitar Información</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#003057] to-[#1E5A75] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">¿No está seguro qué servicio necesita?</h2>
          <p className="text-xl text-gray-200 mb-8">
            Agende una consulta gratuita y nuestros expertos le ayudarán a identificar las soluciones ideales para su organización.
          </p>
          <Button size="lg" className="bg-[#CBA55A] hover:bg-[#b8944d] text-white" asChild>
            <a href={getWhatsappUrl()} target="_blank" rel="noopener noreferrer">Escríbenos por WhatsApp</a>
          </Button>
        </div>
      </section>
    </div>
  );
};