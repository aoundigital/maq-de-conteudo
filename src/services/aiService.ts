import { GoogleGenAI } from "@google/genai";
import { AppSettings, getProviderFromModel } from "../types";
import DOMPurify from "dompurify";

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

// IMAGE URL
function buildImageUrl(mainKeyword: string, imageStyle: string): string {
  const query = imageStyle?.trim()
    ? encodeURIComponent(`${mainKeyword},${imageStyle.replace(/\s+/g, ",")}`)
    : encodeURIComponent(mainKeyword);
  return `https://loremflickr.com/1200/628/${query}?lock=${Math.floor(Math.random() * 1000)}`;
}

// CVE-7: Sanitize AI-generated HTML to prevent stored XSS
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["h1", "h2", "h3", "p", "a", "img", "b", "ul", "ol", "li", "strong", "em", "br"],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "style"],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

// PROMPT BUILDER
function buildPrompt(params: ArticleParams, index: number): string {
  const { quantity, mainKeyword, otherKeywords, url, settings } = params;
  const imageUrl = buildImageUrl(mainKeyword, settings.imageStyle ?? "");
  const minWords = settings.minWords ?? 800;
  const pCount = Math.max(18, Math.ceil(minWords / 65));
  const h2Count = Math.max(7, Math.ceil(minWords / 150));

  return `You are a Chief Editor of a major news portal and SEO authority.
Your mission is to produce an epic MEGAPOST about "${mainKeyword}" in Brazilian Portuguese (pt-BR).

PERFORMANCE TARGETS (MANDATORY)
- Write AT LEAST ${minWords} WORDS.
- Use exactly ${h2Count} subheadings (<h2>) to divide the content.
- Write at least ${pCount} long paragraphs (minimum 100 words per paragraph).

TECHNICAL RULES
- Tone: ${settings.tone} | Level: ${settings.languageLevel}
- Format: PURE HTML (<h1>, <h2>, <p>, <a>, <img>, <b>).
- SUBHEADING STYLE: DO NOT use explanatory prefixes with a colon in your subheadings (e.g., NEVER write "Visão geral: Conceito", "Análise detalhada: Dados", or "Conclusão: Resumo"). Subheadings must be direct, engaging, and without any descriptive labels or colons explaining the section.
- Image tag (insert after the 1st H2): <a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${imageUrl}" alt="${mainKeyword}" style="width:100%; border-radius:12px; margin:30px 0;"></a>
- Internal link: Link to "${url}" using "${mainKeyword}" as anchor text.
- External link: Link to a global authority source in the middle of the text.
- Secondary keywords to include naturally: ${otherKeywords}.

STRUCTURE
1. INTRO: Deep impact of "${mainKeyword}".
2. OVERVIEW: What it is, foundations, and why it matters now.
3. IN-DEPTH ANALYSIS: Data, statistics, and trends.
4. PRACTICAL GUIDE: Step-by-step implementation.
5. CHALLENGES AND MYTHS: Common misconceptions.
6. USE CASES: Detailed examples and success stories.
7. THE FUTURE: Where this topic is heading.
${settings.includeFAQ ? "8. FAQ: 5 questions with complete answers." : ""}

This is article number ${index} of ${quantity}. It MUST approach a different angle.

Return ONLY the pure HTML starting with <h1>.`;
}

// GEMINI
async function generateWithGemini(prompt: string, apiKey: string, model: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  
  // Trata nomenclaturas comerciais para as chaves reais de API (v1beta do Google)
  let actualModel = model;
  if (model.includes("3.1-pro") || model.includes("3.0-pro")) {
    actualModel = "gemini-2.0-pro-exp-02-05";
  } else if (model.includes("3.1-flash") || model.includes("3.0-flash")) {
    actualModel = "gemini-2.0-flash";
  }

  const response = await ai.models.generateContent({
    model: actualModel,
    contents: prompt,
    config: { maxOutputTokens: 8192, temperature: 0.8 },
  });
  return response.text ?? "";
}

// OPENAI
function getOpenAIMaxTokens(model: string): number {
  if (model === "gpt-4o" || model === "gpt-4o-mini" || model === "gpt-4.5-preview") return 16384;
  if (model.startsWith("o1") || model.startsWith("o3")) return 32768;
  return 4096;
}

async function generateWithOpenAI(prompt: string, apiKey: string, model: string): Promise<string> {
  const isLogicModel = model.startsWith("o1") || model.startsWith("o3");
  
  const body: any = {
    model,
    messages: [{ role: "user", content: prompt }],
  };

  // Logic models do not tolerate "temperature" and use "max_completion_tokens"
  if (isLogicModel) {
    body.max_completion_tokens = getOpenAIMaxTokens(model);
  } else {
    body.temperature = 0.8;
    body.max_tokens = getOpenAIMaxTokens(model);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenAI error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }
  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

// ANTHROPIC
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
  return data.content.find((c) => c.type === "text")?.text ?? "";
}

// GROQ
async function generateWithGroq(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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

// MISTRAL
async function generateWithMistral(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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

// MAIN EXPORT
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
    throw new Error(`API key not configured for provider ${provider}. Go to Settings -> AI Keys.`);
  }

  const articles: GeneratedArticle[] = [];

  for (let i = 1; i <= quantity; i++) {
    const prompt = buildPrompt(params, i);
    let rawHtml = "";

    switch (provider) {
      case "gemini":
        rawHtml = await generateWithGemini(prompt, apiKey, selectedModel);
        break;
      case "openai":
        rawHtml = await generateWithOpenAI(prompt, apiKey, selectedModel);
        break;
      case "anthropic":
        rawHtml = await generateWithAnthropic(prompt, apiKey, selectedModel);
        break;
      case "groq":
        rawHtml = await generateWithGroq(prompt, apiKey, selectedModel);
        break;
      case "mistral":
        rawHtml = await generateWithMistral(prompt, apiKey, selectedModel);
        break;
    }

    // Strip markdown code fences
    rawHtml = rawHtml
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    // CVE-7: Sanitize before storing - prevents stored XSS
    const htmlContent = sanitizeHtml(rawHtml);

    const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch
      ? titleMatch[1].replace(/<[^>]+>/g, "")
      : `Article ${i} - ${params.mainKeyword}`;

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
