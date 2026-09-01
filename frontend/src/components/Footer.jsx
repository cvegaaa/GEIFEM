import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { companyInfo } from '../mock';

export const Footer = () => {
  return (
    <footer className="bg-[#003057] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_premium-corp-site-5/artifacts/6goc21wb_Logo%20actualizado.png" 
                alt="GEIFEM"
                className="h-16 w-auto object-contain bg-white p-2 rounded"
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {companyInfo.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#CBA55A]">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-[#CBA55A] transition-colors text-sm">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/servicios" className="text-gray-300 hover:text-[#CBA55A] transition-colors text-sm">
                  Servicios
                </Link>
              </li>
              <li>
                <Link to="/industrias" className="text-gray-300 hover:text-[#CBA55A] transition-colors text-sm">
                  Industrias
                </Link>
              </li>
              <li>
                <Link to="/insights" className="text-gray-300 hover:text-[#CBA55A] transition-colors text-sm">
                  Insights
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="text-gray-300 hover:text-[#CBA55A] transition-colors text-sm">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#CBA55A]">Servicios</h3>
            <ul className="space-y-2">
              <li>
                <a href="/servicios#consultoria" className="text-gray-300 hover:text-[#CBA55A] transition-colors text-sm">
                  Consultoría Empresarial
                </a>
              </li>
              <li>
                <a href="/servicios#capacitacion" className="text-gray-300 hover:text-[#CBA55A] transition-colors text-sm">
                  Capacitación
                </a>
              </li>
              <li>
                <a href="/servicios#acompanamiento" className="text-gray-300 hover:text-[#CBA55A] transition-colors text-sm">
                  Acompañamiento Estratégico
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#CBA55A]">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-[#CBA55A] mt-1 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{companyInfo.contact.address}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-[#CBA55A] flex-shrink-0" />
                <a href={`tel:${companyInfo.contact.phone}`} className="text-gray-300 hover:text-[#CBA55A] transition-colors text-sm">
                  {companyInfo.contact.phone}
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-[#CBA55A] flex-shrink-0" />
                <a href={`mailto:${companyInfo.contact.email}`} className="text-gray-300 hover:text-[#CBA55A] transition-colors text-sm">
                  {companyInfo.contact.email}
                </a>
              </li>
            </ul>

            {/* Social Media */}
            <div className="flex space-x-4 mt-6">
              <a
                href={companyInfo.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#CBA55A] transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a
                href={companyInfo.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#CBA55A] transition-colors"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} GEIFEM. Todos los derechos reservados.
          </p>
          <span className="hidden sm:inline text-gray-600">|</span>
          <Link to="/politica-de-privacidad" className="text-gray-400 hover:text-[#CBA55A] transition-colors text-sm">
            Política de Privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
};