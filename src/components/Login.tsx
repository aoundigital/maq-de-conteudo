import React, { useState, useCallback } from 'react';
import { BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { signIn, isSupabaseConfigured } from '../services/supabaseService';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

interface LoginProps {
  onLogin: (email: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Rate limiting state (stored in sessionStorage for persistence across re-renders)
  const getAttemptData = () => {
    try {
      return JSON.parse(sessionStorage.getItem('login_attempts') ?? '{"count":0,"lockedUntil":null}');
    } catch {
      return { count: 0, lockedUntil: null };
    }
  };

  const setAttemptData = (data: { count: number; lockedUntil: number | null }) => {
    sessionStorage.setItem('login_attempts', JSON.stringify(data));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- Rate limiting check ---
    const attempts = getAttemptData();
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      setError(`Muitas tentativas. Aguarde ${remaining} segundos para tentar novamente.`);
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Banco de dados não configurado. Contate o administrador.');
      return;
    }

    setLoading(true);

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setLoading(false);

      // Increment failed attempts
      const newCount = (attempts.count ?? 0) + 1;
      const newData = {
        count: newCount,
        lockedUntil: newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : null,
      };
      setAttemptData(newData);

      if (newCount >= MAX_ATTEMPTS) {
        setError(`Conta bloqueada por 5 minutos após ${MAX_ATTEMPTS} tentativas incorretas.`);
      } else {
        setError(`E-mail ou senha incorretos. (${newCount}/${MAX_ATTEMPTS} tentativas)`);
      }
      return;
    }

    // Reset attempts on success
    setAttemptData({ count: 0, lockedUntil: null });
    onLogin(email);
  }, [email, password, onLogin]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-surface-container-low rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-surface-container rounded-full blur-[100px] opacity-40"></div>
      </div>

      <main className="w-full max-w-[420px] space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <BookOpen className="text-primary w-10 h-10" />
          </div>
          <h1 className="newsreader italic text-4xl font-semibold text-primary tracking-tight">
            Máquina de Conteúdo
          </h1>
          <p className="text-on-surface-variant text-sm tracking-wide opacity-80 uppercase font-bold">
            Plataforma Editorial de Prestígio
          </p>
        </header>

        <section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_40px_80px_rgba(11,28,48,0.04)] border border-outline-variant/10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-1">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest ml-1" htmlFor="email">
                E-mail Corporativo
              </label>
              <div className="relative group">
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3.5 text-on-surface placeholder:text-outline/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-outline-variant/30"></div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest ml-1" htmlFor="password">
                Senha de Acesso
              </label>
              <div className="relative group">
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3.5 text-on-surface placeholder:text-outline/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-outline-variant/30"></div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 px-6 rounded-xl font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-[0.98] hover:brightness-110 transition-all duration-200 flex items-center justify-center gap-2",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Entrar na Redação'
              )}
            </button>

            <div className="flex flex-col items-center gap-4 pt-2">
              <p className="text-on-surface-variant text-xs text-center leading-relaxed max-w-[280px] opacity-70">
                Acesso restrito a editores autorizados pela diretoria de conteúdo.
              </p>
            </div>
          </form>
        </section>

        <footer className="text-center space-y-6">
          <div className="flex justify-center gap-8 opacity-60">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Autoridade</span>
              <span className="newsreader italic text-lg text-on-surface">Digital</span>
            </div>
            <div className="w-[1px] h-8 bg-outline-variant/30"></div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Curadoria</span>
              <span className="newsreader italic text-lg text-on-surface">Analítica</span>
            </div>
          </div>
        </footer>
      </main>

      <div className="fixed top-0 left-0 w-full h-1 bg-primary"></div>
    </div>
  );
}
