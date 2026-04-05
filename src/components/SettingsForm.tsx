import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Eye, EyeOff, CheckCircle2, XCircle, ChevronDown, Bot } from 'lucide-react';
import { AppSettings, AI_MODELS, AIProvider } from '../types';

interface SettingsFormProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

interface KeyFieldProps {
  id: string;
  label: string;
  provider: AIProvider;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  color: string;
}

function KeyField({ id, label, value, onChange, placeholder, color }: KeyFieldProps) {
  const [show, setShow] = useState(false);
  const hasKey = value.trim().length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={`text-xs font-bold uppercase tracking-widest ${color}`} htmlFor={id}>
          {label}
        </label>
        {hasKey ? (
          <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> Configurada
          </span>
        ) : (
          <span className="flex items-center gap-1 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" /> Não configurada
          </span>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="w-full bg-surface-container-low rounded-lg px-4 py-3 pr-11 text-on-surface text-sm font-mono border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/40"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Ocultar chave' : 'Mostrar chave'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsForm({ settings, onSave }: SettingsFormProps) {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);

  const updateKey = (provider: keyof AppSettings['aiKeys'], value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      aiKeys: { ...prev.aiKeys, [provider]: value }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const geminiModelCount = AI_MODELS.filter(m => m.provider === 'gemini').length;
  const openaiModelCount = AI_MODELS.filter(m => m.provider === 'openai').length;
  const anthropicModelCount = AI_MODELS.filter(m => m.provider === 'anthropic').length;

  return (
    <div className="max-w-2xl mx-auto pb-12 px-4 md:px-0">
      <section className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-serif italic text-on-surface mb-3">Configurações</h1>
        <p className="text-secondary text-sm md:text-base leading-relaxed max-w-lg">
          Personalize o comportamento da Máquina de Conteúdo e gerencie suas credenciais de acesso às IAs.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Seção: Editorial ── */}
        <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_12px_40px_rgba(11,28,48,0.04)] space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">Parâmetros Editoriais</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="minWords">
                Mínimo de Palavras
              </label>
              <input
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                id="minWords"
                type="number"
                min="300"
                max="3000"
                step="100"
                value={localSettings.minWords}
                onChange={e => setLocalSettings({ ...localSettings, minWords: parseInt(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="tone">
                Tom da Escrita
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface text-base focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer pr-10"
                  id="tone"
                  value={localSettings.tone}
                  onChange={e => setLocalSettings({ ...localSettings, tone: e.target.value })}
                >
                  <option value="Jornalístico Formal">Jornalístico Formal</option>
                  <option value="Conversacional e Leve">Conversacional e Leve</option>
                  <option value="Técnico e Especializado">Técnico e Especializado</option>
                  <option value="Persuasivo e de Vendas">Persuasivo e de Vendas</option>
                  <option value="Narrativo e Storytelling">Narrativo e Storytelling</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="targetAudience">
                Público-Alvo
              </label>
              <input
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface text-base focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/40"
                id="targetAudience"
                type="text"
                placeholder="Ex: Profissionais de TI"
                value={localSettings.targetAudience}
                onChange={e => setLocalSettings({ ...localSettings, targetAudience: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="languageLevel">
                Nível de Linguagem
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface text-base focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer pr-10"
                  id="languageLevel"
                  value={localSettings.languageLevel}
                  onChange={e => setLocalSettings({ ...localSettings, languageLevel: e.target.value })}
                >
                  <option value="Acessível (para todos)">Acessível (para todos)</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado/Acadêmico">Avançado/Acadêmico</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
            <input
              type="checkbox"
              id="includeFAQ"
              className="w-5 h-5 text-primary border-outline-variant rounded focus:ring-primary cursor-pointer"
              checked={localSettings.includeFAQ}
              onChange={e => setLocalSettings({ ...localSettings, includeFAQ: e.target.checked })}
            />
            <label htmlFor="includeFAQ" className="text-on-surface font-medium cursor-pointer text-sm">
              Incluir seção de Perguntas Frequentes (FAQ) ao final dos artigos
            </label>
          </div>
        </div>

        {/* ── Seção: Chaves de API ── */}
        <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_12px_40px_rgba(11,28,48,0.04)] space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">Inteligências Artificiais</span>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed -mt-2">
            As chaves são armazenadas localmente no seu navegador e nunca enviadas a terceiros. Configure apenas os provedores que deseja usar.
          </p>

          {/* Gemini */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🟢</span>
              <span className="text-sm font-semibold text-emerald-800">Google Gemini</span>
              <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">{geminiModelCount} modelos</span>
            </div>
            <KeyField
              id="geminiKey"
              label="Chave Gemini (GEMINI_API_KEY)"
              provider="gemini"
              value={localSettings.aiKeys.geminiKey}
              onChange={v => updateKey('geminiKey', v)}
              placeholder="AIzaSy..."
              color="text-emerald-700"
            />
          </div>

          {/* OpenAI */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🔵</span>
              <span className="text-sm font-semibold text-blue-800">OpenAI</span>
              <span className="ml-auto text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-medium">{openaiModelCount} modelos</span>
            </div>
            <KeyField
              id="openaiKey"
              label="Chave OpenAI (OPENAI_API_KEY)"
              provider="openai"
              value={localSettings.aiKeys.openaiKey}
              onChange={v => updateKey('openaiKey', v)}
              placeholder="sk-proj-..."
              color="text-blue-700"
            />
          </div>

          {/* Anthropic */}
          <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/30 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🟠</span>
              <span className="text-sm font-semibold text-orange-800">Anthropic Claude</span>
              <span className="ml-auto text-[10px] text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-medium">{anthropicModelCount} modelos</span>
            </div>
            <KeyField
              id="anthropicKey"
              label="Chave Anthropic (ANTHROPIC_API_KEY)"
              provider="anthropic"
              value={localSettings.aiKeys.anthropicKey}
              onChange={v => updateKey('anthropicKey', v)}
              placeholder="sk-ant-..."
              color="text-orange-700"
            />
          </div>
        </div>

        {/* ── Botão Salvar ── */}
        <button
          type="submit"
          className={`w-full font-bold py-5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
            saved
              ? 'bg-emerald-500 text-white shadow-emerald-200'
              : 'bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-primary/20 hover:brightness-110'
          }`}
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Salvo com sucesso!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar Configurações
            </>
          )}
        </button>
      </form>
    </div>
  );
}
