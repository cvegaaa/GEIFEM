import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, Clock, Loader2, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useSEO } from '../hooks/useSEO';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const isHtmlContent = (content) => /<\/?[a-z][\s\S]*>/i.test(content || '');

export const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useSEO({
    title: article?.title,
    description: article?.excerpt,
    image: article?.image,
    path: `/insights/${id}`,
    type: 'article'
  });

  useEffect(() => {
    setLoading(true);
    setError('');
    axios.get(`${API}/articles/${id}`)
      .then(res => setArticle(res.data))
      .catch(() => setError('No pudimos encontrar este artículo. Puede que haya sido movido o despublicado.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#003057]" size={32} />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center text-center px-4">
        <p className="text-xl text-gray-600 mb-6">{error}</p>
        <Button asChild className="bg-[#003057] hover:bg-[#1E5A75] text-white">
          <Link to="/insights">
            <ArrowLeft className="mr-2" size={16} />
            Volver a Insights
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#003057] to-[#1E5A75] text-white">
        <div className="absolute inset-0 opacity-20">
          <img src={article.image} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link
            to="/insights"
            className="inline-flex items-center text-sm text-gray-200 hover:text-[#CBA55A] transition-colors mb-6"
          >
            <ArrowLeft className="mr-2" size={16} />
            Volver a Insights
          </Link>

          <span className="inline-block bg-[#CBA55A] text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-4">
            {article.category}
          </span>

          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-200">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{new Date(article.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{article.read_time}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured image */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-xl text-gray-600 leading-relaxed mb-8 font-medium">{article.excerpt}</p>

        {isHtmlContent(article.content) ? (
          <div
            className="text-gray-700 leading-relaxed space-y-4
              [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-[#003057] [&_h1]:mt-8 [&_h1]:mb-4
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#003057] [&_h2]:mt-8 [&_h2]:mb-4
              [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[#003057] [&_h3]:mt-6 [&_h3]:mb-3
              [&_p]:mb-4 [&_a]:text-[#1E5A75] [&_a]:underline [&_a]:hover:text-[#003057]
              [&_strong]:font-semibold [&_strong]:text-[#003057]
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
              [&_blockquote]:border-l-4 [&_blockquote]:border-[#CBA55A] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600
              [&_img]:rounded-lg [&_img]:my-6"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : (
          <div className="text-gray-700 leading-relaxed space-y-4 whitespace-pre-line">
            {article.content}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Button asChild className="bg-[#003057] hover:bg-[#1E5A75] text-white">
            <Link to="/insights">
              <ArrowLeft className="mr-2" size={16} />
              Ver más artículos
            </Link>
          </Button>
        </div>
      </article>
    </div>
  );
};
