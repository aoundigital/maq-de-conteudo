import { useState, useEffect } from 'react';
import { BookOpen, FilePenLine, History as HistoryIcon, LogOut, Settings as SettingsIcon } from 'lucide-react';
import Login from './components/Login';
import CreateForm from './components/CreateForm';
import History from './components/History';
import SettingsForm from './components/SettingsForm';
import { HistoryItem, AppSettings } from './types';
import { cn } from './lib/utils';
import {
  saveSettingsRemote,
  loadSettingsRemote,
  saveHistoryItemRemote,
  loadHistoryRemote,
  deleteHistoryItemRemote,
  isSupabaseConfigured,
  getSession,
  signOut,
  onAuthStateChange,
} from './services/supabaseService';

const DEFAULT_SETTINGS: AppSettings = {
  minWords: 800,
  tone: 'Jornalístico Formal',
  targetAudience: 'Público Geral',
  languageLevel: 'Acessível (para todos)',
  includeFAQ: false,
  selectedModel: 'meta-llama/llama-3.3-70b-instruct:free',
  selectedImageModel: 'black-forest-labs/flux-schnell:free',
  imageStyle: '',
  temperature: 0.7,
  aiKeys: {
    openrouterKey: '',
    openaiKey: '',
    groqKey: '',
    mistralKey: '',
    imgbbKey: '',
  },
};

const LS_HISTORY = 'maquina_conteudo_history';
const LS_SETTINGS = 'maquina_conteudo_settings';
// CVE-6: Email stored in sessionStorage (cleared on tab close), not localStorage
const SESSION_EMAIL = 'maquina_conteudo_email';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'settings'>('create');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Auth: restore session via Supabase ─────────────────
  useEffect(() => {
    const bootstrapAuth = async () => {
      // If Supabase is configured, use its session management
      if (isSupabaseConfigured()) {
        const session = await getSession();
        if (session?.user?.email) {
          setUserEmail(session.user.email);
          setIsAuthenticated(true);
        }
      } else {
        // Fallback: local session via sessionStorage (tab-scoped)
        const savedEmail = sessionStorage.getItem(SESSION_EMAIL);
        if (savedEmail) {
          setUserEmail(savedEmail);
          setIsAuthenticated(true);
        }
      }
      setAuthLoading(false);
    };

    bootstrapAuth();

    // Subscribe to auth state changes (handles token refresh, signout in other tabs, etc.)
    const { data: { subscription } } = onAuthStateChange((session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setIsAuthenticated(true);
      } else {
        setUserEmail('');
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load local data on mount ───────────────────────────
  useEffect(() => {
    const savedSettings = localStorage.getItem(LS_SETTINGS);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as Partial<AppSettings>;
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          aiKeys: {
            ...DEFAULT_SETTINGS.aiKeys,
            ...(parsed.aiKeys ?? {}),
          },
        });
      } catch { /* ignore */ }
    }

    const savedHistory = localStorage.getItem(LS_HISTORY);
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch { /* ignore */ }
    }
  }, []);

  // ── Sync from Supabase after login ────────────────────
  useEffect(() => {
    if (!isAuthenticated || !userEmail || !isSupabaseConfigured()) return;

    (async () => {
      const remoteSettings = await loadSettingsRemote(userEmail);
      if (remoteSettings) {
        const merged = {
          ...DEFAULT_SETTINGS,
          ...remoteSettings,
          aiKeys: { ...DEFAULT_SETTINGS.aiKeys, ...(remoteSettings.aiKeys ?? {}) },
        };
        setSettings(merged);
        localStorage.setItem(LS_SETTINGS, JSON.stringify(merged));
      }

      const remoteHistory = await loadHistoryRemote(userEmail);
      if (remoteHistory.length > 0) {
        setHistory(remoteHistory);
        localStorage.setItem(LS_HISTORY, JSON.stringify(remoteHistory));
      }
    })();
  }, [isAuthenticated, userEmail]);

  // ── Persistence helpers ───────────────────────────────
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem(LS_HISTORY, JSON.stringify(newHistory));
  };

  const saveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(LS_SETTINGS, JSON.stringify(newSettings));
    if (userEmail) await saveSettingsRemote(userEmail, newSettings);
  };

  const handleAddHistory = async (item: HistoryItem) => {
    const newHistory = [item, ...history];
    saveHistory(newHistory);
    if (userEmail) await saveHistoryItemRemote(userEmail, item);
    setActiveTab('history');
  };

  const handleDeleteHistory = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      const newHistory = history.filter(item => item.id !== id);
      saveHistory(newHistory);
      await deleteHistoryItemRemote(id);
    }
  };

  const handleLogin = (email: string) => {
    setUserEmail(email);
    sessionStorage.setItem(SESSION_EMAIL, email); // tab-scoped, not persistent
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await signOut();
    setIsAuthenticated(false);
    setUserEmail('');
    sessionStorage.removeItem(SESSION_EMAIL);
    // Clear sensitive cached data on logout
    setSettings(DEFAULT_SETTINGS);
    setHistory([]);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="text-primary w-6 h-6" />
            <h1 className="newsreader italic font-semibold text-xl text-primary tracking-tight">
              Máquina de Conteúdo
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {(['create', 'history', 'settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-sm font-medium px-3 py-1 rounded-lg transition-all",
                  activeTab === tab ? "text-primary font-bold" : "text-secondary hover:bg-surface-container-low"
                )}
              >
                {tab === 'create' ? 'Criar' : tab === 'history' ? 'Histórico' : 'Configurações'}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="hidden md:block text-xs text-outline truncate max-w-[160px]">{userEmail}</span>
            )}
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-xs font-bold">
              {userEmail ? userEmail[0].toUpperCase() : 'MC'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 text-secondary hover:text-red-600 rounded-full transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-32 md:pb-12">
        {activeTab === 'create' ? (
          <CreateForm settings={settings} onSuccess={handleAddHistory} />
        ) : activeTab === 'history' ? (
          <History items={history} onDelete={handleDeleteHistory} />
        ) : (
          <SettingsForm settings={settings} onSave={saveSettings} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white flex justify-around items-center px-4 py-3 pb-safe z-50 rounded-t-xl shadow-[0_-4px_20px_rgba(0,0,0,0.04)] border-t border-outline-variant/10">
        <button
          onClick={() => setActiveTab('create')}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all active:scale-90",
            activeTab === 'create' ? "text-primary font-bold bg-primary/5" : "text-outline"
          )}
        >
          <FilePenLine className={cn("w-6 h-6", activeTab === 'create' && "fill-current")} />
          <span className="text-[11px] uppercase tracking-wider">Criar</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all active:scale-90",
            activeTab === 'history' ? "text-primary font-bold bg-primary/5" : "text-outline"
          )}
        >
          <HistoryIcon className={cn("w-6 h-6", activeTab === 'history' && "fill-current")} />
          <span className="text-[11px] uppercase tracking-wider">Histórico</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all active:scale-90",
            activeTab === 'settings' ? "text-primary font-bold bg-primary/5" : "text-outline"
          )}
        >
          <SettingsIcon className={cn("w-6 h-6", activeTab === 'settings' && "fill-current")} />
          <span className="text-[11px] uppercase tracking-wider">Config</span>
        </button>
      </nav>

      {/* Decorative Background */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-1/2 bg-gradient-to-bl from-primary/5 to-transparent blur-3xl pointer-events-none" />
    </div>
  );
}
