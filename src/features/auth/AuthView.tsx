import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getActiveFirebaseConfig, updateCustomFirebaseConfig, resetToDefaultFirebaseConfig } from '../../firebase/config';
import {
  ClipboardCheck,
  LogIn,
  AlertCircle,
  KeyRound,
  Settings,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('khalid.a.kh990@gmail.com');
  const [password, setPassword] = useState('Khalid@5452');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Custom Firebase project settings modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configJson, setConfigJson] = useState('');
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);

  const activeConfig = getActiveFirebaseConfig();

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
      // Handled in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillAdmin = () => {
    setEmail('khalid.a.kh990@gmail.com');
    setPassword('Khalid@5452');
    clearError();
    setLocalError(null);
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(configJson);
      if (!parsed.projectId || !parsed.apiKey) {
        throw new Error('يجب أن يحتوي التكوين على projectId و apiKey كحد أدنى.');
      }
      updateCustomFirebaseConfig(parsed);
      setConfigSuccess('تم حفظ إعدادات مشروعك في Firebase بنجاح!');
      setTimeout(() => {
        setShowConfigModal(false);
      }, 1500);
    } catch (err: any) {
      setLocalError(err.message || 'صيغة JSON غير صحيحة.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-8 relative">
      {/* Top Firebase Settings Link */}
      <button
        onClick={() => {
          setConfigJson(JSON.stringify(activeConfig, null, 2));
          setShowConfigModal(true);
        }}
        className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 bg-white/80 hover:bg-white rounded-xl border border-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
        title="إعدادات ربط مشروع Firebase"
      >
        <Settings className="w-4 h-4 text-emerald-600" />
        <span>ربط مشروع Firebase الخاص بك</span>
      </button>

      <div className="max-w-md w-full">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-emerald-600 items-center justify-center text-white shadow-md mb-3">
            <ClipboardCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">جولات الصيانة</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6 pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">تسجيل الدخول</h2>
            <span className="text-xs text-slate-400 font-medium">النظام الداخلي</span>
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
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hospital.sa"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور</label>
              <input
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <span>جاري التحقق...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>

          {/* Initial Pre-configured Account Helper */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">الحساب الرئيسي: خالد</span>
            <button
              type="button"
              onClick={handleFillAdmin}
              className="text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>تعبئة بيانات المدير</span>
            </button>
          </div>
        </div>

        {/* Connected Project Indicator */}
        <div className="text-center mt-3 text-[11px] text-slate-400 font-mono" dir="ltr">
          Firebase Project: {activeConfig.projectId || 'connected'}
        </div>
      </div>

      {/* Modal: Custom Firebase Project Keys */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">ربط مشروع Firebase الخاص بك</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFirebaseConfig} className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                إذا قمت بإنشاء مشروع خاص بك في Firebase Console، يمكنك لصق كود الإعدادات (firebaseConfig) هنا للربط المباشر:
              </p>

              {configSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{configSuccess}</span>
                </div>
              )}

              <textarea
                rows={8}
                dir="ltr"
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
                placeholder={`{\n  "apiKey": "AIzaSy...",\n  "projectId": "your-project-id",\n  "authDomain": "your-project.firebaseapp.com"\n}`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-emerald-500 bg-slate-50"
              />

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  حفظ وتطبيق التكوين
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetToDefaultFirebaseConfig();
                  }}
                  className="py-2 px-3 text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="استعادة المشروع الافتراضي"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة الافتراضي</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
