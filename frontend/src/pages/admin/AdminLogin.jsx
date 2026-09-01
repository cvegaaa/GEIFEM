import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect
    const token = localStorage.getItem('geifem_admin_token');
    if (token) {
      axios.get(`${API}/admin/verify`, { headers: { 'X-Admin-Token': token } })
        .then(() => navigate('/admin/dashboard'))
        .catch(() => localStorage.removeItem('geifem_admin_token'));
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/admin/login`, { password });
      if (res.data?.token) {
        localStorage.setItem('geifem_admin_token', res.data.token);
        localStorage.setItem('geifem_admin_expires', res.data.expires_at);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003057] via-[#1E5A75] to-[#003057] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0" data-testid="admin-login-card">
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#003057] to-[#1E5A75] rounded-full flex items-center justify-center">
            <ShieldCheck className="text-[#CBA55A]" size={32} />
          </div>
          <div>
            <CardTitle className="text-2xl text-[#003057]">Panel Administrativo</CardTitle>
            <CardDescription className="mt-2">GEIFEM · Acceso Restringido</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#003057] font-semibold">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                  placeholder="Ingrese su contraseña"
                  required
                  autoFocus
                  data-testid="admin-password-input"
                />
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-800 text-sm" data-testid="admin-login-error">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#CBA55A] hover:bg-[#b8944d] text-white h-12"
              data-testid="admin-login-submit"
            >
              {loading ? <><Loader2 className="mr-2 animate-spin" size={18} />Verificando...</> : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
