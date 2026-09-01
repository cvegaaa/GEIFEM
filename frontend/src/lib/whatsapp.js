export const WHATSAPP_NUMBER = '573007239228';

export const getWhatsappUrl = (message = 'Hola, quisiera más información sobre los servicios de GEIFEM.') =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const openWhatsapp = (message) => {
  window.open(getWhatsappUrl(message), '_blank', 'noopener,noreferrer');
};
