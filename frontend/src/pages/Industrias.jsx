import React, { useEffect } from 'react';
import { Landmark, Cpu, ShoppingCart, UtensilsCrossed, Plane, HardHat, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { industries } from '../mock';
import { useSEO } from '../hooks/useSEO';

const iconMap = {
  Landmark,
  Cpu,
  ShoppingCart,
  UtensilsCrossed,
  Plane,
  HardHat
};

export const Industrias = () => {
  useSEO({
    title: 'Industrias que Atendemos',
    description: 'Soluciones de consultoría especializadas para servicios financieros, tecnología, retail, restaurantes, turismo y construcción.',
    path: '/industrias'
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
            <h1 className="text-5xl font-bold mb-6">Industrias que Atendemos</h1>
            <p className="text-xl text-gray-200 leading-relaxed">
              Experiencia especializada en sectores clave de la economía. Entendemos los desafíos únicos de cada industria y ofrecemos soluciones adaptadas a sus necesidades específicas.
            </p>
          </div>
        </div>
      </section>

      {/* Industries Detail Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {industries.map((industry, index) => {
              const Icon = iconMap[industry.icon];
              return (
                <div
                  key={industry.id}
                  id={industry.id}
                  className="scroll-mt-24"
                >
                  <div className={`grid lg:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}>
                    {/* Image */}
                    <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                      <div className="relative rounded-lg overflow-hidden shadow-2xl group">
                        <img
                          src={industry.image}
                          alt={industry.name}
                          className="w-full h-[500px] object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#003057] via-[#003057]/30 to-transparent opacity-60"></div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                      <div className="w-16 h-16 bg-gradient-to-br from-[#003057] to-[#1E5A75] rounded-lg flex items-center justify-center mb-6">
                        <Icon className="text-[#CBA55A]" size={32} />
                      </div>
                      
                      <h2 className="text-4xl font-bold text-[#003057] mb-4">{industry.name}</h2>
                      <p className="text-xl text-gray-600 mb-8 leading-relaxed">{industry.description}</p>

                      <div className="space-y-4 mb-8">
                        <h3 className="text-xl font-semibold text-[#003057] mb-4">Soluciones Especializadas:</h3>
                        <div className="space-y-3">
                          {industry.solutions.map((solution, idx) => (
                            <div
                              key={idx}
                              className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <ArrowRight className="text-[#CBA55A] mr-3 flex-shrink-0" size={20} />
                              <span className="text-gray-700 font-medium">{solution}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        size="lg"
                        className="bg-[#CBA55A] hover:bg-[#b8944d] text-white"
                        asChild
                      >
                        <Link to="/contacto">Solicitar Consulta Sectorial</Link>
                      </Button>
                    </div>
                  </div>

                  {/* Divider */}
                  {index < industries.length - 1 && (
                    <div className="border-b border-gray-200 mt-24"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Horizontal Approach Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-[#003057] mb-6">Enfoque Horizontal</h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Si bien tenemos experiencia especializada en los sectores destacados, nuestra metodología de consultoría es aplicable a organizaciones de cualquier industria. Desde emprendedores y profesionales independientes hasta grandes corporaciones e instituciones, nuestro enfoque se adapta a sus necesidades específicas.
            </p>
            
            <div className="grid md:grid-cols-4 gap-6 mt-12">
              {[
                { label: 'Emprendedores', icon: '1' },
                { label: 'Profesionales Independientes', icon: '2' },
                { label: 'PYMEs', icon: '3' },
                { label: 'Grandes Organizaciones', icon: '4' }
              ].map((segment, idx) => (
                <Card key={idx} className="border-2 border-gray-200">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#003057] to-[#1E5A75] rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-[#CBA55A] font-bold text-xl">{segment.icon}</span>
                    </div>
                    <CardTitle className="text-lg text-[#003057]">{segment.label}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#003057] to-[#1E5A75] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">¿Su industria no está listada?</h2>
          <p className="text-xl text-gray-200 mb-8">
            No hay problema. Contacte con nosotros para discutir cómo nuestras soluciones pueden adaptarse a su sector específico.
          </p>
          <Button size="lg" className="bg-[#CBA55A] hover:bg-[#b8944d] text-white" asChild>
            <Link to="/contacto">Contactar Ahora</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};