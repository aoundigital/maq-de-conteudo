import React, { useState } from 'react';
import { BookOpen, UserCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock login
    if (email && password) {
      onLogin();
    }
  };

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
                />
                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-outline-variant/30"></div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 px-6 rounded-xl font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-[0.98] hover:brightness-110 transition-all duration-200"
            >
              Entrar na Redação
            </button>

            <div className="flex flex-col items-center gap-4 pt-4">
              <button type="button" className="text-primary text-sm font-medium hover:underline transition-all">
                Esqueceu sua senha?
              </button>
              <div className="flex items-center gap-2 w-full">
                <div className="h-[1px] flex-1 bg-outline-variant/20"></div>
                <span className="text-[10px] text-outline uppercase tracking-[0.2em]">ou</span>
                <div className="h-[1px] flex-1 bg-outline-variant/20"></div>
              </div>
              <p className="text-on-surface-variant text-sm">
                Ainda não tem acesso? 
                <button type="button" className="text-primary font-bold ml-1 hover:underline">Solicitar convite</button>
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
          <p className="text-outline text-[11px] max-w-[280px] mx-auto leading-relaxed">
            Este ambiente é restrito a editores e curadores autorizados pela diretoria de conteúdo.
          </p>
        </footer>
      </main>

      <div className="fixed top-0 left-0 w-full h-1 bg-primary"></div>
    </div>
  );
}
