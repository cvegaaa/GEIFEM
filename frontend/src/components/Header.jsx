import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { getWhatsappUrl } from '../lib/whatsapp';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const servicios = [
    { name: 'Consultoría Empresarial', path: '/servicios#consultoria' },
    { name: 'Capacitación Empresarial', path: '/servicios#capacitacion' },
    { name: 'Acompañamiento Estratégico', path: '/servicios#acompanamiento' }
  ];

  const industrias = [
    { name: 'Servicios Financieros', path: '/industrias#finanzas' },
    { name: 'Tecnología e Innovación', path: '/industrias#tecnologia' },
    { name: 'Retail y Comercio', path: '/industrias#retail' },
    { name: 'Restaurantes y Gastronomía', path: '/industrias#restaurantes' },
    { name: 'Turismo y Hospitalidad', path: '/industrias#turismo' },
    { name: 'Construcción e Inmobiliaria', path: '/industrias#construccion' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200" data-testid="site-header">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" data-testid="header-logo">
            <img
              src="https://customer-assets.emergentagent.com/job_premium-corp-site-5/artifacts/6goc21wb_Logo%20actualizado.png"
              alt="GEIFEM - Gestión Integral para el Fortalecimiento Empresarial"
              className="h-14 w-auto object-contain"
            />
            <span className="hidden sm:block text-xs text-gray-500 font-medium leading-tight max-w-[130px] border-l border-gray-200 pl-3">
              Hacemos empresas <span className="text-[#1E5A75] font-semibold">más fuertes</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link
              to="/"
              data-testid="nav-inicio"
              className={`text-sm font-medium transition-colors hover:text-[#1E5A75] ${
                isActive('/') ? 'text-[#1E5A75]' : 'text-gray-700'
              }`}
            >
              Inicio
            </Link>

            {/* Servicios - Link + Hover Dropdown */}
            <div className="relative group">
              <Link
                to="/servicios"
                data-testid="nav-servicios"
                className={`text-sm font-medium transition-colors hover:text-[#1E5A75] flex items-center gap-1 py-2 ${
                  isActive('/servicios') ? 'text-[#1E5A75]' : 'text-gray-700'
                }`}
              >
                Servicios
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
              </Link>
              {/* Invisible bridge to prevent hover gap */}
              <div className="absolute top-full left-0 h-2 w-full" />
              <div
                className="absolute top-full left-0 pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                data-testid="servicios-dropdown"
              >
                <div className="bg-white rounded-md shadow-lg border border-gray-200 py-2">
                  {servicios.map((servicio) => (
                    <a
                      key={servicio.path}
                      href={servicio.path}
                      className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 hover:text-[#1E5A75] transition-colors"
                      data-testid={`dropdown-${servicio.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {servicio.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Industrias - Link + Hover Dropdown */}
            <div className="relative group">
              <Link
                to="/industrias"
                data-testid="nav-industrias"
                className={`text-sm font-medium transition-colors hover:text-[#1E5A75] flex items-center gap-1 py-2 ${
                  isActive('/industrias') ? 'text-[#1E5A75]' : 'text-gray-700'
                }`}
              >
                Industrias
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
              </Link>
              <div className="absolute top-full left-0 h-2 w-full" />
              <div
                className="absolute top-full left-0 pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                data-testid="industrias-dropdown"
              >
                <div className="bg-white rounded-md shadow-lg border border-gray-200 py-2">
                  {industrias.map((industria) => (
                    <a
                      key={industria.path}
                      href={industria.path}
                      className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 hover:text-[#1E5A75] transition-colors"
                      data-testid={`dropdown-${industria.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {industria.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to="/insights"
              data-testid="nav-insights"
              className={`text-sm font-medium transition-colors hover:text-[#1E5A75] ${
                isActive('/insights') ? 'text-[#1E5A75]' : 'text-gray-700'
              }`}
            >
              Insights
            </Link>

            <Link
              to="/contacto"
              data-testid="nav-contacto"
              className={`text-sm font-medium transition-colors hover:text-[#1E5A75] ${
                isActive('/contacto') ? 'text-[#1E5A75]' : 'text-gray-700'
              }`}
            >
              Contacto
            </Link>
          </div>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Button
              asChild
              className="bg-[#CBA55A] hover:bg-[#b8944d] text-white transition-colors"
              data-testid="header-cta"
            >
              <a href={getWhatsappUrl()} target="_blank" rel="noopener noreferrer">
                Escríbenos por WhatsApp
              </a>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-gray-700 hover:text-[#1E5A75] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200" data-testid="mobile-menu">
            <div className="space-y-4">
              <Link to="/" className="block py-2 text-gray-700 hover:text-[#1E5A75] font-medium" onClick={() => setMobileMenuOpen(false)}>Inicio</Link>
              <Link to="/servicios" className="block py-2 text-gray-700 hover:text-[#1E5A75] font-medium" onClick={() => setMobileMenuOpen(false)}>Servicios</Link>
              <Link to="/industrias" className="block py-2 text-gray-700 hover:text-[#1E5A75] font-medium" onClick={() => setMobileMenuOpen(false)}>Industrias</Link>
              <Link to="/insights" className="block py-2 text-gray-700 hover:text-[#1E5A75] font-medium" onClick={() => setMobileMenuOpen(false)}>Insights</Link>
              <Link to="/contacto" className="block py-2 text-gray-700 hover:text-[#1E5A75] font-medium" onClick={() => setMobileMenuOpen(false)}>Contacto</Link>
              <Button
                asChild
                className="w-full bg-[#CBA55A] hover:bg-[#b8944d] text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <a href={getWhatsappUrl()} target="_blank" rel="noopener noreferrer">
                  Escríbenos por WhatsApp
                </a>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
