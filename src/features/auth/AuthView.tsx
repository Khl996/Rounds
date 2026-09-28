import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardCheck, LogIn, AlertCircle } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      // handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-sky-500 items-center justify-center text-white shadow-md mb-3">
            <ClipboardCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">الجولات الإشرافية</h1>
          <p className="text-xs text-slate-500 mt-1">نظام داخلي مرتبط بـ Firebase</p>
        </div>

        <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-6 sm:p-8">
          <div className="mb-6 pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">تسجيل الدخول</h2>
            <span className="text-xs text-slate-400 font-medium">حساب مصرح فقط</span>
          </div>

          {(error || localError) && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{localError || error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                autoComplete="username"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hospital.sa"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-left focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-left focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? 'جاري التحقق...' : <><LogIn className="w-4 h-4" /><span>تسجيل الدخول</span></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
