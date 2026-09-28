import React, { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { ErrorText, Field, inputClass } from '../../components/ui/Field';

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

    if (!email.trim() || !password) {
      setLocalError('أدخل البريد وكلمة المرور.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      // The message is shown from AuthContext.
    } finally {
      setSubmitting(false);
    }
  };

  const message = localError || error;

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-sky-600 text-white">
            <ClipboardCheck className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">الجولات الإشرافية</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
          <Field label="البريد الإلكتروني">
            <input
              type="email"
              autoComplete="username"
              inputMode="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@hospital.sa"
              className={`${inputClass} text-left`}
            />
          </Field>

          <Field label="كلمة المرور">
            <input
              type="password"
              autoComplete="current-password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} text-left`}
            />
          </Field>

          {message && <ErrorText>{message}</ErrorText>}

          <Button type="submit" size="lg" full disabled={submitting}>
            {submitting ? 'جارٍ الدخول…' : 'دخول'}
          </Button>
        </form>
      </div>
    </div>
  );
};
