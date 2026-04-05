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
// PROMPT BUILDER
// ─────────────────────────────────────────────
function buildPrompt(params: ArticleParams, index: number): string {
  const { clientName, quantity, mainKeyword, otherKeywords, url, settings } = params;
  const imageSeed = encodeURIComponent(clientName + index + Date.now());

  return `Você é um redator jornalístico sênior especializado em SEO e conteúdo editorial de prestígio, fluente em Português do Brasil (pt_BR).

Crie um artigo ÚNICO e ORIGINAL sobre o tema: "${mainKeyword}".

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
• Estrutura obrigatória: <a href="${url}" target="_blank" rel="noopener"><img src="https://picsum.photos/seed/${imageSeed}/1200/628" alt="[título do artigo]" loading="lazy" width="1200" height="628" style="max-width:100%;height:auto;display:block;margin:1.5rem 0;"></a>
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
• Exemplo aceitável: <a href="https://pt.wikipedia.org/wiki/[Tema]" target="_blank" rel="noopener">[frase descritiva do contexto]</a>

════════════════════════════════════════
REGRAS DE SEO
════════════════════════════════════════
• palavra-chave principal: "${mainKeyword}" (use com densidade de 1–2%)
• Palavras-chave secundárias: ${otherKeywords} (distribua naturalmente)
• Use <b> para destacar palavras-chave, sinônimos e termos estratégicos
• Tamanho mínimo: ${settings.minWords} palavras
• Tom: ${settings.tone} | Público: ${settings.targetAudience} | Nível: ${settings.languageLevel}

════════════════════════════════════════
ESTRUTURA DO ARTIGO
════════════════════════════════════════
• Lide forte que prende o leitor
• Exposição dos fatos com contexto e dados
• Explicações aprofundadas com exemplos práticos
• Depoimentos ou declarações de especialistas do setor (podem ser simulados mas realistas)
• Ponto de vista editorial pessoal (mais próximo do final)
${settings.includeFAQ ? "• Seção de Perguntas Frequentes ao final: use <h3> para as perguntas e <p> para as respostas" : ""}

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
Este é o artigo NÚMERO ${index} de ${quantity} sobre o mesmo tema.
Aborde um ângulo COMPLETAMENTE DIFERENTE dos outros artigos da série.
Use dados, estudos, casos ou perspectivas distintas a cada artigo.

════════════════════════════════════════
RECAPITULAÇÃO FINAL — NÃO PULE NADA (OBRIGATÓRIO)
════════════════════════════════════════
Você SÓ terá sucesso se o seu HTML seguir estas 3 regras cruciais:
1. IMAGEM COM LINK: Uma tag <img> envolvida em um link <a> para "${url}".
2. LINK INTERNO: Um link <a> no texto para "${url}" usando a palavra-chave.
3. LINK EXTERNO: Um link <a> para Wikipedia ou fonte de autoridade no MEIO do artigo.

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
  });
  return response.text ?? "";
}

// ─────────────────────────────────────────────
// OPENAI
// ─────────────────────────────────────────────
async function generateWithOpenAI(prompt: string, apiKey: string, model: string): Promise<string> {
  const isReasoningModel = model.startsWith('o1') || model.startsWith('o3');

  const body: Record<string, unknown> = {
    model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  if (!isReasoningModel) {
    body.temperature = 0.8;
    body.max_tokens = 4096;
  } else {
    body.max_completion_tokens = 4096;
  }

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
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
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
// MAIN EXPORT
// ─────────────────────────────────────────────
export async function generateArticles(params: ArticleParams): Promise<GeneratedArticle[]> {
  const { clientName, quantity, settings } = params;
  const { selectedModel, aiKeys } = settings;
  const provider = getProviderFromModel(selectedModel);

  const apiKey = {
    gemini: aiKeys.geminiKey,
    openai: aiKeys.openaiKey,
    anthropic: aiKeys.anthropicKey,
  }[provider];

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
      filename: `${i}${clientName.replace(/\s+/g, "_").toLowerCase()}.html`,
      date: new Date().toISOString(),
      clientName,
    });
  }

  return articles;
}
