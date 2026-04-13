// Providers diretos (própria chave de API)
export type AIProvider = 'openrouter' | 'openai' | 'groq' | 'mistral';

export interface AIKeys {
  openrouterKey: string;
  openaiKey: string;
  groqKey: string;
  mistralKey: string;
  imgbbKey: string;
}

export interface AppSettings {
  minWords: number;
  tone: string;
  targetAudience: string;
  languageLevel: string;
  includeFAQ: boolean;
  selectedModel: string;
  selectedImageModel: string;
  imageStyle: string;
  temperature: number;
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
  tier: 'free' | 'paid';
}

export interface AIImageModel {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'paid';
}

// ── Modelos de Texto ─────────────────────────────────────────

export const AI_MODELS: AIModel[] = [

  // ── Gratuitos via OpenRouter (3 melhores) ────────────────
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (Grátis)',
    provider: 'openrouter',
    tier: 'free',
    description: '⭐ Melhor open-source gratuito da Meta — Excelente para PT-BR e textos longos',
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B (Grátis)',
    provider: 'openrouter',
    tier: 'free',
    description: 'Ultra-rápido e eficiente — Ótimo para alto volume sem custo',
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B (Grátis)',
    provider: 'openrouter',
    tier: 'free',
    description: 'Google open-source de última geração — Bom equilíbrio qualidade/velocidade',
  },

  // ── Pagos via OpenRouter (8 melhores globais) ─────────────
  {
    id: 'anthropic/claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'openrouter',
    tier: 'paid',
    description: '⭐ #1 editorial PT-BR — Escrita humana e raciocínio analítico avançado',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'openrouter',
    tier: 'paid',
    description: 'Excelente qualidade de texto — Lógica forte e fluidez em português',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openrouter',
    tier: 'paid',
    description: '⭐ Rápido e de enorme qualidade — O clássico OpenAI atualizado',
  },
  {
    id: 'openai/o3-mini',
    name: 'OpenAI o3-mini',
    provider: 'openrouter',
    tier: 'paid',
    description: '🤖 Raciocínio lógico superior — Excelente para megaposts estruturados',
  },
  {
    id: 'openai/gpt-4.5-preview',
    name: 'GPT-4.5 Preview',
    provider: 'openrouter',
    tier: 'paid',
    description: 'Máxima imersão narrativa e fluidez — Pioneirismo da OpenAI',
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'openrouter',
    tier: 'paid',
    description: '🧠 Top LMSYS Arena — Raciocínio profundo, excelente em análises longas',
  },
  {
    id: 'x-ai/grok-3-beta',
    name: 'Grok 3 Beta',
    provider: 'openrouter',
    tier: 'paid',
    description: 'Modelo flagship da xAI — Alta criatividade e contexto de 131k tokens',
  },
  {
    id: 'mistralai/mistral-large-latest',
    name: 'Mistral Large 2',
    provider: 'openrouter',
    tier: 'paid',
    description: '⭐ Fluência impecável em múltiplos idiomas — Custo-benefício premium',
  },

  // ── Providers Diretos — OpenAI ────────────────────────────
  {
    id: 'direct-o3-mini',
    name: 'OpenAI o3-mini (Direto)',
    provider: 'openai',
    tier: 'paid',
    description: '🤖 Raciocínio lógico máximo — Chave própria OpenAI, sem intermediário',
  },
  {
    id: 'direct-gpt-4o',
    name: 'GPT-4o (Direto)',
    provider: 'openai',
    tier: 'paid',
    description: 'Chave própria OpenAI — Máxima estabilidade e performance',
  },
  {
    id: 'direct-gpt-4o-mini',
    name: 'GPT-4o Mini (Direto)',
    provider: 'openai',
    tier: 'paid',
    description: 'Econômico e rápido via chave OpenAI — Ótimo para alto volume',
  },

  // ── Providers Diretos — Groq ──────────────────────────────
  {
    id: 'direct-llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Groq)',
    provider: 'groq',
    tier: 'paid',
    description: '⚡ Velocidade extrema via Groq — Open-source mais poderoso da Meta',
  },
  {
    id: 'direct-deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 (Groq)',
    provider: 'groq',
    tier: 'paid',
    description: '⚡ Raciocínio r1 com velocidade Groq — Ideal para alto volume',
  },
  {
    id: 'direct-llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant (Groq)',
    provider: 'groq',
    tier: 'free',
    description: 'O mais veloz de todos — Para demanda máxima sem travamentos',
  },

  // ── Providers Diretos — Mistral ───────────────────────────
  {
    id: 'direct-mistral-large-latest',
    name: 'Mistral Large 2 (Direto)',
    provider: 'mistral',
    tier: 'paid',
    description: '⭐ Chave própria Mistral — Fluência premium em PT-BR',
  },
  {
    id: 'direct-open-mistral-nemo',
    name: 'Mistral Nemo (Direto)',
    provider: 'mistral',
    tier: 'free',
    description: '128k de contexto via Mistral — Open-source rápido e eficiente',
  },
];

