import { GoogleGenAI } from "@google/genai";
import { AppSettings, getProviderFromModel } from "../types";

export interface ArticleParams {
  clientName: string;
  quantity: number;
  mainKeyword: string;
  otherKeywords: string;
  url: string;
  settings: AppSettings;
}

export interface GeneratedArticle {
  id: string;
  title: string;
  content: string;
  filename: string;
  date: string;
  clientName: string;
}

// ─────────────────────────────────────────────
// IMAGE URL — Unsplash Featured (mais estável)
// ─────────────────────────────────────────────
function buildImageUrl(mainKeyword: string, imageStyle: string): string {
  const query = imageStyle?.trim()
    ? encodeURIComponent(`${mainKeyword},${imageStyle}`)
    : encodeURIComponent(mainKeyword);
  // Usando a URL 'featured' que é mais confiável para busca por keyword
  return `https://source.unsplash.com/featured/1200x628/?${query}`;
}

// ─────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────
function buildPrompt(params: ArticleParams, index: number): string {
  const { clientName, quantity, mainKeyword, otherKeywords, url, settings } = params;
  const imageUrl = buildImageUrl(mainKeyword, settings.imageStyle ?? '');
  const minWords = settings.minWords ?? 800;

  // Cálculo para forçar volume real
  const pCount = Math.max(15, Math.ceil(minWords / 70));
  const h2Count = Math.max(6, Math.ceil(minWords / 200));

  return `Você é um Redator Chefe e Especialista em SEO de performance internacional.
Sua tarefa é produzir um artigo MASSIVO, PROFUNDO e EXAUSTIVO com no MÍNIMO ${minWords} PALAVRAS.

TEMA: "${mainKeyword}"

════════════════════════════════════════
ALERTA DE TAMANHO (NÃO NEGOCIÁVEL)
════════════════════════════════════════
• O artigo DEVE ultrapassar ${minWords} palavras. 
• Artigos curtos (menos de ${minWords} palavras) são considerados FALHA CRÍTICA.
• Estrutura: Use pelo menos ${h2Count} subtítulos (<h2>) e ${pCount} parágrafos de texto denso.
• Cada parágrafo deve ser uma "explosão" de informação, com pelo menos 8 linhas de texto corrido.
• EXPLIQUE TUDO: Se citar um termo, defina-o. Se citar uma estratégia, dê 3 exemplos. Use analogias longas.

════════════════════════════════════════
REGRAS TÉCNICAS E LINKS
════════════════════════════════════════
• Tom: ${settings.tone} | Público: ${settings.targetAudience}
• Link Interno: <a href="${url}" target="_blank"><b>${mainKeyword}</b></a>
• Link Externo: Insira um link para Wikipedia ou fonte governamental/acadêmica no corpo do texto.
• Imagem: <a href="${url}" target="_blank"><img src="${imageUrl}" alt="${mainKeyword}" style="width:100%; height:auto; margin:20px 0;"></a> (Insira após o primeiro H2).

════════════════════════════════════════
ROTEIRO PARA ATINGIR ${minWords} PALAVRAS
════════════════════════════════════════
1. INTRODUÇÃO (3 parágrafos): Contexto global, dor do leitor e promessa de solução.
2. O QUE É ${mainKeyword}? (4 parágrafos): Definição técnica, histórica e semântica.
3. POR QUE ISSO É VITAL HOJE? (4 parágrafos): Análise de mercado e tendências.
4. GUIA DEFINITIVO: PASSO A PASSO (6 parágrafos): Como aplicar na prática com riqueza de detalhes.
5. ERROS COMUNS E COMO EVITÁ-LOS (4 parágrafos): Liste 5 erros e explique cada um por extenso.
6. O FUTURO DO SETOR (3 parágrafos): Previsões e inovações disruptivas.
${settings.includeFAQ ? "7. FAQ MASTER: 5 perguntas complexas com respostas de 150 palavras cada." : ""}

════════════════════════════════════════
PROIBIÇÃO DE CONCISÃO
════════════════════════════════════════
✗ NÃO resuma. NÃO seja direto. NÃO economize palavras.
✗ Se sentir que terminou, você não terminou. Crie um novo ângulo de análise e continue escrevendo.
✗ Desenvolva narrativas longas para cada ponto citado.

Retorne APENAS o HTML puro começando com <h1>.`;
}

