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
    id: 'gemini-2.5-flash-preview-04-17',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    description: '⭐ Melhor custo-benefício — raciocínio rápido e artigos longos',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    description: 'Rápido, confiável e econômico (recomendado para volume)',
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    provider: 'gemini',
    description: 'Mais leve — ideal para testes e alto volume com baixo custo',
  },
  {
    id: 'gemini-1.5-pro-latest',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    description: 'Contexto de 1M tokens — ótimo para artigos muito longos',
  },
  {
    id: 'gemini-1.5-flash-latest',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    description: 'Veloz e eficiente — bom equilíbrio para produção em série',
  },

  // ── OpenAI ─────────────────────────────────────────────
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: '⭐ Melhor da OpenAI — excelente qualidade e velocidade',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Econômico e rápido — ótimo para alto volume',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Alta capacidade, contexto longo (128k tokens)',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Ultra econômico — para volume muito alto com custo mínimo',
  },

  // ── Anthropic Claude ───────────────────────────────────
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: '⭐ Melhor da Anthropic — escrita excepcional em português',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Rápido e econômico — qualidade sólida para produção em série',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Máximo poder — artigos de alta complexidade e profundidade',
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Mais leve e rápido — bom para volume alto com custo baixo',
  },

  // ── Groq (Llama ultra-rápido) ──────────────────────────
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    description: '⭐ Ultra-rápido via Groq — excelente para artigos em PT-BR',
  },
  {
    id: 'llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout',
    provider: 'groq',
    description: 'Mais recente do Meta — contexto longo e alta performance',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    provider: 'groq',
    description: 'Velocidade máxima — ideal para volume massivo a custo zero',
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'groq',
    description: 'Mistral via Groq — contexto 32k, excelente multilíngue',
  },

  // ── Mistral AI ─────────────────────────────────────────
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    provider: 'mistral',
    description: '⭐ Topo de linha Mistral — excelente em português e SEO',
  },
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small',
    provider: 'mistral',
    description: 'Econômico e veloz — ótimo custo-benefício para produção',
  },
  {
    id: 'open-mistral-nemo',
    name: 'Mistral Nemo',
    provider: 'mistral',
    description: 'Open source — contexto 128k, ótimo para artigos longos',
  },
];

export function getProviderFromModel(modelId: string): AIProvider {
  const model = AI_MODELS.find(m => m.id === modelId);
  return model?.provider ?? 'gemini';
}
