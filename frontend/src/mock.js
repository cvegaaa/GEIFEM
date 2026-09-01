// Mock data for GEIFEM Consulting Website

export const companyInfo = {
  name: 'GEIFEM',
  fullName: 'Gestión Integral para el Fortalecimiento Empresarial',
  tagline: 'Transformamos organizaciones, impulsamos crecimiento',
  description: 'Somos su socio estratégico en consultoría empresarial, democratizando servicios de clase mundial para organizaciones de todos los tamaños.',
  contact: {
    email: 'contacto@geifem.com',
    phone: '+57 311 612 5946',
    address: 'Cra 111a #148-75, Bogotá, Colombia',
    coordinates: { lat: 4.7413, lng: -74.1213 }
  },
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61591969674978&locale=es_LA',
    instagram: 'https://www.instagram.com/geifem/'
  }
};

export const services = [
  {
    id: 'consultoria',
    title: 'Consultoría Empresarial',
    icon: 'Briefcase',
    shortDesc: 'Soluciones estratégicas integrales para optimizar su operación',
    description: 'Brindamos asesoría especializada en gestión administrativa, procesos estratégicos y optimización organizacional.',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHw0fHxjb3Jwb3JhdGUlMjB0ZWFtfGVufDB8fHx8MTc4MjkxODQ4Nnww&ixlib=rb-4.1.0&q=85',
    areas: [
      { name: 'Contabilidad y Tributaria', desc: 'Optimización fiscal y cumplimiento normativo' },
      { name: 'Auditoría y Control Interno', desc: 'Evaluación de riesgos y controles operacionales' },
      { name: 'Gestión Administrativa', desc: 'Diseño de procesos y estrategia organizacional' },
      { name: 'Marketing y Branding', desc: 'Posicionamiento de marca y estrategias digitales' },
      { name: 'Calidad y BPM', desc: 'Gestión por procesos y mejora continua' },
      { name: 'Asesoría Legal', desc: 'Cumplimiento normativo y gestión jurídica' }
    ]
  },
  {
    id: 'capacitacion',
    title: 'Capacitación Empresarial',
    icon: 'GraduationCap',
    shortDesc: 'Desarrollo de talento y competencias organizacionales',
    description: 'Programas de formación diseñados para potenciar las capacidades de su equipo y organización.',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHRyYWluaW5nfGVufDB8fHx8MTc4MjkxODQ4Nnww&ixlib=rb-4.1.0&q=85',
    areas: [
      { name: 'Seminarios Ejecutivos', desc: 'Sesiones intensivas de 1-2 días' },
      { name: 'Talleres Prácticos', desc: 'Aprendizaje aplicado y hands-on' },
      { name: 'Cursos Especializados', desc: 'Programas de 40-120 horas certificados' },
      { name: 'Conferencias Corporativas', desc: 'Keynotes y charlas motivacionales' }
    ]
  },
  {
    id: 'acompanamiento',
    title: 'Acompañamiento Estratégico',
    icon: 'TrendingUp',
    shortDesc: 'Planes personalizados según su etapa de madurez',
    description: 'Acompañamiento continuo adaptado a las necesidades específicas de cada etapa de su organización.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200',
    areas: [
      { name: 'Plan Emprende', desc: 'Fundación y formalización empresarial' },
      { name: 'Plan Crece', desc: 'Escalamiento y optimización de operaciones' },
      { name: 'Plan Escala', desc: 'Transformación digital y gobierno corporativo' }
    ]
  }
];

