import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { NewsTicker } from "./components/NewsTicker";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Servicios } from "./pages/Servicios";
import { Industrias } from "./pages/Industrias";
import { Insights } from "./pages/Insights";
import { ArticleDetail } from "./pages/ArticleDetail";
import { Contacto } from "./pages/Contacto";
import { PoliticaPrivacidad } from "./pages/PoliticaPrivacidad";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminLeads } from "./pages/admin/AdminLeads";
import { AdminArticles } from "./pages/admin/AdminArticles";
import { AdminArticleForm } from "./pages/admin/AdminArticleForm";
import { AdminNewsletter } from "./pages/admin/AdminNewsletter";

// Public site layout (with header, ticker, footer)
const PublicLayout = ({ children }) => (
  <>
    <Header />
    <NewsTicker />
    <div className="pt-11">{children}</div>
    <Footer />
  </>
);

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Admin routes (no public header/footer) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="articles/:id" element={<AdminArticleForm />} />
            <Route path="newsletter" element={<AdminNewsletter />} />
          </Route>

          {/* Public site routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/servicios" element={<PublicLayout><Servicios /></PublicLayout>} />
          <Route path="/industrias" element={<PublicLayout><Industrias /></PublicLayout>} />
          <Route path="/insights" element={<PublicLayout><Insights /></PublicLayout>} />
          <Route path="/insights/:id" element={<PublicLayout><ArticleDetail /></PublicLayout>} />
          <Route path="/contacto" element={<PublicLayout><Contacto /></PublicLayout>} />
          <Route path="/politica-de-privacidad" element={<PublicLayout><PoliticaPrivacidad /></PublicLayout>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
