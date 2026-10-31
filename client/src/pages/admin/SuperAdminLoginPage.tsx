import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ShieldCheck, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

export const SuperAdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      // Check if user is super admin
      const token = localStorage.getItem('qubix_access_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.isSuperAdmin) {
            navigate('/admin');
            return;
          }
        } catch (e) {
          // ignore
        }
      }
      // If not super admin, reject and log out
      await logout();
      setError('Access Denied: Your account does not possess Platform Super Admin privileges.');
    } else {
      setError(res.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const fillSuperAdmin = () => {
    setEmail('admin@qubix.io');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto mb-2 shadow-lg shadow-purple-900/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            QubixDesk Super Admin
          </h2>
          <p className="text-xs text-slate-400">
            Centralized SaaS Control Plane & Global Operations
          </p>
        </div>

        {/* Security Warning Notice */}
        <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-3 text-[11px] text-purple-300 leading-relaxed flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <span>
            Restricted access portal for authorized platform operators. All authentication attempts and actions are cryptographically audited.
          </span>
        </div>

        {/* Demo Fast Fill */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-300 block">Super Admin Demo</span>
            <span className="text-[11px] text-slate-400 font-mono">admin@qubix.io</span>
          </div>
          <button
            type="button"
            onClick={fillSuperAdmin}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            Auto-fill
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800/60 text-red-300 text-xs rounded-lg font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Super Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@qubix.io"
              required
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 text-xs shadow-lg shadow-purple-900/30"
          >
            Authenticate to Super Admin Console
          </Button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Organization Workspace Login
          </Link>
        </div>
      </div>
    </div>
  );
};