export const industries = [
  {
    id: 'finanzas',
    name: 'Servicios Financieros',
    icon: 'Landmark',
    description: 'Cumplimiento normativo, gestión de riesgos y optimización de procesos para instituciones financieras, aseguradoras y fintech.',
    image: 'https://images.unsplash.com/photo-1714974528703-e5ad41abc259?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHw0fHxmaW5hbmNlJTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc4MjkxODQ4Nnww&ixlib=rb-4.1.0&q=85',
    solutions: ['Auditoría y Cumplimiento', 'Gestión de Riesgos', 'Transformación Digital Financiera']
  },
  {
    id: 'tecnologia',
    name: 'Tecnología e Innovación',
    icon: 'Cpu',
    description: 'Estrategia digital, gestión ágil de proyectos y escalamiento para startups tech, software houses y empresas de innovación.',
    image: 'https://images.unsplash.com/photo-1616386261012-8a328c89d5b6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHw0fHx0ZWNobm9sb2d5JTIwb2ZmaWNlfGVufDB8fHx8MTc4MjkxODQ4Nnww&ixlib=rb-4.1.0&q=85',
    solutions: ['Metodologías Ágiles', 'Escalamiento de Startups', 'Gestión de Innovación']
  },
  {
    id: 'retail',
    name: 'Retail y Comercio',
    icon: 'ShoppingCart',
    description: 'Optimización de cadena de suministro, estrategias omnicanal y experiencia del cliente para retailers y e-commerce.',
    image: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwyfHxyZXRhaWwlMjBidXNpbmVzc3xlbnwwfHx8fDE3ODI5MTg1MDd8MA&ixlib=rb-4.1.0&q=85',
    solutions: ['Estrategia Omnicanal', 'Optimización de Inventarios', 'Customer Experience']
  },
  {
    id: 'restaurantes',
    name: 'Restaurantes y Gastronomía',
    icon: 'UtensilsCrossed',
    description: 'Optimización operativa, gestión de costos, estándares de calidad y expansión estratégica para restaurantes, cadenas gastronómicas y servicios de hospitalidad.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    solutions: ['Optimización de Costos y Márgenes', 'Estandarización de Procesos', 'Estrategia de Expansión']
  },
  {
    id: 'turismo',
    name: 'Turismo y Hospitalidad',
    icon: 'Plane',
    description: 'Gestión hotelera, experiencia del huésped, revenue management y transformación digital para hoteles, agencias de viajes y operadores turísticos.',
    image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
    solutions: ['Revenue Management', 'Gestión de Experiencia del Huésped', 'Transformación Digital Hotelera']
  },
  {
    id: 'construccion',
    name: 'Construcción e Inmobiliaria',
    icon: 'HardHat',
    description: 'Gestión de proyectos, control de costos, compliance de seguridad y optimización de procesos para constructoras, desarrolladoras inmobiliarias y empresas de infraestructura.',
    image: 'https://images.pexels.com/photos/18078304/pexels-photo-18078304.jpeg',
    solutions: ['Gestión de Proyectos PMI', 'Control de Costos y Presupuestos', 'Compliance y Seguridad Ocupacional']
  }
];

export const insights = [
  {
    id: 1,
    title: 'Tendencias en Transformación Digital para 2026',
    category: 'Estrategia Digital',
    date: '2025-08-15',
    author: 'Equipo GEIFEM',
    excerpt: 'Análisis de las principales tecnologías y metodologías que están revolucionando la gestión empresarial en América Latina.',
    image: 'https://images.unsplash.com/photo-1431576901776-e539bd916ba2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwzfHxidXNpbmVzcyUyMGFyY2hpdGVjdHVyZXxlbnwwfHx8fDE3ODI5MTg0ODZ8MA&ixlib=rb-4.1.0&q=85',
    readTime: '5 min'
  },
  {
    id: 2,
    title: 'Caso de Éxito: Optimización de Procesos en Sector Financiero',
    category: 'Caso de Éxito',
    date: '2025-08-10',
    author: 'Equipo GEIFEM',
    excerpt: 'Cómo ayudamos a una institución financiera a reducir costos operativos en 30% mediante rediseño de procesos.',
    image: 'https://images.unsplash.com/photo-1714974528703-e5ad41abc259?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHw0fHxmaW5hbmNlJTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc4MjkxODQ4Nnww&ixlib=rb-4.1.0&q=85',
    readTime: '7 min'
  },
  {
    id: 3,
    title: 'Cumplimiento Normativo: Nuevas Regulaciones Tributarias',
    category: 'Cumplimiento',
    date: '2025-08-05',
    author: 'Equipo GEIFEM',
    excerpt: 'Guía práctica para adaptarse a los cambios en la legislación tributaria colombiana y optimizar su carga fiscal.',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHRyYWluaW5nfGVufDB8fHx8MTc4MjkxODQ4Nnww&ixlib=rb-4.1.0&q=85',
    readTime: '6 min'
  },
  {
    id: 4,
    title: 'El Futuro del Liderazgo: Desarrollo de Talento en la Era Digital',
    category: 'Gestión de Talento',
    date: '2025-07-28',
    author: 'Equipo GEIFEM',
    excerpt: 'Estrategias para desarrollar líderes adaptables en un entorno empresarial en constante transformación.',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHw0fHxjb3Jwb3JhdGUlMjB0ZWFtfGVufDB8fHx8MTc4MjkxODQ4Nnww&ixlib=rb-4.1.0&q=85',
    readTime: '8 min'
  }
];

