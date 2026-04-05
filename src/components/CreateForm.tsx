import React, { useState } from 'react';
import { Star, Link as LinkIcon, Sparkles, Bot, ChevronDown, AlertTriangle } from 'lucide-react';
import { generateArticles } from '../services/aiService';
import JSZip from 'jszip';
import { HistoryItem, AppSettings, AI_MODELS, getProviderFromModel } from '../types';

interface CreateFormProps {
  settings: AppSettings;
  onSuccess: (item: HistoryItem) => void;
}

const PROVIDER_LABEL: Record<string, { label: string; emoji: string; color: string; keyField: keyof AppSettings['aiKeys'] }> = {
  gemini:    { label: 'Google Gemini', emoji: '🟢', color: 'text-emerald-700', keyField: 'geminiKey' },
  openai:    { label: 'OpenAI',        emoji: '🔵', color: 'text-blue-700',    keyField: 'openaiKey' },
  anthropic: { label: 'Anthropic',     emoji: '🟠', color: 'text-orange-700',  keyField: 'anthropicKey' },
};

export default function CreateForm({ settings, onSuccess }: CreateFormProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    clientName: '',
    quantity: 1,
    mainKeyword: '',
    otherKeywords: '',
    url: '',
  });

  const [localModel, setLocalModel] = useState(settings.selectedModel || 'gemini-2.0-flash');

  const currentProvider = getProviderFromModel(localModel);
  const currentProviderInfo = PROVIDER_LABEL[currentProvider];
  const currentHasKey = settings.aiKeys[currentProviderInfo.keyField].trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentHasKey) {
      setError(`Chave de API para ${currentProviderInfo.label} não configurada. Acesse Configurações → Inteligências Artificiais.`);
      return;
    }

    setLoading(true);
    setProgress({ current: 0, total: formData.quantity });

    try {
      // Merge localModel into settings for this generation
      const settingsWithModel: AppSettings = { ...settings, selectedModel: localModel };

      const articles = await generateArticles({ ...formData, settings: settingsWithModel });

      const zip = new JSZip();
      articles.forEach(art => zip.file(art.filename, art.content));

      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const zipName = `${formData.clientName.replace(/\s+/g, '_').toLowerCase()}_${dateStr}.zip`;

      const historyItem: HistoryItem = {
        id: crypto.randomUUID(),
        clientName: formData.clientName,
        date: new Date().toISOString(),
        quantity: formData.quantity,
        mainKeyword: formData.mainKeyword,
        zipName,
        modelUsed: localModel,
        articles: articles.map(a => ({ title: a.title, content: a.content, filename: a.filename })),
      };

      onSuccess(historyItem);

      // Auto download
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = zipName;
      link.click();

      // Reset form
      setFormData({ clientName: '', quantity: 1, mainKeyword: '', otherKeywords: '', url: '' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao gerar artigos.';
      setError(msg);
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12 px-4 md:px-0">
      <section className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-serif italic text-on-surface mb-3">Nova Pauta</h1>
        <p className="text-secondary text-sm md:text-base leading-relaxed max-w-lg">
          Preencha os detalhes abaixo e escolha o modelo de IA para gerar artigos otimizados para SEO.
        </p>
      </section>

      <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_12px_40px_rgba(11,28,48,0.04)] mb-8">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Modelo de IA ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="aiModel">
              Modelo de IA
            </label>
            <div className="relative">
              <select
                id="aiModel"
                className="w-full appearance-none bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3.5 pr-10 text-on-surface text-base focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                value={localModel}
                onChange={e => setLocalModel(e.target.value)}
              >
                <optgroup label="🟢 Google Gemini">
                  {AI_MODELS.filter(m => m.provider === 'gemini').map(m => (
                    <option key={m.id} value={m.id}>{m.name} — {m.description}</option>
                  ))}
                </optgroup>
                <optgroup label="🔵 OpenAI">
                  {AI_MODELS.filter(m => m.provider === 'openai').map(m => (
                    <option key={m.id} value={m.id}>{m.name} — {m.description}</option>
                  ))}
                </optgroup>
                <optgroup label="🟠 Anthropic Claude">
                  {AI_MODELS.filter(m => m.provider === 'anthropic').map(m => (
                    <option key={m.id} value={m.id}>{m.name} — {m.description}</option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
            </div>

            {/* Status da chave */}
            <div className="mt-2 flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-outline" />
              <span className="text-[11px] text-secondary">
                Provedor: <strong className={currentProviderInfo.color}>{currentProviderInfo.emoji} {currentProviderInfo.label}</strong>
              </span>
              {currentHasKey ? (
                <span className="ml-auto text-[10px] text-emerald-600 font-bold uppercase tracking-wide">✓ Chave OK</span>
              ) : (
                <span className="ml-auto text-[10px] text-rose-500 font-bold uppercase tracking-wide">✗ Sem chave</span>
              )}
            </div>

            {/* Aviso se sem chave */}
            {!currentHasKey && (
              <div className="mt-3 flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 leading-relaxed">
                  A chave de API para <strong>{currentProviderInfo.label}</strong> não está configurada.{' '}
                  Acesse <strong>Configurações → Inteligências Artificiais</strong> para adicioná-la.
                </p>
              </div>
            )}
          </div>

          <hr className="border-outline-variant/10" />

          {/* ── Cliente + Quantidade ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="clientName">
                Nome do Cliente
              </label>
              <input
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface text-lg placeholder:text-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                id="clientName"
                type="text"
                placeholder="Ex: Jornal da Manhã"
                value={formData.clientName}
                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="quantity">
                Qtd. Artigos
              </label>
              <input
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface text-lg text-center focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                id="quantity"
                type="number"
                min="1"
                max="20"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          {/* ── Palavra-chave principal ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="mainKeyword">
              Palavra-chave Principal
            </label>
            <div className="relative">
              <input
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 pr-10 text-on-surface text-lg placeholder:text-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                id="mainKeyword"
                type="text"
                placeholder="O termo central do SEO"
                value={formData.mainKeyword}
                onChange={e => setFormData({ ...formData, mainKeyword: e.target.value })}
                required
              />
              <Star className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant w-5 h-5" />
            </div>
          </div>

          {/* ── Outras keywords ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="otherKeywords">
              Outras Palavras-chave
            </label>
            <textarea
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface text-base placeholder:text-outline-variant/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              id="otherKeywords"
              rows={2}
              placeholder="Separe por vírgulas ou quebras de linha..."
              value={formData.otherKeywords}
              onChange={e => setFormData({ ...formData, otherKeywords: e.target.value })}
            />
          </div>

          {/* ── URL ── */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2" htmlFor="url">
              URL de Referência
            </label>
            <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <LinkIcon className="text-outline-variant group-focus-within:text-primary w-5 h-5 flex-shrink-0" />
              <input
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none py-3.5 text-on-surface placeholder:text-outline-variant/60"
                id="url"
                type="url"
                placeholder="https://exemplo.com.br/guia-editorial"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                required
              />
            </div>
          </div>

          {/* ── Erro ── */}
          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {/* ── Botão ── */}
          <div className="pt-2">
            {loading && progress.total > 0 && (
              <div className="mb-4 space-y-1">
                <div className="flex justify-between text-xs text-secondary">
                  <span>Gerando artigos...</span>
                  <span>{progress.current}/{progress.total}</span>
                </div>
                <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 10}%` }}
                  />
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !currentHasKey}
              className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-5 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-current" />
                  Gerar {formData.quantity > 1 ? `${formData.quantity} Artigos` : 'Artigo'}
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-outline mt-4 uppercase tracking-tighter opacity-60">
              O processamento pode levar até 45–60 segundos por artigo.
            </p>
          </div>
        </form>
      </div>

      {/* ── Cards de info ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container-high rounded-xl p-5 border-l-4 border-primary">
          <h4 className="font-serif italic text-primary text-lg mb-1">Dica do Editor</h4>
          <p className="text-secondary text-xs leading-relaxed">
            Palavras-chave de cauda longa na seção "Outras Palavras-chave" aumentam a relevância semântica e reduzem a concorrência nas SERPs.
          </p>
        </div>
        <div className="bg-white/40 backdrop-blur-sm rounded-xl p-5 border border-outline-variant/10">
          <h4 className="text-on-surface text-xs font-bold uppercase tracking-widest mb-2">Status da Máquina</h4>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-secondary font-medium">Sistemas Operacionais</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-outline">Modelo ativo:</span>
            <span className="text-xs font-mono font-medium text-on-surface">{localModel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
