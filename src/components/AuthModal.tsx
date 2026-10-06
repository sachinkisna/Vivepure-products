import React, { useEffect, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { ViveLogo } from './ViveLogo';
import { X, Lock, Mail, User, Phone, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { setUser, showToast, setActivePage } = useShop();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setError(null);
    }
  }, [defaultMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        setUser(res.user);
        showToast(`Welcome back, ${res.user.name}!`);
        onClose();
        if (res.user.role === 'admin') {
          setActivePage('admin');
        }
      } else {
        const res = await api.register(name, email, password, phone);
        setUser(res.user);
        showToast(`Welcome to VIVEPANYA, ${res.user.name}!`);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-[#FAF8F5] rounded-3xl border border-[#DBD5C5] shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#7A8A84] hover:text-[#173F35] rounded-full hover:bg-white/80 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <ViveLogo size="lg" />
          <h2 className="font-serif text-2xl font-bold text-[#17372F] mt-3">
            {mode === 'login' ? 'Sign In to Your Account' : 'Create an Account'}
          </h2>
          <p className="text-xs text-[#6A7B74] mt-1">
            {mode === 'login'
              ? 'Access your orders, track shipments, and saved delivery addresses'
              : 'Join VIVEPANYA for authentic handcrafted wellness products'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#EFECE3] p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#173F35] shadow-xs'
                : 'text-[#6A7B74] hover:text-[#173F35]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-[#173F35] shadow-xs'
                : 'text-[#6A7B74] hover:text-[#173F35]'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#2C4039] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#7A8A84] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sundaram"
                  className="w-full bg-white border border-[#DBD5C5] rounded-xl py-2 pl-9 pr-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#2C4039] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7A8A84] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white border border-[#DBD5C5] rounded-xl py-2 pl-9 pr-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#2C4039] mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#7A8A84] absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 00000"
                  className="w-full bg-white border border-[#DBD5C5] rounded-xl py-2 pl-9 pr-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#2C4039] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7A8A84] absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={mode === 'register' ? 8 : undefined}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#DBD5C5] rounded-xl py-2 pl-9 pr-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-[#173F35] text-white text-xs font-semibold rounded-xl hover:bg-[#235D4E] disabled:opacity-60 transition-colors shadow-sm cursor-pointer"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

      </div>
    </div>
  );
};