// ── Modelos de Imagem ────────────────────────────────────────

export const AI_IMAGE_MODELS: AIImageModel[] = [
  // Gratuitos via OpenRouter (2 melhores)
  {
    id: 'black-forest-labs/flux-schnell:free',
    name: 'FLUX Schnell (Grátis)',
    tier: 'free',
    description: '⭐ Ultra-rápido, qualidade fotorrealista — Melhor grátis disponível',
  },
  {
    id: 'stabilityai/stable-diffusion-3-5-medium:free',
    name: 'SD 3.5 Medium (Grátis)',
    tier: 'free',
    description: 'Alta fidelidade visual — Ótima composição sem custo',
  },

  // Pagos via OpenRouter (5 melhores)
  {
    id: 'openai/dall-e-3',
    name: 'DALL-E 3 (OpenAI)',
    tier: 'paid',
    description: '⭐ Melhor coerência semântica — Entende prompts complexos com perfeição',
  },
  {
    id: 'black-forest-labs/flux-1.1-ultra',
    name: 'FLUX 1.1 Ultra',
    tier: 'paid',
    description: 'Fotorrealismo de nível profissional — Máxima qualidade para editorial',
  },
  {
    id: 'stabilityai/stable-image-ultra',
    name: 'Stable Image Ultra',
    tier: 'paid',
    description: 'Alta resolução para uso comercial — Resultado impressionante e consistente',
  },
  {
    id: 'ideogram-ai/ideogram-v2',
    name: 'Ideogram V2',
    tier: 'paid',
    description: 'Excelente integração de texto na imagem — Ótimo para capas e miniaturas',
  },
  {
    id: 'recraft-ai/recraft-v3',
    name: 'Recraft V3',
    tier: 'paid',
    description: 'Design editorial e vetorial de ponta — Ideal para artigos de nicho premium',
  },
];

// Maps model id to its direct provider (for direct API calls)
const DIRECT_MODEL_MAP: Record<string, { provider: AIProvider; realId: string }> = {
  'direct-o3-mini':                     { provider: 'openai',  realId: 'o3-mini' },
  'direct-gpt-4o':                      { provider: 'openai',  realId: 'gpt-4o' },
  'direct-gpt-4o-mini':                 { provider: 'openai',  realId: 'gpt-4o-mini' },
  'direct-llama-3.3-70b-versatile':     { provider: 'groq',    realId: 'llama-3.3-70b-versatile' },
  'direct-deepseek-r1-distill-llama-70b': { provider: 'groq',  realId: 'deepseek-r1-distill-llama-70b' },
  'direct-llama-3.1-8b-instant':        { provider: 'groq',    realId: 'llama-3.1-8b-instant' },
  'direct-mistral-large-latest':        { provider: 'mistral', realId: 'mistral-large-latest' },
  'direct-open-mistral-nemo':           { provider: 'mistral', realId: 'open-mistral-nemo' },
};

export function getProviderFromModel(modelId: string): AIProvider {
  if (DIRECT_MODEL_MAP[modelId]) return DIRECT_MODEL_MAP[modelId].provider;
  const model = AI_MODELS.find(m => m.id === modelId);
  return model?.provider ?? 'openrouter';
}

export function getRealModelId(modelId: string): string {
  return DIRECT_MODEL_MAP[modelId]?.realId ?? modelId;
}
