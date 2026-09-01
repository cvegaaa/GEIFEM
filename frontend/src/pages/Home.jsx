import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Target,
  Award,
  Users,
  LineChart,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../components/ui/carousel';
import { services, industries, stats } from '../mock';
import { useSEO } from '../hooks/useSEO';
import { getWhatsappUrl } from '../lib/whatsapp';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MotionLink = motion(Link);

const iconMap = {
  Briefcase,
  GraduationCap,
  TrendingUp,
  Target,
  Award,
  Users,
  LineChart
};

const heroContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

const revealHeaderVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const revealStaggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const revealItemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const HERO_SLIDE_HEIGHT = 'min-h-[560px] md:min-h-[640px]';
const HERO_AUTOPLAY_MS = 7000;

const HeroBrandSlide = () => (
  <div className={`relative ${HERO_SLIDE_HEIGHT} flex items-center bg-gradient-to-br from-[#003057] via-[#1E5A75] to-[#003057] overflow-hidden`}>
    {/* Decorative hexagon pattern */}
    <div className="absolute inset-0 opacity-10">
      <motion.div
        className="absolute top-10 right-10 w-64 h-64 border-2 border-[#CBA55A] rotate-45"
        initial={{ opacity: 0, scale: 0.8, rotate: 30 }}
        animate={{ opacity: 1, scale: 1, rotate: 45 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      ></motion.div>
      <motion.div
        className="absolute bottom-20 left-10 w-48 h-48 border-2 border-[#CBA55A] rotate-12"
        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, rotate: 12 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
      ></motion.div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
      <motion.div
        className="max-w-3xl mx-auto text-center"
        variants={heroContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Brand accent line */}
        <motion.div className="flex items-center justify-center gap-3 mb-6" variants={heroItemVariants}>
          <div className="h-px w-12 bg-[#CBA55A]"></div>
          <span className="text-[#CBA55A] text-sm font-semibold uppercase tracking-widest">GEIFEM</span>
          <div className="h-px w-12 bg-[#CBA55A]"></div>
        </motion.div>

        <motion.h1
          className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight"
          data-testid="hero-title"
          variants={heroItemVariants}
        >
          Consultoría integral que <span className="text-[#CBA55A]">transforma su organización</span>
        </motion.h1>

        <motion.p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto" variants={heroItemVariants}>
          Potenciamos el crecimiento sostenible de empresas de todos los tamaños con soluciones a la medida.
        </motion.p>

        <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={heroItemVariants}>
          <Button size="lg" className="bg-[#CBA55A] hover:bg-[#b8944d] text-white h-14 px-8 text-base" asChild data-testid="hero-cta-primary">
            <motion.a
              href={getWhatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Escríbenos por WhatsApp
              <ArrowRight className="ml-2" size={20} />
            </motion.a>
          </Button>
          <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#003057] h-14 px-8 text-base" asChild data-testid="hero-cta-secondary">
            <MotionLink to="/servicios" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              Conocer Servicios
            </MotionLink>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  </div>
);

const HeroArticleSlide = ({ article }) => (
  <Link
    to={`/insights/${article.id}`}
    className={`relative ${HERO_SLIDE_HEIGHT} flex items-end overflow-hidden group`}
    data-testid={`hero-article-slide-${article.id}`}
  >
    <img
      src={article.image}
      alt={article.title}
      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#003057] via-[#003057]/60 to-[#003057]/10"></div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 relative z-10 w-full">
      <span className="inline-block bg-[#CBA55A] text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
        {article.category}
      </span>
      <h2 className="text-3xl md:text-5xl font-bold text-white max-w-3xl mb-6 leading-tight">
        {article.title}
      </h2>
      <span className="inline-flex items-center gap-2 bg-white text-[#003057] px-6 py-3 rounded font-semibold group-hover:bg-gray-100 transition-colors">
        Leer artículo
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </span>
    </div>
  </Link>
);

const HeroCarousel = ({ articles }) => {
  const [api, setApi] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const slideCount = 1 + articles.length;

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect);
    return () => api.off('select', onSelect);
  }, [api]);

  useEffect(() => {
    if (!api || slideCount <= 1) return;
    const interval = setInterval(() => api.scrollNext(), HERO_AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [api, slideCount]);

  return (
    <Carousel opts={{ loop: true }} setApi={setApi} className="w-full" data-testid="hero-carousel">
      <CarouselContent className="ml-0">
        <CarouselItem className="pl-0">
          <HeroBrandSlide />
        </CarouselItem>
        {articles.map((article) => (
          <CarouselItem key={article.id} className="pl-0">
            <HeroArticleSlide article={article} />
          </CarouselItem>
        ))}
      </CarouselContent>

      {slideCount > 1 && (
        <>
          <CarouselPrevious
            className="left-4 md:left-6 bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm h-10 w-10 md:h-12 md:w-12"
            data-testid="hero-carousel-prev"
          />
          <CarouselNext
            className="right-4 md:right-6 bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm h-10 w-10 md:h-12 md:w-12"
            data-testid="hero-carousel-next"
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {Array.from({ length: slideCount }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => api?.scrollTo(idx)}
                className={`h-2 rounded-full transition-all ${
                  selectedIndex === idx ? 'w-8 bg-[#CBA55A]' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Ir a la diapositiva ${idx + 1}`}
                data-testid={`hero-carousel-dot-${idx}`}
              />
            ))}
          </div>
        </>
      )}
    </Carousel>
  );
};

