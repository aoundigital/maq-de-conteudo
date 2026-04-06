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

  return `Você é um redator jornalístico sênior especializado em SEO e conteúdo editorial de prestígio, fluente em Português do Brasil (pt_BR).

Crie um artigo ÚNICO e ORIGINAL sobre o tema: "${mainKeyword}".

════════════════════════════════════════
REQUISITO OBRIGATÓRIO DE TAMANHO
════════════════════════════════════════
• O artigo DEVE ter NO MÍNIMO ${minWords} palavras — isso é INEGOCIÁVEL.
• Tom: ${settings.tone}
• Público-alvo: ${settings.targetAudience}
• Nível de linguagem: ${settings.languageLevel}
• Antes de finalizar, conte internamente as palavras. Se o texto tiver menos de ${minWords} palavras, CONTINUE ESCREVENDO até atingir ou superar esse número.
• Artigos curtos são INACEITÁVEIS. Prefira sempre escrever a mais.

════════════════════════════════════════
FORMATO HTML OBRIGATÓRIO
════════════════════════════════════════
• Use APENAS as tags: <h1>, <h2>, <h3>, <p>, <a>, <img>, <b>
• NÃO inclua cabeçalho HTML (<html>, <head>, <body>, <header>, <title>, <meta>)
• NÃO use JavaScript
• Inicie o conteúdo diretamente com a tag <h1>

════════════════════════════════════════
REGRAS DE IMAGEM
════════════════════════════════════════
• Insira UMA tag <img> entre o 1º e o 2º parágrafo, SEMPRE envolva a imagem em uma tag <a> apontando para "${url}" com target="_blank" rel="noopener"
• Use EXATAMENTE esta URL de imagem (não invente outra): ${imageUrl}
• Estrutura obrigatória: <a href="${url}" target="_blank" rel="noopener"><img src="${imageUrl}" alt="[título do artigo]" loading="lazy" width="1200" height="628" style="max-width:100%;height:auto;display:block;margin:1.5rem 0;"></a>
• O alt da imagem deve ser o mesmo texto do <h1>

════════════════════════════════════════
REGRAS DE LINK
════════════════════════════════════════
• Insira UM link interno para "${url}" usando como âncora EXATAMENTE uma das palavras-chave: ${mainKeyword} ou ${otherKeywords}
• Esse link deve estar no corpo do texto, contextualizado de forma absolutamente natural
• Atributos obrigatórios: target="_blank" rel="noopener"

════════════════════════════════════════
LINK EXTERNO DE AUTORIDADE (OBRIGATÓRIO)
════════════════════════════════════════
• Insira UM link para uma fonte externa de alta autoridade (Wikipedia em português, gov.br, sites de pesquisa científica, portais de referência do setor) relacionada ao tema
• O link deve estar inserido no MEIO do artigo (não no início, não no final), de forma completamente natural dentro de um parágrafo
• Âncora: use uma frase descritiva e natural (NÃO use "clique aqui", "saiba mais" ou o nome do site)
• Atributos obrigatórios: target="_blank" rel="noopener"

════════════════════════════════════════
REGRAS DE SEO
════════════════════════════════════════
• Palavra-chave principal: "${mainKeyword}" (use com densidade de 1–2%)
• Palavras-chave secundárias: ${otherKeywords} (distribua naturalmente)
• Use <b> para destacar palavras-chave, sinônimos e termos estratégicos
• Tamanho MÍNIMO ABSOLUTO: ${minWords} palavras — NÃO NEGOCIE isso

════════════════════════════════════════
ESTRUTURA DO ARTIGO
════════════════════════════════════════
• Lide forte que prende o leitor
• Exposição dos fatos com contexto e dados reais
• Explicações aprofundadas com exemplos práticos
• Depoimentos ou declarações de especialistas do setor (podem ser simulados mas realistas)
• Análise crítica e ponto de vista editorial pessoal
• Seção de perspectivas e tendências futuras
${settings.includeFAQ ? "• Seção de Perguntas Frequentes ao final: use <h3> para as perguntas e <p> para as respostas (mínimo 3 perguntas)" : ""}

════════════════════════════════════════
PROIBIÇÕES ABSOLUTAS — NUNCA FAÇA ISSO
════════════════════════════════════════
✗ NUNCA use "Conclusão", "Considerações Finais" ou "Conclusão Final" como subtítulo (h2/h3)
✗ NUNCA escreva subtítulos no formato "Palavra: Explicação" (ex: "SEO: Por que é importante")
✗ NUNCA use listas <ul> ou <ol> mais de UMA vez por artigo; se usar, máximo 5 itens
✗ NUNCA comece parágrafos com "Em conclusão", "Portanto", "Dessa forma", "Em suma", "Logo"
✗ NUNCA escreva um subtítulo que seja apenas uma reformulação do <h1>
✗ NUNCA use linguagem de chatbot ou frases genéricas como "É importante destacar que..."

════════════════════════════════════════
DIFERENCIAÇÃO (IMPORTANTE)
════════════════════════════════════════
Este é o artigo NÚMERO ${index} de ${quantity} sobre o mesmo tema: "${mainKeyword}".
Aborde um ângulo COMPLETAMENTE DIFERENTE dos outros artigos da série.
Use dados, estudos, casos ou perspectivas distintas a cada artigo.
Cliente: ${clientName}

════════════════════════════════════════
VERIFICAÇÃO FINAL OBRIGATÓRIA
════════════════════════════════════════
Antes de retornar o HTML, confirme internamente:
1. ✅ IMAGEM COM LINK: Tag <img> com a URL "${imageUrl}" envolvida em <a> para "${url}"
2. ✅ LINK INTERNO: Um <a> no texto para "${url}" usando a palavra-chave
3. ✅ LINK EXTERNO: Um <a> para Wikipedia ou fonte de autoridade no MEIO do artigo
4. ✅ TAMANHO: O artigo tem pelo menos ${minWords} palavras
5. ✅ HTML PURO: Sem blocos de código, sem markdown, iniciando com <h1>

Retorne APENAS o código HTML puro, começando diretamente com <h1>.`;
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
