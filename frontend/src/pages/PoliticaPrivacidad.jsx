import React from 'react';
import { useSEO } from '../hooks/useSEO';

export const PoliticaPrivacidad = () => {
  useSEO({
    title: 'Política de Privacidad',
    description: 'Política de Privacidad de GEIFEM: cómo recopilamos, usamos, almacenamos y protegemos tus datos personales, en cumplimiento de la Ley 1581 de 2012.',
    path: '/politica-de-privacidad'
  });

  const lastUpdated = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-[#003057] to-[#1E5A75] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">Política de Privacidad</h1>
            <p className="text-xl text-gray-200 leading-relaxed">
              Última actualización: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose-legal space-y-6 text-gray-700 leading-relaxed">
            <p>
              GEIFEM ("nosotros", "nuestro" o "la empresa") se compromete a proteger la privacidad y los datos
              personales de las personas que interactúan con nuestros servicios, incluyendo nuestro sitio web,
              canales de WhatsApp Business y demás herramientas digitales.
            </p>
            <p>
              Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos tu
              información personal, en cumplimiento de la Ley 1581 de 2012 (Ley de Protección de Datos
              Personales de Colombia) y sus decretos reglamentarios.
            </p>

            <h2 className="text-2xl font-bold text-[#003057] pt-6">1. Responsable del tratamiento de datos</h2>
            <p>
              Razón social: GEIFEM<br />
              Correo de contacto: <a href="mailto:contacto@geifem.com" className="text-[#1E5A75] hover:text-[#CBA55A] transition-colors">contacto@geifem.com</a><br />
              Ciudad: Bogotá D.C., Colombia
            </p>

            <h2 className="text-2xl font-bold text-[#003057] pt-6">2. Datos que recopilamos</h2>
            <p>
              Cuando interactúas con nosotros a través de WhatsApp Business, nuestro sitio web u otros canales,
              podemos recopilar:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nombre y datos de contacto (número de teléfono, correo electrónico)</li>
              <li>Contenido de los mensajes que nos envías</li>
              <li>Información sobre tu empresa o necesidades contables/tecnológicas, si la compartes con nosotros</li>
              <li>Metadatos técnicos de la conversación (fecha, hora, canal de origen)</li>
            </ul>

            <h2 className="text-2xl font-bold text-[#003057] pt-6">3. Finalidad del tratamiento</h2>
            <p>Usamos tu información para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Responder tus consultas y brindarte atención al cliente, incluyendo a través de nuestro asistente automatizado (EMI)</li>
              <li>Agendar citas o reuniones cuando lo solicites</li>
              <li>Enviarte información sobre nuestros servicios contables, de consultoría o tecnológicos</li>
              <li>Mejorar la calidad de nuestra atención y nuestros procesos internos</li>
              <li>Cumplir obligaciones legales o contractuales aplicables</li>
            </ul>

            <h2 className="text-2xl font-bold text-[#003057] pt-6">4. Canales y herramientas utilizadas</h2>
            <p>
              Para brindarte atención, utilizamos las siguientes herramientas y proveedores, quienes pueden
              procesar tus datos en nuestro nombre bajo sus propias políticas de seguridad:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Meta / WhatsApp Business Platform:</strong> para el envío y recepción de mensajes de WhatsApp</li>
              <li><strong>Chatwoot:</strong> plataforma de gestión de conversaciones</li>
              <li><strong>Google (Sheets y Calendar):</strong> para registro de información de contacto y agendamiento, cuando aplica</li>
              <li><strong>Infraestructura de automatización interna (n8n):</strong> para procesar y enrutar mensajes de forma automática</li>
            </ul>
            <p>
              Ninguno de estos proveedores está autorizado a usar tu información para fines distintos a los aquí
              descritos.
            </p>

            <h2 className="text-2xl font-bold text-[#003057] pt-6">5. Conservación de los datos</h2>
            <p>
              Conservamos tu información personal únicamente durante el tiempo necesario para cumplir con las
              finalidades descritas en esta política, o el tiempo exigido por la ley aplicable.
            </p>

            <h2 className="text-2xl font-bold text-[#003057] pt-6">6. Tus derechos</h2>
            <p>Como titular de tus datos personales, tienes derecho a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Conocer, actualizar y rectificar tu información</li>
              <li>Solicitar prueba de la autorización otorgada para el tratamiento de tus datos</li>
              <li>Ser informado sobre el uso que se le ha dado a tus datos</li>
              <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley</li>
              <li>Revocar la autorización y/o solicitar la supresión de tus datos, cuando no exista un deber legal o contractual que lo impida</li>
              <li>Acceder de forma gratuita a tus datos personales que hayan sido objeto de tratamiento</li>
            </ul>
            <p>
              Para ejercer estos derechos, puedes escribirnos a{' '}
              <a href="mailto:contacto@geifem.com" className="text-[#1E5A75] hover:text-[#CBA55A] transition-colors">contacto@geifem.com</a>.
            </p>

            <h2 className="text-2xl font-bold text-[#003057] pt-6">7. Seguridad de la información</h2>
            <p>
              Implementamos medidas técnicas y organizativas razonables para proteger tu información contra
              acceso no autorizado, pérdida o alteración.
            </p>

            <h2 className="text-2xl font-bold text-[#003057] pt-6">8. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad periódicamente. Cualquier cambio será publicado en
              esta misma página con su respectiva fecha de actualización.
            </p>

            <h2 className="text-2xl font-bold text-[#003057] pt-6">9. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta Política de Privacidad, contáctanos en{' '}
              <a href="mailto:contacto@geifem.com" className="text-[#1E5A75] hover:text-[#CBA55A] transition-colors">contacto@geifem.com</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
