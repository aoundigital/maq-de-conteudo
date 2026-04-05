import { useState, useEffect } from 'react';
import { BookOpen, FilePenLine, History as HistoryIcon, LogOut, Settings as SettingsIcon } from 'lucide-react';
import Login from './components/Login';
import CreateForm from './components/CreateForm';
import History from './components/History';
import SettingsForm from './components/SettingsForm';
import { HistoryItem, AppSettings } from './types';
import { cn } from './lib/utils';

const DEFAULT_SETTINGS: AppSettings = {
  minWords: 800,
  tone: 'Jornalístico Formal',
  targetAudience: 'Público Geral',
  languageLevel: 'Acessível (para todos)',
  includeFAQ: false,
  selectedModel: 'gemini-2.0-flash',
  aiKeys: {
    geminiKey: '',
    openaiKey: '',
    anthropicKey: '',
  },
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'settings'>('create');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load history and settings from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('maquina_conteudo_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch { /* ignore */ }
    }

    const savedSettings = localStorage.getItem('maquina_conteudo_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as Partial<AppSettings>;
        // Merge with defaults to handle missing keys after updates
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
  }, []);

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('maquina_conteudo_history', JSON.stringify(newHistory));
  };

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('maquina_conteudo_settings', JSON.stringify(newSettings));
  };

  const handleAddHistory = (item: HistoryItem) => {
    const newHistory = [item, ...history];
    saveHistory(newHistory);
    setActiveTab('history');
  };

  const handleDeleteHistory = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      const newHistory = history.filter(item => item.id !== id);
      saveHistory(newHistory);
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
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
            <button
              onClick={() => setActiveTab('create')}
              className={cn(
                "text-sm font-medium px-3 py-1 rounded-lg transition-all",
                activeTab === 'create' ? "text-primary font-bold" : "text-secondary hover:bg-surface-container-low"
              )}
            >
              Criar
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "text-sm font-medium px-3 py-1 rounded-lg transition-all",
                activeTab === 'history' ? "text-primary font-bold" : "text-secondary hover:bg-surface-container-low"
              )}
            >
              Histórico
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                "text-sm font-medium px-3 py-1 rounded-lg transition-all",
                activeTab === 'settings' ? "text-primary font-bold" : "text-secondary hover:bg-surface-container-low"
              )}
            >
              Configurações
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-xs font-bold">
              MC
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
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