// ─────────────────────────────────────────────
// GEMINI
// ─────────────────────────────────────────────
async function generateWithGemini(prompt: string, apiKey: string, model: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      maxOutputTokens: 8192,
      temperature: 0.8,
    },
  });
  return response.text ?? "";
}

// ─────────────────────────────────────────────
// OPENAI
// ─────────────────────────────────────────────
function getOpenAIMaxTokens(model: string): number {
  // gpt-4o and gpt-4o-mini support up to 16384 output tokens
  if (model === 'gpt-4o' || model === 'gpt-4o-mini') return 16384;
  // gpt-3.5-turbo and gpt-4-turbo max out at 4096
  return 4096;
}

async function generateWithOpenAI(prompt: string, apiKey: string, model: string): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: getOpenAIMaxTokens(model),
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenAI error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

// ─────────────────────────────────────────────
// ANTHROPIC
// ─────────────────────────────────────────────
async function generateWithAnthropic(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Anthropic error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }

  const data = await response.json() as { content: { type: string; text: string }[] };
  return data.content.find(c => c.type === "text")?.text ?? "";
}

// ─────────────────────────────────────────────
// GROQ (compatível com OpenAI)
// ─────────────────────────────────────────────
async function generateWithGroq(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Groq error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

// ─────────────────────────────────────────────
// MISTRAL
// ─────────────────────────────────────────────
async function generateWithMistral(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Mistral error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export async function generateArticles(
  params: ArticleParams,
  onProgress?: (current: number) => void
): Promise<GeneratedArticle[]> {
  const { clientName, quantity, settings } = params;
  const { selectedModel, aiKeys } = settings;
  const provider = getProviderFromModel(selectedModel);

  const keyMap: Record<string, string> = {
    gemini: aiKeys.geminiKey,
    openai: aiKeys.openaiKey,
    anthropic: aiKeys.anthropicKey,
    groq: aiKeys.groqKey,
    mistral: aiKeys.mistralKey,
  };

  const apiKey = keyMap[provider];

  if (!apiKey) {
    throw new Error(`Chave de API não configurada para o provedor ${provider}. Acesse Configurações → Inteligências Artificiais.`);
  }

  const articles: GeneratedArticle[] = [];

  for (let i = 1; i <= quantity; i++) {
    const prompt = buildPrompt(params, i);

    let htmlContent = "";

    switch (provider) {
      case "gemini":
        htmlContent = await generateWithGemini(prompt, apiKey, selectedModel);
        break;
      case "openai":
        htmlContent = await generateWithOpenAI(prompt, apiKey, selectedModel);
        break;
      case "anthropic":
        htmlContent = await generateWithAnthropic(prompt, apiKey, selectedModel);
        break;
      case "groq":
        htmlContent = await generateWithGroq(prompt, apiKey, selectedModel);
        break;
      case "mistral":
        htmlContent = await generateWithMistral(prompt, apiKey, selectedModel);
        break;
    }

    // Strip markdown code fences if any model wraps in ```html ... ```
    htmlContent = htmlContent
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "") : `Artigo ${i} — ${params.mainKeyword}`;

    articles.push({
      id: crypto.randomUUID(),
      title,
      content: htmlContent,
      filename: `${i}_${clientName.replace(/\s+/g, "_").toLowerCase()}.html`,
      date: new Date().toISOString(),
      clientName,
    });

    onProgress?.(i);
  }

  return articles;
}
