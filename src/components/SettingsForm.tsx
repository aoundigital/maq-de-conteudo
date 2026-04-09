import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Save, Eye, EyeOff, CheckCircle2, XCircle,
  ChevronDown, Bot, Image as ImageIcon, Database, Zap,
} from 'lucide-react';
import { AppSettings, AI_MODELS, AIProvider } from '../types';
import { isSupabaseConfigured } from '../services/supabaseService';

interface SettingsFormProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

interface KeyFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  color: string;
  linkUrl?: string;
  linkLabel?: string;
}

function KeyField({ id, label, value, onChange, placeholder, color, linkUrl, linkLabel }: KeyFieldProps) {
  const [show, setShow] = useState(false);
  const hasKey = value.trim().length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <label className={`text-xs font-bold uppercase tracking-widest ${color}`} htmlFor={id}>
          {label}
        </label>
        <div className="flex items-center gap-2">
          {linkUrl && (
            <a href={linkUrl} target="_blank" rel="noopener" className="text-[10px] text-blue-500 hover:underline">
              {linkLabel ?? 'Obter chave'}
            </a>
          )}
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
  const [local, setLocal] = React.useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);

  const updateKey = (provider: keyof AppSettings['aiKeys'], value: string) => {
    setLocal(prev => ({ ...prev, aiKeys: { ...prev.aiKeys, [provider]: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const countByProvider = (p: AIProvider) => AI_MODELS.filter(m => m.provider === p).length;

  return (
    <div className="max-w-2xl mx-auto pb-12 px-4 md:px-0">
      <section className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-serif italic text-on-surface mb-3">Configurações</h1>
        <p className="text-secondary text-sm md:text-base leading-relaxed max-w-lg">
          Personalize o comportamento da Máquina de Conteúdo e gerencie suas credenciais de acesso às IAs.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Status Supabase ── */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${
          isSupabaseConfigured()
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <Database className="w-4 h-4 flex-shrink-0" />
          {isSupabaseConfigured()
            ? '✅ Banco de dados Supabase conectado — configurações e histórico salvos na nuvem.'
            : '⚠️ Supabase não configurado — dados salvos localmente no navegador. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ao .env para ativar a nuvem.'}
        </div>

        {/* ── Seção: Editorial ── */}
        <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_12px_40px_rgba(11,28,48,0.04)] space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">Parâmetros Editoriais</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mínimo de Palavras */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="minWords">
                Mínimo de Palavras
              </label>
              <input
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                id="minWords"
                type="number"
                min="300"
                max="5000"
                step="100"
                value={local.minWords}
                onChange={e => setLocal({ ...local, minWords: Math.max(300, parseInt(e.target.value) || 300) })}
                required
              />
              <p className="text-[11px] text-outline mt-1.5">Recomendado: 800–2000 palavras</p>
            </div>

            {/* Tom */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="tone">
                Tom da Escrita
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface text-base focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer pr-10"
                  id="tone"
                  value={local.tone}
                  onChange={e => setLocal({ ...local, tone: e.target.value })}
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
            {/* Público-Alvo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="targetAudience">
                Público-Alvo
              </label>
              <input
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface text-base focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/40"
                id="targetAudience"
                type="text"
                placeholder="Ex: Profissionais de TI, leitores curiosos, mães de primeira viagem..."
                value={local.targetAudience}
                onChange={e => setLocal({ ...local, targetAudience: e.target.value })}
                required
              />
            </div>

            {/* Nível de Linguagem */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="languageLevel">
                Nível de Linguagem
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface text-base focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer pr-10"
                  id="languageLevel"
                  value={local.languageLevel}
                  onChange={e => setLocal({ ...local, languageLevel: e.target.value })}
                >
                  <option value="Acessível (para todos)">Acessível (para todos)</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado/Acadêmico">Avançado/Acadêmico</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
            <input
              type="checkbox"
              id="includeFAQ"
              className="w-5 h-5 text-primary border-outline-variant rounded focus:ring-primary cursor-pointer"
              checked={local.includeFAQ}
              onChange={e => setLocal({ ...local, includeFAQ: e.target.checked })}
            />
            <label htmlFor="includeFAQ" className="text-on-surface font-medium cursor-pointer text-sm">
              Incluir seção de Perguntas Frequentes (FAQ) ao final dos artigos
            </label>
          </div>
        </div>

        {/* ── Seção: Imagens ── */}
        <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_12px_40px_rgba(11,28,48,0.04)] space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">Imagens dos Artigos</span>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            As imagens são buscadas automaticamente usando a API Pollinations, hospedadas permanentemente no ImgBB (se configurado), e inseridas por meio de uma inteligência artificial otimizada com base na palavra-chave principal do artigo.
            Use o campo abaixo para refinar o estilo visual e obter imagens mais relevantes.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="imageStyle">
              Estilo Visual das Imagens
            </label>
            <textarea
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface text-sm placeholder:text-outline/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              id="imageStyle"
              rows={2}
              placeholder='Ex: "fotografia profissional, fundo limpo" ou "natureza tropical, cores vibrantes" ou "tecnologia, escritório moderno"'
              value={local.imageStyle ?? ''}
              onChange={e => setLocal({ ...local, imageStyle: e.target.value })}
            />
            <p className="text-[11px] text-outline mt-1.5">
              Se vazio, a busca usará apenas a palavra-chave principal do artigo. Quanto mais específico, melhor a relevância da imagem.
            </p>
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

          {/* Google Gemini */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🟢</span>
              <span className="text-sm font-semibold text-emerald-800">Google Gemini</span>
              <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">{countByProvider('gemini')} modelos</span>
            </div>
            <KeyField
              id="geminiKey" label="Chave Gemini (GEMINI_API_KEY)"
              value={local.aiKeys.geminiKey} onChange={v => updateKey('geminiKey', v)}
              placeholder="AIzaSy..." color="text-emerald-700"
              linkUrl="https://aistudio.google.com/app/apikey" linkLabel="Google AI Studio"
            />
          </div>

          {/* OpenAI */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🔵</span>
              <span className="text-sm font-semibold text-blue-800">OpenAI</span>
              <span className="ml-auto text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-medium">{countByProvider('openai')} modelos</span>
            </div>
            <KeyField
              id="openaiKey" label="Chave OpenAI (OPENAI_API_KEY)"
              value={local.aiKeys.openaiKey} onChange={v => updateKey('openaiKey', v)}
              placeholder="sk-proj-..." color="text-blue-700"
              linkUrl="https://platform.openai.com/api-keys" linkLabel="OpenAI Platform"
            />
          </div>

          {/* Anthropic */}
          <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/30 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🟠</span>
              <span className="text-sm font-semibold text-orange-800">Anthropic Claude</span>
              <span className="ml-auto text-[10px] text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-medium">{countByProvider('anthropic')} modelos</span>
            </div>
            <KeyField
              id="anthropicKey" label="Chave Anthropic (ANTHROPIC_API_KEY)"
              value={local.aiKeys.anthropicKey} onChange={v => updateKey('anthropicKey', v)}
              placeholder="sk-ant-..." color="text-orange-700"
              linkUrl="https://console.anthropic.com/settings/keys" linkLabel="Anthropic Console"
            />
          </div>

          {/* Groq */}
          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🟣</span>
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">Groq — Ultra-Rápido</span>
              <span className="ml-auto text-[10px] text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full font-medium">{countByProvider('groq')} modelos</span>
            </div>
            <p className="text-[11px] text-purple-700 -mt-1">Inferência extremamente rápida. Free tier generoso. Ideal para alto volume.</p>
            <KeyField
              id="groqKey" label="Chave Groq (GROQ_API_KEY)"
              value={local.aiKeys.groqKey} onChange={v => updateKey('groqKey', v)}
              placeholder="gsk_..." color="text-purple-700"
              linkUrl="https://console.groq.com/keys" linkLabel="Groq Console"
            />
          </div>

          {/* Mistral */}
          <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🔶</span>
              <span className="text-sm font-semibold text-rose-800">Mistral AI</span>
              <span className="ml-auto text-[10px] text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full font-medium">{countByProvider('mistral')} modelos</span>
            </div>
            <p className="text-[11px] text-rose-700 -mt-1">Alta qualidade em múltiplos idiomas. Excelente custo-benefício para português.</p>
            <KeyField
              id="mistralKey" label="Chave Mistral (MISTRAL_API_KEY)"
              value={local.aiKeys.mistralKey} onChange={v => updateKey('mistralKey', v)}
              placeholder="..." color="text-rose-700"
              linkUrl="https://console.mistral.ai/api-keys/" linkLabel="Mistral Console"
            />
          </div>

          {/* ImgBB */}
          <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/30 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🖼️</span>
              <span className="text-sm font-semibold text-teal-800">Hospedagem ImgBB (Imagens IA)</span>
            </div>
            <p className="text-[11px] text-teal-700 -mt-1">Usado para hospedar as imagens geradas pela IA e incluí-las nos artigos permanentemente.</p>
            <KeyField
              id="imgbbKey" label="Chave de API do ImgBB"
              value={local.aiKeys.imgbbKey ?? ''} onChange={v => updateKey('imgbbKey', v)}
              placeholder="Sua chave API ImgBB..." color="text-teal-700"
              linkUrl="https://api.imgbb.com/" linkLabel="Criar chave gratuita do ImgBB"
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
