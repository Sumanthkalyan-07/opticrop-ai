import React, { useState } from 'react';
import { Logo } from './Logo';
import { UserPlus, User, Lock, Eye, EyeOff, Check, X, ShieldAlert } from 'lucide-react';

interface SignupProps {
  onSuccess: (token: string, username: string, profile: any) => void;
  onNavigateToLogin: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onSuccess, onNavigateToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Security checks
  const isMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>_]/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  const isPasswordSecure = isMinLength && hasNumber && hasSymbol;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (!isPasswordSecure) {
      setError('Please create a higher security password satisfying all conditions.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
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
        backgroundImage: `linear-gradient(rgba(10, 30, 15, 0.65), rgba(5, 15, 8, 0.85)), url('https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1920&q=80')` 
      }}
    >
      <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-3xl border border-emerald-500/10 shadow-2xl p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Top ribbon decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-600 to-amber-500" />

        <div className="text-center mb-6">
          <Logo size="xl" className="mb-2" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Create a high-security Farmer account
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider block">
              Farmer Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
                <User size={18} />
              </span>
              <input
                type="text"
                placeholder="Choose unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Password (High Security) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider block">
              High Security Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200"
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

            {/* High Security Guidelines Indicator Panel */}
            <div className="mt-2 p-2.5 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl space-y-1 text-xs border border-zinc-200/50 dark:border-zinc-700/50">
              <div className="font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <ShieldAlert size={12} className="text-amber-500" />
                Security Checklist:
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-[11px]">
                <span className={`flex items-center gap-1 ${isMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-400'}`}>
                  {isMinLength ? <Check size={12} /> : <X size={12} />} At least 6 chars
                </span>
                <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-400'}`}>
                  {hasNumber ? <Check size={12} /> : <X size={12} />} Has a number (0-9)
                </span>
                <span className={`flex items-center gap-1 ${hasSymbol ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-400'}`}>
                  {hasSymbol ? <Check size={12} /> : <X size={12} />} Has a symbol (e.g. @, #)
                </span>
                <span className={`flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-400'}`}>
                  {passwordsMatch ? <Check size={12} /> : <X size={12} />} Passwords match
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider block">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Retype password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordSecure || !passwordsMatch}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-zinc-400 disabled:to-zinc-500 disabled:shadow-none text-white font-semibold rounded-2xl shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden group mt-6 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={18} className="group-hover:scale-105 transition-transform" />
                <span>Farmer Sign Up</span>
              </>
            )}
            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-200/50 dark:border-zinc-800/50 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Already registered?
          </p>
          <button
            onClick={onNavigateToLogin}
            className="mt-2 text-sm font-bold text-emerald-600 hover:text-emerald-500 hover:underline transition-all cursor-pointer"
          >
            Back to Login
          </button>
        </div>

      </div>
    </div>
  );
};