export const testimonials = [
  {
    id: 1,
    company: 'Institución Financiera Regional',
    industry: 'Finanzas',
    quote: 'GEIFEM transformó nuestros procesos de auditoría interna, reduciendo tiempos en 40% y mejorando significativamente nuestros controles.',
    author: 'Director de Operaciones',
    result: '40% reducción en tiempos de auditoría'
  },
  {
    id: 2,
    company: 'Startup Tecnológica',
    industry: 'Tecnología',
    quote: 'El acompañamiento estratégico de GEIFEM fue clave para estructurar nuestro escalamiento de 5 a 50 empleados en 18 meses.',
    author: 'CEO & Founder',
    result: '10x crecimiento en equipo'
  },
  {
    id: 3,
    company: 'Cadena de Retail Nacional',
    industry: 'Retail',
    quote: 'Implementamos una estrategia omnicanal exitosa que aumentó nuestras ventas digitales en 250% en el primer año.',
    author: 'Gerente Comercial',
    result: '250% incremento en ventas digitales'
  }
];

export const stats = [
  { number: '+200', label: 'Clientes Atendidos' },
  { number: '+10', label: 'Años de Experiencia' },
  { number: '+6', label: 'Industrias Clave' },
  { number: '95%', label: 'Satisfacción del Cliente' }
];

export const whyChooseUs = [
  {
    icon: 'Target',
    title: 'Enfoque Personalizado',
    description: 'Soluciones adaptadas a su etapa de madurez y necesidades específicas'
  },
  {
    icon: 'Award',
    title: 'Experiencia Comprobada',
    description: 'Más de 15 años transformando organizaciones en múltiples industrias'
  },
  {
    icon: 'Users',
    title: 'Equipo Multidisciplinario',
    description: 'Expertos en consultoría, capacitación y acompañamiento estratégico'
  },
  {
    icon: 'LineChart',
    title: 'Resultados Medibles',
    description: 'Metodologías probadas con KPIs claros y seguimiento continuo'
  }
];

// Indicadores económicos para la barra de anuncios
export const economicIndicators = [
  { symbol: 'TRM', name: 'Tasa Representativa del Mercado', value: '4,127.45', unit: 'COP', change: '+12.30', trend: 'up' },
  { symbol: 'USD/COP', name: 'Dólar / Peso Colombiano', value: '4,125.80', unit: '', change: '+8.50', trend: 'up' },
  { symbol: 'EUR/COP', name: 'Euro / Peso Colombiano', value: '4,467.20', unit: '', change: '-3.15', trend: 'down' },
  { symbol: 'Brent', name: 'Petróleo Brent', value: '82.45', unit: 'USD', change: '+1.24', trend: 'up' },
  { symbol: 'COLCAP', name: 'Índice COLCAP', value: '1,347.82', unit: 'pts', change: '+0.85%', trend: 'up' },
  { symbol: 'S&P 500', name: 'S&P 500', value: '5,847.30', unit: 'pts', change: '+15.42', trend: 'up' },
  { symbol: 'BTC', name: 'Bitcoin', value: '98,450', unit: 'USD', change: '-2.18%', trend: 'down' },
  { symbol: 'ORO', name: 'Oro', value: '2,632.50', unit: 'USD/oz', change: '+0.42%', trend: 'up' },
  { symbol: 'CAFÉ', name: 'Café Arábica', value: '318.75', unit: 'USD/lb', change: '+3.20', trend: 'up' },
  { symbol: 'IPC', name: 'Inflación Anual', value: '5.20%', unit: '', change: '-0.15%', trend: 'down' },
  { symbol: 'BanRep', name: 'Tasa BanRep', value: '9.75%', unit: '', change: '-0.25%', trend: 'down' },
  { symbol: 'DTF', name: 'DTF 90 días', value: '9.45%', unit: '', change: '+0.05%', trend: 'up' }
];
