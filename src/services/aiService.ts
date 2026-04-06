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
// IMAGE URL — Unsplash com keyword relevante
// ─────────────────────────────────────────────
function buildImageUrl(mainKeyword: string, imageStyle: string): string {
  // Combina keyword + estilo visual para busca mais precisa
  const query = imageStyle?.trim()
    ? encodeURIComponent(`${mainKeyword} ${imageStyle}`)
    : encodeURIComponent(mainKeyword);
  return `https://source.unsplash.com/1200x628/?${query}`;
}

// ─────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────
function buildPrompt(params: ArticleParams, index: number): string {
  const { clientName, quantity, mainKeyword, otherKeywords, url, settings } = params;
  const imageUrl = buildImageUrl(mainKeyword, settings.imageStyle ?? '');
  const minWords = settings.minWords ?? 800;

  // Cálculo sugerido para forçar a IA a escrever mais
  const suggestedParagraphs = Math.ceil(minWords / 80); 

  return `Você é um redator jornalístico sênior especializado em SEO e conteúdo editorial de prestígio, fluente em Português do Brasil (pt_BR).

Crie um artigo ÚNICO, COMPLETO e EXTENSO sobre o tema: "${mainKeyword}".

════════════════════════════════════════
REQUISITO OBRIGATÓRIO DE TAMANHO — CRITICAL
════════════════════════════════════════
• O artigo DEVE ter NO MÍNIMO ${minWords} palavras. Este é seu objetivo principal.
• Se você escrever menos de ${minWords} palavras, o trabalho será REJEITADO.
• Para atingir este tamanho, você DEVE escrever pelo menos ${suggestedParagraphs} parágrafos longos e detalhados.
• Cada parágrafo deve ter em média 80 a 120 palavras. Evite parágrafos curtos.
• Desenvolva cada subtópico com profundidade máxima, usando exemplos, dados estatísticos (reais ou verossímeis), citações e análises detalhadas.

════════════════════════════════════════
DETALHES DO CONTEÚDO
════════════════════════════════════════
• Tom: ${settings.tone}
• Público-alvo: ${settings.targetAudience}
• Nível de linguagem: ${settings.languageLevel}

════════════════════════════════════════
FORMATO HTML OBRIGATÓRIO
════════════════════════════════════════
• Use APENAS as tags: <h1>, <h2>, <h3>, <p>, <a>, <img>, <b>
• NÃO inclua cabeçalho HTML (<html>, <head>, <body>, <header>, <title>, <meta>)
• Inicie o conteúdo diretamente com a tag <h1>

════════════════════════════════════════
REGRAS DE IMAGEM
════════════════════════════════════════
• Insira UMA tag <img> entre o 1º e o 2º parágrafo, envolvida em <a> apontando para "${url}"
• URL da imagem: ${imageUrl}
• O alt da imagem deve ser o mesmo texto do <h1>

════════════════════════════════════════
REGRAS DE LINK
════════════════════════════════════════
• Link Interno: Insira UM link para "${url}" usando como âncora: ${mainKeyword} ou ${otherKeywords}
• Link Externo: Insira UM link para Wikipedia ou fonte de autoridade no MEIO do artigo.

════════════════════════════════════════
ESTRUTURA SUGERIDA PARA ALTO VOLUME
════════════════════════════════════════
1. Introdução contextualizada e provocativa (Lide).
2. História e evolução do tema.
3. Principais desafios e como superá-los.
4. Análise técnica detalhada.
5. Estudo de caso ou exemplos práticos de aplicação.
6. Guia passo a passo ou melhores práticas.
7. O impacto de "${mainKeyword}" no futuro do setor.
8. Perspectivas de especialistas.
${settings.includeFAQ ? "9. Seção de Perguntas Frequentes (FAQ) com pelo menos 5 perguntas detalhadas." : ""}

════════════════════════════════════════
PROIBIÇÕES ABSOLUTAS
════════════════════════════════════════
✗ NUNCA use "Conclusão", "Considerações Finais" ou similares como subtítulo.
✗ NUNCA utilize listas (ul/ol) para "encher linguiça"; prefira texto corrido e bem argumentado.
✗ NUNCA termine o artigo prematuramente. Se o texto estiver curto, crie um novo subtópico relevante e continue expandindo.

════════════════════════════════════════
VERIFICAÇÃO FINAL — ANTES DE ENTREGAR
════════════════════════════════════════
1. O texto tem pelo menos ${minWords} palavras? (Se não, escreva mais 3 parágrafos agora).
2. O HTML está limpo e inicia com <h1>?
3. O link para "${url}" está presente?

Retorne APENAS o código HTML puro.`;
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
