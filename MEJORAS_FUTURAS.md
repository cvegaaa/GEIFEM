# GEIFEM — Mejoras futuras (backlog)

> Registrado el 2026-08-13, tras completar el despliegue en VPS/Easypanel. Sin fecha de implementación definida — retomar cuando el usuario lo pida.

## 1. Rediseño del Hero y encabezado — ✅ Completado (2026-08-16)
- El texto "Hacemos empresas más fuertes" pasó a ser una **leyenda pequeña junto al logo** en `Header.jsx` (visible desde `sm:` en adelante).
- El **Hero de `Home.jsx` ahora es un carrusel a pantalla completa** (componente `HeroCarousel`):
  - **Slide 1 (fijo):** el hero de marca actual (GEIFEM + "Consultoría integral que transforma su organización" + botones WhatsApp/Servicios).
  - **Slides 2-5:** los **4 artículos más recientes** de Insights (`limit: 4`), cada uno a imagen completa con categoría, título grande y botón "Leer artículo" — funcionan como titulares de portada.
  - Autoplay cada 7s, flechas prev/next y puntos de navegación (ocultos si solo hay 1 slide, es decir, mientras no haya artículos publicados). A medida que se creen artículos nuevos, se irán agregando automáticamente como slides adicionales (hasta 4, los más recientes).
  - Se eliminó la sección `news-carousel-section` separada (ya no existe, quedó fusionada en el Hero).
- Verificado con `craco build` y en dev server, incluyendo prueba manual con 4 artículos simulados para confirmar el render de los slides de imagen (revertida antes de dejar el código final).

## 3b. Animaciones (Framer Motion) — ✅ Parcial (2026-08-16)
- Se agregaron animaciones de entrada al Hero y scroll-reveal (`whileInView`) al resto de secciones de `Home.jsx` (stats, valores, servicios, industrias, CTA final).
- Pendiente extender a Servicios, Industrias, Insights y Contacto si se retoma el punto 3.

## 2. Reemplazar agendamiento de citas por WhatsApp — ✅ Completado (2026-08-16)
- Se eliminó `frontend/src/lib/calendly.js` y se creó `frontend/src/lib/whatsapp.js` (número `+57 300 7239228`, mensaje predefinido).
- Todos los botones "Agendar..." (Header, Home, Insights, Servicios) y la sección de reserva en `Contacto.jsx` ahora abren WhatsApp directamente (`wa.me`) en pestaña nueva.
- Se quitó `CALENDLY_URL` de `DEPLOY.md` (no se usaba en el backend, solo estaba documentada).
- Verificado con build de producción (`craco build`) y navegación en dev server: todos los enlaces apuntan correctamente a `https://wa.me/573007239228?...`.

## 3. Diseño más novedoso y dinámico — ✅ Declarado completo (2026-08-16)
- Cubierto con las animaciones de Framer Motion (Hero, scroll-reveal, hover/tap en botones) y el nuevo Hero-carrusel de Home. El usuario decidió dar por cerrada esta fase; si más adelante se quiere extender a Servicios/Industrias/Insights/Contacto, retomar desde aquí.

## 4. (Fase final) Agente de IA para redacción y publicación automática de noticias
- Última fase planeada del sitio: un flujo automatizado / agente de IA que **redacte y publique las noticias/artículos de la sección Insights de forma automática**, sin intervención manual.
- Sin diseño técnico todavía — definir cuando se retome: fuente de las noticias/temas, frecuencia de publicación, nivel de revisión humana antes de publicar (¿auto-publica o queda en borrador para aprobar?), y cómo se integra con el modelo de artículos ya existente en el backend (`AdminArticles`/`AdminArticleForm`, colección de Mongo).
- Dado que el VPS ya corre **n8n** (herramienta de automatización) en el mismo servidor, es la primera opción natural a evaluar para orquestar este flujo.

---

Para retomar: cargar este archivo + `git log`/estado actual del repo para ver qué cambió desde que se escribió esta lista.
