import React, { useState } from 'react';
import { Logo } from './Logo';
import { LogIn, User, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

interface LoginProps {
  onSuccess: (token: string, username: string, profile: any) => void;
  onNavigateToSignup: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onNavigateToSignup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      onSuccess(data.token, data.username, data.profile);
    } catch (err: any) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative font-sans"
      style={{ 
        backgroundImage: `linear-gradient(rgba(10, 30, 15, 0.65), rgba(5, 15, 8, 0.85)), url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1920&q=80')` 
      }}
    >
      {/* Background overlay decorations */}
      <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-3xl border border-emerald-500/10 shadow-2xl p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Subtle top decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600" />

        <div className="text-center mb-8">
          <Logo size="xl" className="mb-2" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Smart Agricultural Production Optimization Engine
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider block">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
                <User size={18} />
              </span>
              <input
                type="text"
                placeholder="Enter farmer username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-emerald-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden group cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} className="group-hover:translate-x-0.5 transition-transform" />
                <span>Farmer Login</span>
              </>
            )}
            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-200/50 dark:border-zinc-800/50 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Don't have a farmer account yet?
          </p>
          <button
            onClick={onNavigateToSignup}
            className="mt-2 text-sm font-bold text-emerald-600 hover:text-emerald-500 hover:underline transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={14} />
            Create Farm Account
          </button>
        </div>

      </div>
    </div>
  );
};
