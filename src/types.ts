export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'groq' | 'mistral';

export interface AIKeys {
  geminiKey: string;
  openaiKey: string;
  anthropicKey: string;
  groqKey: string;
  mistralKey: string;
}

export interface AppSettings {
  minWords: number;
  tone: string;
  targetAudience: string;
  languageLevel: string;
  includeFAQ: boolean;
  selectedModel: string;
  imageStyle: string;
  aiKeys: AIKeys;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  filename: string;
  date: string;
  clientName: string;
  zipName: string;
}

export interface HistoryItem {
  id: string;
  clientName: string;
  date: string;
  quantity: number;
  mainKeyword: string;
  zipName: string;
  modelUsed?: string;
  articles: {
    title: string;
    content: string;
    filename: string;
  }[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
}

export const AI_MODELS: AIModel[] = [
  // ── Google Gemini ──────────────────────────────────────
  {
    id: 'gemini-3.1-pro',
    name: 'Gemini 3.1 Pro',
    provider: 'gemini',
    description: '⭐ Última Geração (3.1 Promax) — Maior capacidade de raciocínio, escrita imersiva e super contexto',
  },
  {
    id: 'gemini-3.1-flash',
    name: 'Gemini 3.1 Flash',
    provider: 'gemini',
    description: 'A versão Flash mais recém atualizada. Extremamente veloz, menor custo.',
  },
  {
    id: 'gemini-3.0-pro',
    name: 'Gemini 3.0 Pro',
    provider: 'gemini',
    description: 'Geração avançada com altíssima qualidade de redação complexa.',
  },
  {
    id: 'gemini-3.0-flash',
    name: 'Gemini 3.0 Flash',
    provider: 'gemini',
    description: 'Rápido, confiável e focado na linha 3.0.',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    description: 'Geração anterior — Equilíbrio sólido entre velocidade e razão',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    description: 'Clássico de contexto gigante (2M tokens) — Excelente para MEGATEXTOS',
  },

  // ── OpenAI ─────────────────────────────────────────────
  {
    id: 'o3-mini',
    name: 'OpenAI o3-mini',
    provider: 'openai',
    description: '🤖 Maior raciocínio lógico e velocidade — Excelente em Megaposts',
  },
  {
    id: 'o1',
    name: 'OpenAI o1',
    provider: 'openai',
    description: '🤖 Raciocínio profundo e super complexidade — O mais avançado da OpenAI',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: '⭐ Rápido e de enorme qualidade. O clássico atualizado.',
  },
  {
    id: 'gpt-4.5-preview',
    name: 'GPT-4.5 Preview',
    provider: 'openai',
    description: 'Pioneirismo — Máxima imersão narrativa e fluidez escrita',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Econômico e rápido — Suporta textos grandes num custo baixo',
  },

  // ── Anthropic Claude ───────────────────────────────────
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    description: '⭐ Topo de linha atual — A melhor escrita editorial em PT-BR',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Geração excelente, raciocínio lógico forte e texto humano',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Veloz e competente para produção de múltiplos artigos',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Modelo pesado para máxima complexidade analítica',
  },

  // ── Groq (Ultra-rápido & DeepSeek) ─────────────────────
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 (Llama 70B)',
    provider: 'groq',
    description: '🤖 Forte lógica de raciocínio da engine r1 de forma rápida (Groq)',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    description: '⭐ Open source mais poderoso da Meta — Ótimo vocabulário',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    provider: 'groq',
    description: 'O mais veloz de todos — Use para tarefas extremamente altas sem travar',
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B (32k)',
    provider: 'groq',
    description: 'Grande capacidade de contexto com velocidade do Groq',
  },

  // ── Mistral AI ─────────────────────────────────────────
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large 2',
    provider: 'mistral',
    description: '⭐ Modelo premium da Mistral, fluência impecável',
  },
  {
    id: 'pixtral-large-2411',
    name: 'Pixtral Large',
    provider: 'mistral',
    description: 'Novo modelo da série premium focado em alta compreensão',
  },
  {
    id: 'open-mistral-nemo',
    name: 'Mistral Nemo',
    provider: 'mistral',
    description: 'Aceita ATÉ 128k de tokens de contexto numa rede open-source',
  }
];

export function getProviderFromModel(modelId: string): AIProvider {
  const model = AI_MODELS.find(m => m.id === modelId);
  return model?.provider ?? 'gemini';
}
