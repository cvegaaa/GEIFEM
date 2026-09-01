import { useEffect } from 'react';

const SITE_URL = 'https://geifem.com';
const SITE_NAME = 'GEIFEM';
const DEFAULT_IMAGE = `${SITE_URL}/geifem-social-preview.jpg`;

const setMeta = (attr, key, content) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setCanonical = (href) => {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

/**
 * Sets document title + meta description/OG/Twitter tags for the current route.
 * This app is a client-rendered SPA (no SSR), so this only helps crawlers that
 * execute JS (Googlebot does); it does not fix title/meta in the raw HTML response.
 */
export const useSEO = ({ title, description, path = '', image, type = 'website' }) => {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} Consultoría Especializada`;
    const url = `${SITE_URL}${path}`;
    const ogImage = image || DEFAULT_IMAGE;

    document.title = fullTitle;

    setMeta('name', 'description', description);
    setCanonical(url);

    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:site_name', SITE_NAME);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);
  }, [title, description, path, image, type]);
};