export const Home = () => {
  const [insights, setInsights] = useState([]);

  useSEO({
    title: 'Consultoría Empresarial Integral',
    description: 'GEIFEM transforma organizaciones y potencia crecimiento sostenible: consultoría, capacitación y acompañamiento estratégico para empresas de todos los tamaños.',
    path: '/'
  });

  useEffect(() => {
    axios.get(`${API}/articles`, { params: { limit: 4 } })
      .then(res => setInsights(res.data.articles || []))
      .catch(err => {
        console.error('Error fetching articles:', err);
        setInsights([]);
      });
  }, []);

  return (
    <div className="min-h-screen">
      {/* ============= 50% IDENTIDAD DE MARCA ============= */}

      {/* Hero Section - Carrusel de marca + titulares de Insights */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <HeroCarousel articles={insights} />
      </section>

      {/* Stats Bar - Métricas de marca */}
      <section className="bg-white py-12 border-b border-gray-100" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            variants={revealStaggerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className={`text-center ${index < 3 ? 'md:border-r md:border-gray-200' : ''}`}
                data-testid={`stat-${index}`}
                variants={revealItemVariants}
              >
                <div className="text-5xl font-bold text-[#003057] mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Brand Values - Qué nos hace fuertes */}
      <section className="py-24 bg-gray-50 relative" data-testid="values-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            variants={revealHeaderVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#CBA55A]"></div>
              <span className="text-[#CBA55A] text-xs font-semibold uppercase tracking-widest">Nuestra Fortaleza</span>
              <div className="h-px w-8 bg-[#CBA55A]"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#003057]">
              Sólidos. Integrales. <span className="text-[#CBA55A]">En crecimiento.</span>
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={revealStaggerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {[
              {
                icon: Shield,
                title: 'Solidez',
                description: 'Metodologías probadas y equipo experto'
              },
              {
                icon: Sparkles,
                title: 'Integración',
                description: 'Soluciones completas end-to-end'
              },
              {
                icon: TrendingUp,
                title: 'Crecimiento',
                description: 'Resultados medibles y sostenibles'
              }
            ].map((value, idx) => (
              <motion.div key={idx} className="text-center group" data-testid={`value-${idx}`} variants={revealItemVariants}>
                <div className="relative inline-block mb-6">
                  {/* Hexagon shape with icon */}
                  <div className="w-24 h-24 bg-gradient-to-br from-[#003057] to-[#1E5A75] mx-auto flex items-center justify-center transform rotate-45 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <div className="-rotate-45">
                      <value.icon className="text-[#CBA55A]" size={40} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#003057] mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============= 30% COMERCIAL ============= */}

      {/* Services Introduction - Solo cards conceptuales */}
      <section className="py-24 bg-white" data-testid="services-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            variants={revealHeaderVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#CBA55A]"></div>
              <span className="text-[#CBA55A] text-xs font-semibold uppercase tracking-widest">Soluciones</span>
              <div className="h-px w-8 bg-[#CBA55A]"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#003057] mb-4">Nuestros Servicios</h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={revealStaggerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {services.map((service, idx) => {
              const Icon = iconMap[service.icon];
              return (
                <motion.div key={service.id} variants={revealItemVariants}>
                <Card
                  className="group relative overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer"
                  data-testid={`service-card-${service.id}`}
                >
                  <Link to={`/servicios#${service.id}`} className="block">
                    {/* Image */}
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#003057] via-[#003057]/60 to-transparent"></div>

                      {/* Icon overlay */}
                      <div className="absolute top-6 right-6 w-14 h-14 bg-[#CBA55A] rounded-lg flex items-center justify-center shadow-lg">
                        <Icon className="text-white" size={28} strokeWidth={1.5} />
                      </div>

                      {/* Number indicator */}
                      <div className="absolute top-6 left-6">
                        <span className="text-white/70 text-sm font-bold">0{idx + 1}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 bg-white">
                      <h3 className="text-2xl font-bold text-[#003057] mb-3 group-hover:text-[#1E5A75] transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-6">
                        {service.shortDesc}
                      </p>

                      <div className="flex items-center text-[#CBA55A] font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                        <span>Descubrir más</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Industries showcase - Visual only */}
      <section className="py-24 bg-[#003057] relative overflow-hidden" data-testid="industries-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-16"
            variants={revealHeaderVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#CBA55A]"></div>
              <span className="text-[#CBA55A] text-xs font-semibold uppercase tracking-widest">Sectores</span>
              <div className="h-px w-8 bg-[#CBA55A]"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Industrias que <span className="text-[#CBA55A]">Atendemos</span>
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10"
            variants={revealStaggerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {industries.map((industry, idx) => (
              <motion.div key={industry.id} variants={revealItemVariants}>
                <Link
                  to={`/industrias#${industry.id}`}
                  className="group relative overflow-hidden aspect-square rounded-lg block"
                  data-testid={`industry-tile-${industry.id}`}
                >
                  <img
                    src={industry.image}
                    alt={industry.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#003057] via-[#003057]/60 to-transparent group-hover:from-[#CBA55A]/80 transition-all duration-300"></div>
                  <div className="absolute inset-0 flex items-end p-4">
                    <h3 className="text-white text-sm font-bold leading-tight">{industry.name}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center">
            <Button
              variant="outline"
              className="bg-transparent border-2 border-[#CBA55A] text-[#CBA55A] hover:bg-[#CBA55A] hover:text-white"
              asChild
              data-testid="view-all-industries-btn"
            >
              <Link to="/industrias">
                Explorar Todas las Industrias
                <ArrowRight className="ml-2" size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============= 20% COMPLEMENTOS / CTA FINAL ============= */}

      {/* Final CTA - Minimal */}
      <section className="py-20 bg-gradient-to-br from-white via-gray-50 to-white" data-testid="cta-section">
        <motion.div
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          variants={revealStaggerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          <motion.div className="flex items-center justify-center gap-3 mb-6" variants={revealItemVariants}>
            <div className="h-px w-8 bg-[#CBA55A]"></div>
            <Zap size={16} className="text-[#CBA55A]" />
            <div className="h-px w-8 bg-[#CBA55A]"></div>
          </motion.div>

          <motion.h2 className="text-4xl md:text-5xl font-bold text-[#003057] mb-6" variants={revealItemVariants}>
            Comience su <span className="text-[#CBA55A]">transformación</span>
          </motion.h2>

          <motion.p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto" variants={revealItemVariants}>
            Sesión estratégica gratuita. Sin compromiso.
          </motion.p>

          <motion.div variants={revealItemVariants}>
            <Button size="lg" className="bg-[#CBA55A] hover:bg-[#b8944d] text-white h-14 px-10 text-base" asChild data-testid="final-cta-btn">
              <motion.a
                href={getWhatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                Escríbenos por WhatsApp
                <ArrowRight className="ml-2" size={20} />
              </motion.a>
            </Button>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};
