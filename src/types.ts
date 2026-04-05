export type AIProvider = 'gemini' | 'openai' | 'anthropic';

export interface AIKeys {
  geminiKey: string;
  openaiKey: string;
  anthropicKey: string;
}

export interface AppSettings {
  minWords: number;
  tone: string;
  targetAudience: string;
  languageLevel: string;
  includeFAQ: boolean;
  selectedModel: string;
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
  // Gemini
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', description: '⭐ Mais poderoso, raciocínio de ponta' },
  { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro Preview', provider: 'gemini', description: 'Preview — raciocínio avançado' },
  { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash Preview', provider: 'gemini', description: 'Rápido com raciocínio 2.5' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', description: 'Rápido e eficiente (padrão)' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', provider: 'gemini', description: 'Mais leve e econômico' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', description: 'Contexto longo (1M tokens)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini', description: 'Versão rápida do 1.5' },
  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Melhor custo-benefício GPT-4' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Econômico, alta qualidade' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'GPT-4 potente' },
  { id: 'o1', name: 'o1', provider: 'openai', description: 'Raciocínio avançado (mais lento)' },
  { id: 'o1-mini', name: 'o1 Mini', provider: 'openai', description: 'Raciocínio rápido e econômico' },
  { id: 'o3-mini', name: 'o3 Mini', provider: 'openai', description: 'Mais recente da linha o3' },
  // Anthropic
  { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', provider: 'anthropic', description: 'Mais poderoso da Anthropic' },
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', provider: 'anthropic', description: 'Equilíbrio perfeito' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Excelente para escrita' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', description: 'Rápido e econômico' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', description: 'Mais leve' },
];

export function getProviderFromModel(modelId: string): AIProvider {
  const model = AI_MODELS.find(m => m.id === modelId);
  return model?.provider ?? 'gemini';
}
