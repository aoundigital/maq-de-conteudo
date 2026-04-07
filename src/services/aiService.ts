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
// IMAGE URL — LoremFlickr (mais estável para buscas dinâmicas)
// ─────────────────────────────────────────────
function buildImageUrl(mainKeyword: string, imageStyle: string): string {
  const query = imageStyle?.trim()
    ? encodeURIComponent(`${mainKeyword},${imageStyle.replace(/\s+/g, ',')}`)
    : encodeURIComponent(mainKeyword);
  // LoremFlickr é excelente para buscas dinâmicas sem API Key
  return `https://loremflickr.com/1200/628/${query}?lock=${Math.floor(Math.random() * 1000)}`;
}

// ─────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────
function buildPrompt(params: ArticleParams, index: number): string {
  const { clientName, quantity, mainKeyword, otherKeywords, url, settings } = params;
  const imageUrl = buildImageUrl(mainKeyword, settings.imageStyle ?? '');
  const minWords = settings.minWords ?? 800;

  // Cálculo de volume agressivo
  const pCount = Math.max(18, Math.ceil(minWords / 65));
  const h2Count = Math.max(7, Math.ceil(minWords / 150));

  return `Você é um Redator Chefe de um grande portal de notícias e autoridade em SEO.
Sua missão é produzir um "MEGAPOST" épico sobre "${mainKeyword}".

════════════════════════════════════════
ALVOS DE PERFORMANCE (OBRIGATÓRIO)
════════════════════════════════════════
• VOCÊ DEVE ESCREVER NO MÍNIMO ${minWords} PALAVRAS. 
• Use exatamente ${h2Count} subtítulos (<h2>) para dividir o conteúdo.
• Escreva pelo menos ${pCount} parágrafos longos (mínimo de 100 palavras por parágrafo).
• Se o artigo estiver curto, o sistema falhará. PREENCHA cada seção com o máximo de detalhes técnicos, históricos e analíticos.

════════════════════════════════════════
REGRAS TÉCNICAS
════════════════════════════════════════
• Tom: ${settings.tone} | Nível: ${settings.languageLevel}
• Formato: HTML PURO (<h1>, <h2>, <p>, <a>, <img>, <b>).
• Imagem: <a href="${url}" target="_blank"><img src="${imageUrl}" alt="${mainKeyword}" style="width:100%; border-radius:12px; margin:30px 0;"></a> (Insira após o 1º H2).
• Link Interno: Link para "${url}" com a palavra-chave "${mainKeyword}".
• Link Externo: Link para uma fonte de autoridade global no meio do texto.

════════════════════════════════════════
ESTRUTURA DE EXPANSÃO (PARA BATER ${minWords} PALAVRAS)
════════════════════════════════════════
1. LIDE MAGNÉTICA: Introdução profunda sobre o impacto de "${mainKeyword}".
2. MAPEAMENTO COMPLETO: O que é, fundamentos e por que importa agora.
3. ANÁLISE DE PROFUNDIDADE: Dados, estatísticas e tendências do setor.
4. GUIA PRÁTICO: Passo a passo extremamente detalhado de como implementar/usar.
5. DESAFIOS E MITOS: Desminta crenças comuns e resolva dores complexas.
6. CASOS DE USO: Exemplos detalhados e narrativas de sucesso.
7. O FUTURO: Para onde caminha este tema nos próximos 10 anos.
${settings.includeFAQ ? "8. MEGA FAQ: 5 perguntas com respostas completas de no mínimo 3 parágrafos cada." : ""}

════════════════════════════════════════
VERIFICAÇÃO DE OURO
════════════════════════════════════════
✗ NÃO resuma. A prolixidade técnica é valorizada aqui. 
✗ NÃO entregue menos do que o solicitado. Continue expandindo cada subtítulo com mais 2 parágrafos se necessário.
✗ Use negrito <b> para destacar conceitos importantes.

Retorne APENAS o código HTML puro começando com <h1>.`;
}� ${mainKeyword}? (4 parágrafos): Definição técnica, histórica e semântica.
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
